// Supabase Edge Function: send-order-email
//
// Admin-only (isAdminRequest), deployed --no-verify-jwt like every other
// function here. Sends an admin-written message about one order to that
// order's customer — the ONLY way customers get status emails now (status
// changes themselves no longer email anyone; the Orders tab offers this
// right after a change, pre-filled from the status template, and it can be
// used at any time for any message).
//
// Recipient is always read from the order row, never taken from the
// request, so this can't be used to email arbitrary addresses from the
// store's domain. Every attempt is logged to order_emails.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isAdminRequest } from "../_shared/adminAuth.ts";
import { sendCustomOrderEmail } from "../_shared/email.ts";
import { cleanString } from "../_shared/security.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!(await isAdminRequest(req))) return json({ error: "אין הרשאה" });

    const body = await req.json();
    const id = String(body?.id || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return json({ error: "מזהה הזמנה חסר" });
    const subject = cleanString(body?.subject, 150);
    const message = cleanString(body?.message, 5000);
    if (!subject) return json({ error: "יש להזין נושא למייל" });
    if (!message) return json({ error: "יש להזין תוכן למייל" });

    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("id, number, items, subtotal, shipping, discount, coupon_code, total, payment_status, shipping_address")
      .eq("id", id)
      .single();
    if (fetchErr || !order) return json({ error: "הזמנה לא נמצאה" });

    const to = String(order.shipping_address?.email || "");
    const result = await sendCustomOrderEmail(order, subject, message);

    if (to) {
      await supabase.from("order_emails").insert({
        order_id: id,
        to_email: to,
        subject,
        body: message,
        status: result.ok ? "sent" : "failed",
        error: result.ok ? null : result.error,
      }).then(({ error }) => error && console.error("order_emails log failed", id, error.message));
    }

    if (!result.ok) return json({ error: result.error });
    return json({ ok: true, to });
  } catch (e) {
    console.error(e);
    return json({ error: "שליחת המייל נכשלה" });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
