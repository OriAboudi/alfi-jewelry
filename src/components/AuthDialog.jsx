import React, { useEffect, useRef, useState } from "react";
import { css } from "../lib/css.js";
import { isValidEmail, formatIsraeliPhone } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";
import { useDialog } from "../hooks/useDialog.js";
import { PrivacyConsent } from "./PrivacyConsent.jsx";

const labelStyle = "display:block;font-size:12.5px;color:var(--c-ink-mute);margin-bottom:5px;";
const fieldStyle = "width:100%;padding:13px 14px;border:1.5px solid var(--c-line-strong);border-radius:var(--r-md);font-size:16px;background:#fff;transition:border-color .2s;";
const fieldErrStyle = fieldStyle.replace("var(--c-line-strong)", "#d98a72");
const linkBtn = "background:none;border:0;padding:4px 2px;font:inherit;cursor:pointer;color:var(--c-accent-dark);font-size:13.5px;font-weight:600;min-height:var(--tap);";

const RESEND_SECONDS = 45;
const isMobile = (v) => /^05\d{8}$/.test(String(v || "").replace(/\D/g, ""));

const readLastContact = () => {
  try { return JSON.parse(localStorage.getItem("alfi:lastContact") || "null") || {}; } catch { return {}; }
};
const readAgreed = () => {
  try { return localStorage.getItem("alfi:privacyAgreed") === "1"; } catch { return false; }
};

/**
 * AuthDialog — customer sign-in without a password, in two steps:
 *   1. email + mobile → "שליחת קוד" (a 6-digit code goes to the email)
 *   2. the code → signed in. The first sign-in creates the account.
 * An account keeps the customer's orders and favorites on every device.
 * Opened with openAuth() from the header, the mobile menu, the account and
 * favorites pages.
 */
