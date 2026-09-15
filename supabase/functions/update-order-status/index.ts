// Supabase Edge Function: update-order-status
//
// The ONLY way order status changes in this app — both the Orders-list
// dropdown and the order-detail overlay in the admin panel call this, so
// there is exactly one place a status-change notification can fire from
// (previously, the admin panel wrote `orders.status` straight to the table
// via RLS, with no notification hook at all).
//
// Deployed with --no-verify-jwt, same as every other function in this repo
// (see README "סליקת אשראי — Takbull" for why: the CORS preflight carries no
// Authorization header, so platform-level verify_jwt blocks it before the
// function even runs). Authorization is instead done in code via
// isAdminRequest, exactly like the admin-only testAmount path in
// create-takbull-payment.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isAdminRequest } from "../_shared/adminAuth.ts";
import { sendOrderStatusEmail } from "../_shared/email.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const VALID_STATUSES = ["התקבלה", "בהכנה", "נשלחה", "בדרך", "נמסר", "בוטלה"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!(await isAdminRequest(req))) return json({ error: "אין הרשאה" });

    const { id, status } = await req.json();
    if (!id || typeof id !== "string") return json({ error: "מזהה הזמנה חסר" });
    if (!VALID_STATUSES.includes(status)) return json({ error: "סטטוס לא תקין" });

    const { data: current, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchErr || !current) return json({ error: "הזמנה לא נמצאה" });

    // No real change — don't send a duplicate email/history row if the
    // admin re-saves the same status (e.g. reopening the detail overlay).
    if (current.status === status) return json({ order: current });

    const { data: updated, error: updateErr } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    let notified = false;
    if (!updated.is_test) {
      try {
        await sendOrderStatusEmail(updated, status);
        notified = true;
      } catch (e) {
        console.error("status email failed", id, e);
      }
    }

    await supabase.from("order_status_history").insert({ order_id: id, status, notified });

    return json({ order: updated });
  } catch (e) {
    console.error(e);
    return json({ error: e.message || "עדכון הסטטוס נכשל" });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
