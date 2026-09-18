// Supabase Edge Function: takbull-ipn
//
// Receives Takbull's Instant Payment Notification (a GET callback with
// ?uniqId=...&order_reference=...&statusCode=...). Never trust these query
// params on their own — always confirm with the server-to-server
// ValidateNotification call before marking an order paid. On confirmed
// success, logs a transaction row and sends the confirmation email exactly
// once, even though Takbull's "guaranteed delivery" may call this more than
// once for the same payment. Deploy with --no-verify-jwt (Takbull calls this
// with no Supabase auth token) and register this function's URL as
// IPNAddress (already sent automatically by create-takbull-payment).
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendOrderConfirmationEmail } from "../_shared/email.ts";

const TAKBULL_API_KEY = Deno.env.get("TAKBULL_API_KEY") ?? "";
const TAKBULL_API_SECRET = Deno.env.get("TAKBULL_API_SECRET") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  try {
    const uniqId = new URL(req.url).searchParams.get("uniqId");
    if (!uniqId) return new Response("missing uniqId", { status: 400 });

    const validateRes = await fetch("https://api.takbull.co.il/api/ExtranalAPI/ValidateNotification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        API_Key: TAKBULL_API_KEY,
        API_Secret: TAKBULL_API_SECRET,
      },
      body: JSON.stringify({ uniqId }),
    });
    const result = await validateRes.json();

    if (result.internalCode === 0) {
      // Atomic guard: only the request that actually flips pending -> paid
      // gets a row back, so a repeated IPN can't send a second email.
      const { data: updated, error } = await supabase
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("takbull_uniq_id", uniqId)
        .neq("payment_status", "paid")
        .select()
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("failed to mark order paid", uniqId, error.message);
      } else if (updated) {
        await supabase.from("transactions").insert({
          order_id: updated.id,
          provider: "takbull",
          provider_txn_id: String(result.orderId ?? uniqId),
          status: "succeeded",
          amount: Number(result.amount) || updated.total,
          currency: "ILS",
          raw: result,
        });
        if (!updated.is_test) {
          for (const it of updated.items || []) {
            if (it.id === "test") continue;
            await supabase.rpc("decrement_stock", { p_id: it.id, p_qty: it.qty }).then(
              ({ error: rpcErr }) => rpcErr && console.error("stock decrement failed", it.id, rpcErr.message)
            );
          }
        }
        if (updated.coupon_code) {
          // Atomic guard, same idea as the orders update above: only redeem
          // once, even if Takbull redelivers the same IPN.
          await supabase
            .from("coupons")
            .update({ status: "redeemed", redeemed_at: new Date().toISOString(), order_id: updated.id })
            .eq("code", updated.coupon_code)
            .eq("status", "active")
            .then(({ error: couponErr }) => couponErr && console.error("coupon redemption failed", updated.coupon_code, couponErr.message));
        }
        await sendOrderConfirmationEmail(updated).catch((e) => console.error("email send failed", e));
      }
    } else {
      // Takbull redelivers the IPN while a payment is still processing, and
      // non-zero internalCode values aren't fully documented (some mean
      // "declined", some mean "still on hold") — so this is logged as a
      // review-worthy audit row, not asserted as a final "failed" outcome.
      console.error("takbull validation not-yet-successful", uniqId, result.internalCode, result.internalDescription);
      const { data: order } = await supabase.from("orders").select("id").eq("takbull_uniq_id", uniqId).single();
      if (order) {
        await supabase.from("transactions").insert({
          order_id: order.id,
          provider: "takbull",
          provider_txn_id: String(result.orderId ?? uniqId),
          status: "not_paid",
          amount: Number(result.amount) || 0,
          currency: "ILS",
          raw: result,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
