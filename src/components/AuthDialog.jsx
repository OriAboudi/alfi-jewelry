import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { isValidEmail, isValidIsraeliPhone, formatIsraeliPhone } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";
import { useDialog } from "../hooks/useDialog.js";
import { PrivacyConsent } from "./PrivacyConsent.jsx";

const labelStyle = "display:block;font-size:12.5px;color:var(--c-ink-mute);margin-bottom:5px;";
const fieldStyle = "width:100%;padding:13px 14px;border:1.5px solid var(--c-line-strong);border-radius:var(--r-md);font-size:16px;background:#fff;transition:border-color .2s;";
const fieldErrStyle = fieldStyle.replace("var(--c-line-strong)", "#d98a72");
const linkBtn = "background:none;border:0;padding:4px 2px;font:inherit;cursor:pointer;color:var(--c-accent-dark);font-size:13.5px;font-weight:600;min-height:var(--tap);";

const TITLES = {
  login: "התחברות לחשבון",
  register: "יצירת חשבון",
  forgot: "איפוס סיסמה",
  reset: "בחירת סיסמה חדשה",
};

/**
 * AuthDialog — customer sign-in / sign-up (Supabase Auth, email + password).
 * An account keeps the customer's orders and favorites on every device.
 * Opened with openAuth("login" | "register") from the header, the mobile
 * menu or the account page; "reset" opens by itself when a password-reset
 * email link lands on the site (PASSWORD_RECOVERY, see StoreContext).
 */
