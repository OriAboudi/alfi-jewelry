// Supabase Edge Function: login-by-phone
//
// Public, guest-callable (--no-verify-jwt, same reasoning as every other
// public function here — see README). The header's user icon lets a
// returning shopper "log in" by phone number instead of a real account
// (this site is guest-checkout-only, see StoreContext.jsx). This just looks
// up the most recent coupons-table row for that phone number — sign-up is
// the only place a name/email/phone is ever collected — and hands back the
// display name. It never returns a coupon: the sign-up coupon is a one-time
// offer shown only at registration (see signup-coupon).
// Never exposes the coupons table to the client directly (see
// add-signup-coupons.sql: RLS on `coupons` allows zero direct access).
//
// There's no proof the caller owns the phone number (no OTP), so this must
// never reveal more than the greeting needs: first name only, never the
// email address or full name — otherwise it's a phone-number → PII lookup
// for anyone. Rate-limited per IP and per phone number to stop bulk
// enumeration of the customer list.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { clientIp, withinRateLimit } from "../_shared/security.ts";

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

    const tooMany = !(await withinRateLimit(supabase, `phone-login:ip:${clientIp(req)}`, 10, 900)) ||
      !(await withinRateLimit(supabase, `phone-login:phone:${phoneDigits}`, 5, 900));
    if (tooMany) return json({ error: "יותר מדי ניסיונות, נסי שוב בעוד כמה דקות" });

    const { data: match } = await supabase
      .from("coupons")
      .select("name")
      .eq("phone", phoneDigits)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!match) return json({ found: false });

    return json({
      found: true,
      name: String(match.name || "").trim().split(/\s+/)[0] || "",
    });
  } catch (e) {
    console.error(e);
    return json({ error: "ההתחברות נכשלה" });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
