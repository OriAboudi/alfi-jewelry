// Supabase Edge Function: signup-coupon
//
// Public, guest-callable (deployed --no-verify-jwt, same reasoning as every
// other public function here — see README). A shopper submits name/email/
// phone from the sign-up pop-up; this issues a one-time 5% (admin-
// configurable) discount coupon, emails it via Resend, and also returns it
// directly so the pop-up can show it on-screen even if the email is slow or
// fails. Re-signing up with an email that already has an active coupon
// returns that same coupon instead of minting a duplicate.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { sendSignupCouponEmail } from "../_shared/email.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids ambiguity when read aloud/typed

function generateCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return "ALFI-" + s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, email: rawEmail, phone: rawPhone } = await req.json();

    const email = String(rawEmail || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "כתובת אימייל לא תקינה" });
    const phoneDigits = String(rawPhone || "").replace(/[^\d]/g, "");
    if (!/^0\d{8,9}$/.test(phoneDigits)) return json({ error: "מספר טלפון לא תקין" });
    const cleanName = String(name || "").trim();
    if (!cleanName) return json({ error: "שדה חובה חסר: שם" });

    const { data: contentRow } = await supabase.from("content").select("data").eq("id", 1).single();
    const cfg = contentRow?.data || {};
    if (cfg.signupCouponEnabled === false) return json({ error: "ההרשמה אינה זמינה כרגע" });
    const percent = Number(cfg.signupCouponPercent || 5);

    // Idempotent re-signup: don't spam a second code to the same inbox.
    const { data: existing } = await supabase
      .from("coupons")
      .select("code, percent")
      .eq("email", email)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return json({ code: existing.code, percent: Number(existing.percent) });

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
      else if (error.code !== "23505") throw error; // 23505 = unique_violation, retry with a new code
    }
    if (!inserted) return json({ error: "יצירת הקופון נכשלה, נסי שוב" });

    await sendSignupCouponEmail({ name: cleanName, email, code, percent }).catch((e) =>
      console.error("signup coupon email failed", email, e)
    );

    return json({ code, percent });
  } catch (e) {
    console.error(e);
    return json({ error: e.message || "ההרשמה נכשלה" });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
