// Supabase Edge Function: signup-coupon
//
// Public, guest-callable (deployed --no-verify-jwt, same reasoning as every
// other public function here — see README). A shopper submits name/email/
// phone from the sign-up pop-up; this issues a one-time 5% (admin-
// configurable) discount coupon, emails it via Resend, and also returns it
// directly so the pop-up can show it on-screen even if the email is slow or
// fails.
//
// ONE coupon per person, ever: it's a sign-up offer, handed out exactly once
// at registration. If the email OR phone already has a coupon in any state
// (active, redeemed or void), nothing is issued and the existing code is
// never re-shown — otherwise anyone who knows a customer's email could read
// their code back, and re-signing up after redeeming would mint a new one.
// Unique indexes on coupons.email / coupons.phone (owasp-remediation.sql)
// back this up against two simultaneous sign-ups racing past the check.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { sendSignupCouponEmail } from "../_shared/email.ts";
import { clientIp, withinRateLimit, secureRandomString, cleanString } from "../_shared/security.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const ALREADY_REGISTERED = "כבר נרשמת בעבר — קוד ההנחה ניתן פעם אחת בלבד, בהרשמה הראשונה.";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids ambiguity when read aloud/typed

// Coupon codes are bearer secrets (validate-coupon accepts any valid one),
// so they're drawn from the CSPRNG — Math.random() output is predictable.
function generateCode() {
  return "ALFI-" + secureRandomString(CODE_CHARS, 6);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, email: rawEmail, phone: rawPhone } = await req.json();

    const email = cleanString(rawEmail, 254).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "כתובת אימייל לא תקינה" });
    const phoneDigits = String(rawPhone || "").replace(/[^\d]/g, "");
    if (!/^0\d{8,9}$/.test(phoneDigits)) return json({ error: "מספר טלפון לא תקין" });
    const cleanName = cleanString(name, 80);
    if (!cleanName) return json({ error: "שדה חובה חסר: שם" });

    // Every new sign-up mints a coupon AND sends an email from the store's
    // domain — cap it so the endpoint can't be used to mass-mint codes or
    // as a spam relay to arbitrary inboxes.
    if (!(await withinRateLimit(supabase, `signup:ip:${clientIp(req)}`, 5, 3600))) {
      return json({ error: "יותר מדי ניסיונות, נסי שוב מאוחר יותר" });
    }

    const { data: contentRow } = await supabase.from("content").select("data").eq("id", 1).single();
    const cfg = contentRow?.data || {};
    if (cfg.signupCouponEnabled === false) return json({ error: "ההרשמה אינה זמינה כרגע" });
    const percent = Number(cfg.signupCouponPercent || 5);

    // Two plain .eq() lookups rather than one .or(`email.eq.${email},...`):
    // .or() takes a raw PostgREST filter string, and the email regex above
    // allows commas/parentheses — interpolating it would be filter injection.
    const [byEmail, byPhone] = await Promise.all([
      supabase.from("coupons").select("id").eq("email", email).limit(1),
      supabase.from("coupons").select("id").eq("phone", phoneDigits).limit(1),
    ]);
    if (byEmail.error) throw byEmail.error;
    if (byPhone.error) throw byPhone.error;
    if (byEmail.data?.length || byPhone.data?.length) return json({ error: ALREADY_REGISTERED });

    let code = "";
    let inserted = null;
    for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
      code = generateCode();
      const { data, error } = await supabase
        .from("coupons")
        .insert({ code, name: cleanName, email, phone: phoneDigits, percent })
        .select()
        .single();
      if (!error) inserted = data;
      else if (error.code !== "23505") throw error;
      // 23505 = unique_violation. On the code column it's a random collision
      // (retry with a new code); on email/phone it's a concurrent sign-up by
      // the same person that won the race.
      else if (!/coupons_code_key/.test(error.message)) return json({ error: ALREADY_REGISTERED });
    }
    if (!inserted) return json({ error: "יצירת הקופון נכשלה, נסי שוב" });

    await sendSignupCouponEmail({ name: cleanName, email, code, percent }).catch((e) =>
      console.error("signup coupon email failed", email, e)
    );

    return json({ code, percent });
  } catch (e) {
    console.error(e);
    return json({ error: "ההרשמה נכשלה" });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
