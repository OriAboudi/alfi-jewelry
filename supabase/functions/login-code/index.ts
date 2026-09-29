// Supabase Edge Function: login-code
//
// Customer sign-in without a password: email + mobile → a 6-digit code by
// email → a session. Public (deployed --no-verify-jwt like every guest-
// callable function here). Two actions:
//
//   { action: "send",   email, phone }  → emails a new code  → { ok: true }
//   { action: "verify", email, code }   → { token_hash }
//
// The browser exchanges token_hash for a normal Supabase session with
// supabase.auth.verifyOtp({ token_hash, type: "magiclink" }). The first
// successful sign-in creates the account (email already proven by the code);
// the mobile number is kept on the account (user_metadata.phone).
//
// Emails go out through Resend with the store's branded template, not
// Supabase Auth's mailer (that one is limited to a few emails an hour).
//
// Safety: only a SHA-256 hash of the code is stored (supabase/add-email-
// login-codes.sql); a code lives 10 minutes and allows 5 wrong tries;
// sending is rate-limited per IP and per email with a short cooldown, so this
// can't be used to flood an inbox. The admin's email works too (it signs in
// as the admin and the site opens the admin panel) — "send" answers the same
// for every address, so it never reveals which email is the admin's.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { sendLoginCodeEmail } from "../_shared/email.ts";
import { clientIp, withinRateLimit, secureRandomInt, cleanString } from "../_shared/security.ts";

const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", SERVICE_KEY);

const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 45;

const EXPIRED = "הקוד פג תוקף, אפשר לבקש קוד חדש";

async function hashCode(email: string, code: string) {
  // Peppered with the service key, so a leaked table can't be brute-forced
  // offline (6 digits alone would fall instantly).
  const bytes = new TextEncoder().encode(`${email}:${code}:${SERVICE_KEY}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sameHash(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function userIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("auth_user_id_by_email", { p_email: email });
  if (error) throw error;
  return data || null;
}

async function isAdmin(userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = String(body?.action || "");
    const email = cleanString(body?.email, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "כתובת אימייל לא תקינה" });

    if (action === "send") {
      const phone = String(body?.phone || "").replace(/[^\d]/g, "");
      if (!/^05\d{8}$/.test(phone)) return json({ error: "מספר נייד לא תקין" });

      if (!(await withinRateLimit(supabase, `logincode:ip:${clientIp(req)}`, 10, 3600)) ||
          !(await withinRateLimit(supabase, `logincode:email:${email}`, 5, 3600))) {
        return json({ error: "יותר מדי בקשות, נסי שוב מאוחר יותר" });
      }

      const { data: pending } = await supabase.from("login_codes").select("created_at").eq("email", email).maybeSingle();
      if (pending && Date.now() - new Date(pending.created_at).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
        return json({ error: "רגע, קוד נשלח זה עתה. אפשר לבקש קוד חדש בעוד פחות מדקה." });
      }

      const code = String(secureRandomInt(1_000_000)).padStart(6, "0");
      const { error: upsertError } = await supabase.from("login_codes").upsert({
        email,
        phone,
        code_hash: await hashCode(email, code),
        expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
        attempts: 0,
        created_at: new Date().toISOString(),
      });
      if (upsertError) throw upsertError;

      const sent = await sendLoginCodeEmail({ email, code, minutes: CODE_MINUTES });
      if (!sent.ok) {
        console.error("login code email failed", email, sent.error);
        await supabase.from("login_codes").delete().eq("email", email);
        return json({ error: "שליחת המייל נכשלה, נסי שוב בעוד רגע" });
      }
      return json({ ok: true });
    }

    if (action === "verify") {
      const code = String(body?.code || "").replace(/\D/g, "");
      if (code.length !== 6) return json({ error: "הקוד צריך להכיל 6 ספרות" });
      if (!(await withinRateLimit(supabase, `logincode:verify:ip:${clientIp(req)}`, 30, 3600))) {
        return json({ error: "יותר מדי ניסיונות, נסי שוב מאוחר יותר" });
      }

      const { data: row, error: rowError } = await supabase.from("login_codes").select("*").eq("email", email).maybeSingle();
      if (rowError) throw rowError;
      if (!row || new Date(row.expires_at).getTime() < Date.now() || row.attempts >= MAX_ATTEMPTS) {
        if (row) await supabase.from("login_codes").delete().eq("email", email);
        return json({ error: EXPIRED });
      }

      if (!sameHash(await hashCode(email, code), row.code_hash)) {
        const attempts = row.attempts + 1;
        await supabase.from("login_codes").update({ attempts }).eq("email", email);
        const left = MAX_ATTEMPTS - attempts;
        return json({ error: left > 0 ? `הקוד שגוי. נשארו ${left} ניסיונות.` : EXPIRED });
      }

      // Correct: the code is single-use.
      await supabase.from("login_codes").delete().eq("email", email);

      let userId = await userIdByEmail(email);
      if (userId && (await isAdmin(userId))) {
        // The store's admin email: signed in as the admin (the browser then
        // opens the admin panel). The admin's profile is left untouched.
      } else if (userId) {
        const { data: got } = await supabase.auth.admin.getUserById(userId);
        const meta = got?.user?.user_metadata || {};
        // The code proved the email, so an account from the old password
        // sign-up that was never confirmed is confirmed now; the latest
        // mobile number is kept on the account.
        const patch: Record<string, unknown> = {};
        if (!got?.user?.email_confirmed_at) patch.email_confirm = true;
        if (row.phone && meta.phone !== row.phone) patch.user_metadata = { ...meta, phone: row.phone };
        if (Object.keys(patch).length) await supabase.auth.admin.updateUserById(userId, patch);
      } else {
        // First sign-in: create the account. The name comes from the
        // sign-up coupon form when this email used it.
        const { data: coupon } = await supabase.from("coupons").select("name").eq("email", email).limit(1).maybeSingle();
        const { data: created, error: createError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { name: coupon?.name || "", phone: row.phone },
        });
        if (createError) throw createError;
        userId = created.user.id;
      }

      const { data: link, error: linkError } = await supabase.auth.admin.generateLink({ type: "magiclink", email });
      if (linkError) throw linkError;
      return json({ token_hash: link.properties.hashed_token });
    }

    return json({ error: "פעולה לא מוכרת" });
  } catch (e) {
    console.error(e);
    return json({ error: "ההתחברות נכשלה, נסי שוב" });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
