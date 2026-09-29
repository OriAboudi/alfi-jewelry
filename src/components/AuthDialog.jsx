import React, { useEffect, useRef, useState } from "react";
import { css } from "../lib/css.js";
import { isValidEmail, formatIsraeliPhone } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";
import { useDialog } from "../hooks/useDialog.js";
import { PrivacyConsent } from "./PrivacyConsent.jsx";
import { BrandDialog, preloadBrandImages, brandLabel, brandField, brandFieldErr, brandErrMsg, brandTitle, brandLead, brandLink } from "./BrandDialog.jsx";

const RESEND_SECONDS = 45;
const isMobile = (v) => /^05\d{8}$/.test(String(v || "").replace(/\D/g, ""));

const readLastContact = () => {
  try { return JSON.parse(localStorage.getItem("alfi:lastContact") || "null") || {}; } catch { return {}; }
};
const readAgreed = () => {
  try { return localStorage.getItem("alfi:privacyAgreed") === "1"; } catch { return false; }
};

/**
 * AuthDialog — sign-in without a password, in two steps, in the same brand
 * pop-up as the sign-up coupon (BrandDialog):
 *   1. email + mobile → "שליחת קוד" (a 6-digit code goes to the email)
 *   2. the code → signed in. The first sign-in creates the account; the
 *      store's admin email lands in the admin panel instead.
 * Opened with openAuth() from the header, the mobile menu, the account and
 * favorites pages, and the coupon pop-up's "כבר יש לך חשבון?".
 */
