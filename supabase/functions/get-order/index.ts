// Supabase Edge Function: get-order
//
// Lets a guest customer look up their own order's live status after
// returning from a payment gateway redirect — RLS ("orders admin read")
// deliberately blocks anon SELECT on orders, so the client can't otherwise
// see whether the payment actually cleared. Protected by the order id being
// an unguessable UUID (the same capability the success redirect URL already
// exposes), not by auth. Returns only display-safe fields — no internal
// gateway ids.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string") return json({ error: "מזהה הזמנה חסר" });

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, number, items, subtotal, shipping, discount, coupon_code, total, status, payment_status, payment_method, shipping_address, created_at")
      .eq("id", id)
      .single();
    if (error || !order) return json({ error: "הזמנה לא נמצאה" });

    const { data: history } = await supabase
      .from("order_status_history")
      .select("status, changed_at")
      .eq("order_id", id)
      .order("changed_at", { ascending: true });

    return json({ order: { ...order, history: history || [] } });
  } catch (e) {
    console.error(e);
    return json({ error: e.message || "שגיאה בטעינת ההזמנה" });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
