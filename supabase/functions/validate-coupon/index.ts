// Supabase Edge Function: validate-coupon
//
// Public, guest-callable (--no-verify-jwt). A lightweight, NON-redeeming
// lookup used by the product-page / cart / checkout "apply coupon" UI so the
// shopper gets instant feedback ("✓ 5% הנחה") without spending the code.
// Actual redemption only ever happens server-side in create-takbull-payment
// (discount applied) + takbull-ipn (marked redeemed on confirmed payment).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { clientIp, withinRateLimit, cleanString } from "../_shared/security.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code: rawCode } = await req.json();
    const code = cleanString(rawCode, 32).toUpperCase();
    if (!code) return json({ error: "יש להזין קוד קופון" });

    // Stops brute-forcing the coupon code space from a single client.
    if (!(await withinRateLimit(supabase, `coupon-check:ip:${clientIp(req)}`, 20, 600))) {
      return json({ error: "יותר מדי ניסיונות, נסי שוב בעוד כמה דקות" });
    }

    const { data: coupon } = await supabase.from("coupons").select("*").eq("code", code).maybeSingle();
    if (!coupon) return json({ error: "קוד קופון לא נמצא" });
    if (coupon.status === "redeemed") return json({ error: "קוד הקופון כבר נוצל" });
    if (coupon.status === "void") return json({ error: "קוד הקופון בוטל" });
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return json({ error: "קוד הקופון פג תוקף" });

    return json({ valid: true, percent: Number(coupon.percent) || 0 });
  } catch (e) {
    console.error(e);
    return json({ error: "בדיקת הקופון נכשלה" });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
