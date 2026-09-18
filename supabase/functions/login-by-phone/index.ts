// Supabase Edge Function: login-by-phone
//
// Public, guest-callable (--no-verify-jwt, same reasoning as every other
// public function here — see README). The header's user icon lets a
// returning shopper "log in" by phone number instead of a real account
// (this site is guest-checkout-only, see StoreContext.jsx). This just looks
// up the most recent coupons-table row for that phone number — sign-up is
// the only place a name/email/phone is ever collected — and hands back the
// display name/email plus their coupon if it's still active/unredeemed.
// Never exposes the coupons table to the client directly (see
// add-signup-coupons.sql: RLS on `coupons` allows zero direct access).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone: rawPhone } = await req.json();
    const phoneDigits = String(rawPhone || "").replace(/[^\d]/g, "");
    if (!/^0\d{8,9}$/.test(phoneDigits)) return json({ error: "מספר טלפון לא תקין" });

    const { data: match } = await supabase
      .from("coupons")
      .select("name, email, code, percent, status")
      .eq("phone", phoneDigits)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!match) return json({ found: false });

    return json({
      found: true,
      name: match.name,
      email: match.email,
      coupon: match.status === "active" ? { code: match.code, percent: Number(match.percent) } : null,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e.message || "ההתחברות נכשלה" });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