export function AuthDialog() {
  const { authDialog: mode, openAuth, closeAuth, signIn, signUp, requestPasswordReset, setNewPassword } = useStore();
  const open = !!mode;
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState("");

  // Fresh state for every mode; the typed email carries over between modes.
  useEffect(() => {
    setTouched({}); setError(""); setNotice(""); setBusy(false); setAgreeError("");
    setForm((f) => ({ ...f, password: "" }));
  }, [mode]);

  const panelRef = useDialog(open, closeAuth, { initialFocus: "input" });
  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: k === "phone" ? formatIsraeliPhone(e.target.value) : e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const need = {
    login: ["email", "password"],
    register: ["name", "email", "password"],
    forgot: ["email"],
    reset: ["password"],
  }[mode];

  const errors = {
    name: form.name.trim() ? "" : "שדה חובה",
    email: form.email.trim() ? (isValidEmail(form.email) ? "" : "כתובת אימייל לא תקינה") : "שדה חובה",
    phone: form.phone.trim() && !isValidIsraeliPhone(form.phone) ? "מספר טלפון לא תקין" : "",
    password: form.password ? (mode !== "login" && form.password.length < 6 ? "לפחות 6 תווים" : "") : "שדה חובה",
  };
  const fieldsToCheck = mode === "register" ? [...need, "phone"] : need;
  const valid = fieldsToCheck.every((k) => !errors[k]);

  const submit = async (e) => {
    e.preventDefault();
    if (mode === "register" && !agreed) setAgreeError("יש לאשר את מדיניות הפרטיות כדי להמשיך");
    if (!valid) { setTouched(Object.fromEntries(fieldsToCheck.map((k) => [k, true]))); return; }
    if (mode === "register" && !agreed) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "login") await signIn(form);
      else if (mode === "register") {
        const { needsConfirmation } = await signUp(form);
        if (needsConfirmation) setNotice("שלחנו אלייך מייל לאישור החשבון. אחרי האישור אפשר להתחבר.");
      } else if (mode === "forgot") {
        await requestPasswordReset(form.email);
        setNotice("אם קיים חשבון עם האימייל הזה, נשלח אליו קישור לבחירת סיסמה חדשה.");
      } else if (mode === "reset") await setNewPassword(form.password);
    } catch (err) {
      setError(err.message || "משהו השתבש, נסי שוב");
    } finally {
      setBusy(false);
    }
  };

  const field = (k, label, opts = {}) => (
    <div key={k}>
      <label htmlFor={`auth-${k}`} style={css(labelStyle)}>{label}</label>
      <input
        id={`auth-${k}`}
        name={k}
        type={opts.type || "text"}
        dir={opts.ltr ? "ltr" : undefined}
        autoComplete={opts.autoComplete}
        required={!opts.optional}
        aria-required={!opts.optional}
        aria-invalid={!!(touched[k] && errors[k])}
        aria-describedby={touched[k] && errors[k] ? `auth-${k}-err` : undefined}
        value={form[k]}
        onChange={set(k)}
        onBlur={blur(k)}
        placeholder={opts.placeholder}
        style={css((touched[k] && errors[k] ? fieldErrStyle : fieldStyle) + (opts.ltr ? "text-align:right;" : ""))}
      />
      {touched[k] && errors[k] && <div id={`auth-${k}-err`} role="alert" style={css("color:var(--c-danger);font-size:12px;margin-top:5px;")}>{errors[k]}</div>}
    </div>
  );

  const submitLabel = { login: "התחברות", register: "יצירת חשבון", forgot: "שליחת קישור", reset: "שמירת הסיסמה" }[mode];

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
        <h2 id="auth-title" style={css("text-align:center;font-family:var(--font-serif);font-weight:400;font-size:20px;margin-bottom:6px;")}>{TITLES[mode]}</h2>
        {(mode === "login" || mode === "register") && (
          <p style={css("text-align:center;font-size:13px;color:var(--c-ink-soft);margin-bottom:16px;")}>ההזמנות והמועדפים שלך, בכל מכשיר.</p>
        )}
        {mode === "forgot" && (
          <p style={css("text-align:center;font-size:13px;color:var(--c-ink-soft);margin-bottom:16px;")}>נשלח קישור לבחירת סיסמה חדשה לאימייל של החשבון.</p>
        )}

        {/* Login / register switch */}
        {(mode === "login" || mode === "register") && (
          <div role="tablist" aria-label="התחברות או הרשמה" style={css("display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:var(--r-pill);background:rgba(58,45,61,.06);margin-bottom:16px;")}>
            {[["login", "התחברות"], ["register", "הרשמה"]].map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => openAuth(m)}
                style={css(`min-height:40px;border:0;border-radius:var(--r-pill);font-family:inherit;font-size:14.5px;cursor:pointer;${mode === m ? "background:#fff;color:var(--c-ink);font-weight:600;box-shadow:0 1px 4px rgba(58,45,61,.12);" : "background:transparent;color:var(--c-ink-mute);font-weight:400;"}`)}
              >{label}</button>
            ))}
          </div>
        )}

        {notice ? (
          <div role="status" style={css("background:var(--c-success-bg);color:var(--c-success);border-radius:var(--r-md);padding:14px;font-size:14px;line-height:1.6;margin-bottom:14px;text-align:center;")}>{notice}</div>
        ) : (
          <form onSubmit={submit} noValidate style={css("display:flex;flex-direction:column;gap:11px;")}>
            {mode === "register" && field("name", "שם מלא", { autoComplete: "name" })}
            {mode !== "reset" && field("email", "אימייל", { type: "email", autoComplete: "email", placeholder: "example@mail.com", ltr: true })}
            {mode === "register" && field("phone", "טלפון (לא חובה)", { type: "tel", autoComplete: "tel", placeholder: "050-1234567", optional: true })}
            {mode !== "forgot" && field("password", mode === "login" ? "סיסמה" : "סיסמה (לפחות 6 תווים)", { type: "password", autoComplete: mode === "login" ? "current-password" : "new-password" })}

            {mode === "register" && (
              <PrivacyConsent checked={agreed} onChange={(v) => { setAgreed(v); if (v) setAgreeError(""); }} error={agreeError} />
            )}
            {error && <div role="alert" style={css("color:var(--c-danger);font-size:13px;")}>{error}</div>}

            <button type="submit" disabled={busy} className="btn btn-primary btn-block" style={css("font-size:15px;padding:12px;margin-top:4px;")}>
              {busy ? "רגע…" : submitLabel}
            </button>
          </form>
        )}

        <div style={css("display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:8px;")}>
          {mode === "login" && <button type="button" onClick={() => openAuth("forgot")} style={css(linkBtn)}>שכחתי סיסמה</button>}
          {mode === "forgot" && <button type="button" onClick={() => openAuth("login")} style={css(linkBtn)}>חזרה להתחברות</button>}
        </div>
      </div>
    </div>
  );
}