export function AuthDialog() {
  const { authDialog, closeAuth, requestLoginCode, verifyLoginCode } = useStore();
  const open = !!authDialog;
  const [step, setStep] = useState("details"); // "details" | "code"
  const [form, setForm] = useState({ email: "", phone: "" });
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef(null);

  // Every opening starts at step 1, pre-filled with the details this device
  // used last (sign-in or the sign-up coupon form).
  useEffect(() => {
    if (!open) return;
    const last = readLastContact();
    setForm((f) => ({ email: f.email || last.email || "", phone: f.phone || (last.phone ? formatIsraeliPhone(last.phone) : "") }));
    setAgreed(readAgreed());
    setStep("details"); setCode(""); setTouched({}); setError(""); setAgreeError(""); setBusy(false);
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
    if (!agreed) setAgreeError("יש לאשר את מדיניות הפרטיות כדי להמשיך");
    if (errors.email || errors.phone) { setTouched({ email: true, phone: true }); return; }
    if (!agreed) return;
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
      codeRef.current?.focus();
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

  const field = (k, label, opts) => (
    <div>
      <label htmlFor={`auth-${k}`} style={css(labelStyle)}>{label}</label>
      <input
        id={`auth-${k}`}
        name={k}
        type={opts.type}
        inputMode={opts.inputMode}
        dir="ltr"
        autoComplete={opts.autoComplete}
        required
        aria-required="true"
        aria-invalid={!!(touched[k] && errors[k])}
        aria-describedby={touched[k] && errors[k] ? `auth-${k}-err` : undefined}
        value={form[k]}
        onChange={(e) => setForm((f) => ({ ...f, [k]: k === "phone" ? formatIsraeliPhone(e.target.value) : e.target.value }))}
        onBlur={() => setTouched((t) => ({ ...t, [k]: true }))}
        placeholder={opts.placeholder}
        style={css((touched[k] && errors[k] ? fieldErrStyle : fieldStyle) + "text-align:right;")}
      />
      {touched[k] && errors[k] && <div id={`auth-${k}-err`} role="alert" style={css("color:var(--c-danger);font-size:12px;margin-top:5px;")}>{errors[k]}</div>}
    </div>
  );

  return (
    <div
      onClick={closeAuth}
      style={css("position:fixed;inset:0;z-index:90;background:rgba(46,34,49,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;")}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="r-signup-panel no-scrollbar"
        style={css("position:relative;background:var(--c-bg);border-radius:20px;width:100%;max-width:380px;max-height:90vh;overflow-y:auto;padding:26px 22px 18px;box-shadow:var(--shadow-modal);")}
      >
        <button type="button" onClick={closeAuth} aria-label="סגירה" className="tap-target" style={css("position:absolute;top:6px;left:6px;background:none;border:0;padding:0;cursor:pointer;font-size:22px;color:var(--c-ink-mute);line-height:1;width:44px;height:44px;display:flex;align-items:center;justify-content:center;")}>×</button>

        <div className="serif" aria-hidden="true" style={css("text-align:center;font-size:24px;letter-spacing:.36em;padding-right:.36em;color:var(--ink);margin-bottom:8px;")}>ALFI</div>

        {step === "details" ? (
          <>
            <h2 id="auth-title" style={css("text-align:center;font-family:var(--font-serif);font-weight:400;font-size:20px;margin-bottom:6px;")}>כניסה לחשבון</h2>
            <p style={css("text-align:center;font-size:13px;line-height:1.6;color:var(--c-ink-soft);margin-bottom:16px;")}>בלי סיסמה: נשלח לך קוד כניסה למייל.<br />ההזמנות והמועדפים שלך, בכל מכשיר.</p>
            <form onSubmit={sendCode} noValidate style={css("display:flex;flex-direction:column;gap:11px;")}>
              {field("email", "אימייל", { type: "email", inputMode: "email", autoComplete: "email", placeholder: "example@mail.com" })}
              {field("phone", "טלפון נייד", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "050-1234567" })}
              <PrivacyConsent checked={agreed} onChange={(v) => { setAgreed(v); if (v) setAgreeError(""); }} error={agreeError} />
              {error && <div role="alert" style={css("color:var(--c-danger);font-size:13px;")}>{error}</div>}
              <button type="submit" disabled={busy} className="btn btn-primary btn-block" style={css("font-size:15px;padding:12px;margin-top:4px;")}>
                {busy ? "שולחת…" : "שליחת קוד למייל"}
              </button>
            </form>
            <p style={css("text-align:center;font-size:12px;color:var(--c-ink-mute);margin-top:12px;")}>אין עדיין חשבון? הוא נוצר אוטומטית בכניסה הראשונה.</p>
          </>
        ) : (
          <>
            <h2 id="auth-title" style={css("text-align:center;font-family:var(--font-serif);font-weight:400;font-size:20px;margin-bottom:6px;")}>הזיני את הקוד</h2>
            <p style={css("text-align:center;font-size:13.5px;line-height:1.6;color:var(--c-ink-soft);margin-bottom:16px;")}>
              שלחנו קוד בן 6 ספרות אל<br />
              <b dir="ltr" style={css("color:var(--c-ink);word-break:break-all;")}>{form.email.trim()}</b>
            </p>
            <form onSubmit={(e) => { e.preventDefault(); verify(); }} noValidate style={css("display:flex;flex-direction:column;gap:11px;")}>
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
                style={css(`width:100%;padding:14px;border:1.5px solid ${error ? "#d98a72" : "var(--c-line-strong)"};border-radius:var(--r-md);background:#fff;text-align:center;font-size:28px;font-weight:600;letter-spacing:.45em;padding-left:calc(14px + .45em);font-variant-numeric:tabular-nums;color:var(--c-ink);`)}
              />
              {error
                ? <div id="auth-code-err" role="alert" style={css("color:var(--c-danger);font-size:13px;text-align:center;")}>{error}</div>
                : <div id="auth-code-hint" style={css("font-size:12px;color:var(--c-ink-mute);text-align:center;")}>הקוד תקף ל‑10 דקות. לא מוצאת? כדאי לבדוק גם בספאם.</div>}
              <button type="submit" disabled={busy || code.length !== 6} className="btn btn-primary btn-block" style={css("font-size:15px;padding:12px;margin-top:2px;")}>
                {busy ? "רגע…" : "כניסה"}
              </button>
            </form>
            <div style={css("display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-top:8px;")}>
              <button type="button" onClick={() => sendCode()} disabled={busy || cooldown > 0} style={css(linkBtn + (cooldown > 0 ? "color:var(--c-ink-faint);cursor:default;" : ""))}>
                {cooldown > 0 ? `שליחה חוזרת בעוד ${cooldown} שנ׳` : "שליחת קוד חדש"}
              </button>
              <button type="button" onClick={() => { setStep("details"); setError(""); }} style={css(linkBtn)}>שינוי פרטים</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