export function AuthDialog() {
  const { authDialog, closeAuth, requestLoginCode, verifyLoginCode, signupCouponAvailable, switchToSignup, content: C } = useStore();
  const open = !!authDialog;
  const [step, setStep] = useState("details"); // "details" | "code"
  const [form, setForm] = useState({ email: "", phone: "" });
  const [code, setCode] = useState("");
  // Field errors appear only after the first send attempt, never on blur: a
  // message appearing on blur pushes the consent checkbox down between
  // mousedown and mouseup, and the click on it gets lost.
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef(null);

  // Warm the pop-up's images up in the background, so a click opens it
  // fully painted.
  useEffect(() => {
    const t = setTimeout(preloadBrandImages, 2500);
    return () => clearTimeout(t);
  }, []);

  // Every opening starts at step 1, pre-filled with the details this device
  // used last (sign-in or the sign-up coupon form).
  useEffect(() => {
    if (!open) return;
    const last = readLastContact();
    setForm((f) => ({ email: f.email || last.email || "", phone: f.phone || (last.phone ? formatIsraeliPhone(last.phone) : "") }));
    setAgreed(readAgreed());
    setStep("details"); setCode(""); setTouched(false); setError(""); setAgreeError(""); setBusy(false);
  }, [open]);

  // "Send again" countdown.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => { if (step === "code") codeRef.current?.focus(); }, [step]);

  const panelRef = useDialog(open, closeAuth, { initialFocus: "input" });
  if (!open) return null;

  const errors = {
    email: form.email.trim() ? (isValidEmail(form.email) ? "" : "כתובת אימייל לא תקינה") : "שדה חובה",
    phone: form.phone.trim() ? (isMobile(form.phone) ? "" : "מספר נייד לא תקין") : "שדה חובה",
  };

  const sendCode = async (e) => {
    e?.preventDefault();
    setTouched(true);
    if (!agreed) setAgreeError("יש לאשר את מדיניות הפרטיות כדי להמשיך");
    if (errors.email || errors.phone || !agreed) return;
    setBusy(true); setError("");
    try {
      await requestLoginCode({ email: form.email.trim(), phone: form.phone.replace(/\D/g, "") });
      try { localStorage.setItem("alfi:privacyAgreed", "1"); } catch { /* ignore */ }
      setStep("code"); setCode(""); setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.message || "שליחת הקוד נכשלה, נסי שוב");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6 || busy) return;
    setBusy(true); setError("");
    try {
      await verifyLoginCode({ email: form.email.trim(), code: value });
    } catch (err) {
      setError(err.message || "ההתחברות נכשלה, נסי שוב");
      setCode("");
      requestAnimationFrame(() => codeRef.current?.focus());
    } finally {
      setBusy(false);
    }
  };

  const onCode = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(v);
    if (error) setError("");
    if (v.length === 6) verify(v); // pasted / autofilled: sign in right away
  };

  const field = (k, label, opts) => {
    const bad = touched && errors[k];
    return (
      <div>
        <label htmlFor={`auth-${k}`} style={css(brandLabel)}>{label}</label>
        <input
          id={`auth-${k}`}
          name={k}
          type={opts.type}
          inputMode={opts.inputMode}
          dir="ltr"
          autoComplete={opts.autoComplete}
          required
          aria-required="true"
          aria-invalid={!!bad}
          aria-describedby={bad ? `auth-${k}-err` : undefined}
          value={form[k]}
          onChange={(e) => setForm((f) => ({ ...f, [k]: k === "phone" ? formatIsraeliPhone(e.target.value) : e.target.value }))}
          placeholder={opts.placeholder}
          style={css((bad ? brandFieldErr : brandField) + "text-align:right;")}
        />
        {bad && <div id={`auth-${k}-err`} role="alert" style={css(brandErrMsg)}>{errors[k]}</div>}
      </div>
    );
  };

  // New here and the first-order coupon is still on offer: point to it.
  const footer = step === "details" && signupCouponAvailable && (
    <>חדשה ב‑ALFI? <button type="button" onClick={switchToSignup} style={css(brandLink + "padding:4px 2px;")}>{C.signupCouponPercent || 5}% הנחה על ההזמנה הראשונה</button></>
  );

  return (
    <BrandDialog panelRef={panelRef} labelledBy="auth-title" onClose={closeAuth} footer={footer}>
      {step === "details" ? (
        <form onSubmit={sendCode} noValidate>
          <h2 id="auth-title" style={css(brandTitle)}>כניסה לחשבון</h2>
          <p style={css(brandLead)}>בלי סיסמה: נשלח לך קוד כניסה למייל.<br />ההזמנות והמועדפים שלך, בכל מכשיר.</p>
          <div style={css("display:flex;flex-direction:column;gap:10px;margin-bottom:12px;")}>
            {field("email", "אימייל", { type: "email", inputMode: "email", autoComplete: "email", placeholder: "example@mail.com" })}
            {field("phone", "טלפון נייד", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "050-1234567" })}
          </div>
          <div style={css("margin-bottom:12px;")}>
            <PrivacyConsent checked={agreed} onChange={(v) => { setAgreed(v); if (v) setAgreeError(""); }} error={agreeError} />
          </div>
          {error && <div role="alert" style={css("color:var(--c-danger);font-size:13px;margin-bottom:10px;")}>{error}</div>}
          <button type="submit" disabled={busy} className="btn btn-primary btn-block" style={css("font-size:15px;padding:12px;")}>
            {busy ? "שולחת קוד…" : "שליחת קוד למייל"}
          </button>
          <p style={css("font-size:12px;color:var(--c-ink-mute);margin:10px 0 2px;")}>אין עדיין חשבון? הוא נוצר אוטומטית בכניסה הראשונה.</p>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); verify(); }} noValidate>
          <h2 id="auth-title" style={css(brandTitle)}>הזיני את הקוד</h2>
          <p style={css(brandLead)}>
            שלחנו קוד בן 6 ספרות אל<br />
            <b dir="ltr" style={css("color:var(--c-ink);word-break:break-all;")}>{form.email.trim()}</b>
          </p>
          <label htmlFor="auth-code" style={css("position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);")}>קוד הכניסה</label>
          <input
            ref={codeRef}
            id="auth-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            dir="ltr"
            value={code}
            onChange={onCode}
            disabled={busy}
            aria-invalid={!!error}
            aria-describedby={error ? "auth-code-err" : "auth-code-hint"}
            placeholder="••••••"
            style={css(`width:100%;padding:14px;border:1.5px solid ${error ? "#d98a72" : "var(--c-line-strong)"};border-radius:var(--r-md);background:rgba(255,255,255,.7);text-align:center;font-size:28px;font-weight:600;letter-spacing:.45em;padding-left:calc(14px + .45em);font-variant-numeric:tabular-nums;color:var(--c-ink);margin-bottom:8px;`)}
          />
          {error
            ? <div id="auth-code-err" role="alert" style={css("color:var(--c-danger);font-size:13px;margin-bottom:10px;")}>{error}</div>
            : <div id="auth-code-hint" style={css("font-size:12px;color:var(--c-ink-mute);margin-bottom:10px;")}>הקוד תקף ל‑10 דקות. לא מוצאת? כדאי לבדוק גם בספאם.</div>}
          <button type="submit" disabled={busy || code.length !== 6} className="btn btn-primary btn-block" style={css("font-size:15px;padding:12px;")}>
            {busy ? "נכנסת…" : "כניסה"}
          </button>
          <div style={css("display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-top:6px;")}>
            <button type="button" onClick={() => sendCode()} disabled={busy || cooldown > 0} style={css(brandLink + (cooldown > 0 ? "color:var(--c-ink-faint);cursor:default;" : ""))}>
              {cooldown > 0 ? `שליחה חוזרת בעוד ${cooldown} שנ׳` : "שליחת קוד חדש"}
            </button>
            <button type="button" onClick={() => { setStep("details"); setError(""); }} style={css(brandLink)}>שינוי פרטים</button>
          </div>
        </form>
      )}
    </BrandDialog>
  );
}
