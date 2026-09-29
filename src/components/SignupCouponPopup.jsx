import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { isValidEmail, isValidIsraeliPhone, formatIsraeliPhone } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";
import { PrivacyConsent } from "./PrivacyConsent.jsx";
import { useDialog } from "../hooks/useDialog.js";
import { BrandDialog, preloadBrandImages, brandLabel, brandField, brandFieldErr, brandErrMsg, brandTitle, brandLead, brandLink, brandQuiet } from "./BrandDialog.jsx";

const REQUIRED = ["name", "email", "phone"];

/**
 * SignupCouponPopup — "X% off your first order" for new visitors: name,
 * email and mobile → a one-time coupon (on screen and by email). When it may
 * appear at all is decided in one place, StoreContext's
 * shouldOfferSignupPopup (never to a signed-in visitor, during sign-in,
 * around payment or to someone who already ordered).
 */
export function SignupCouponPopup() {
  const { signupPopupOpen, signupPopupPendingCheckout, signupPopupPrefillPhone, content: C, loaded, submitSignup, closeSignupPopup, switchToSignIn } = useStore();
  const [imagesReady, setImagesReady] = useState(false);
  useEffect(() => {
    if (!signupPopupOpen || imagesReady) return undefined;
    let alive = true;
    preloadBrandImages().then(() => { if (alive) setImagesReady(true); });
    return () => { alive = false; };
  }, [signupPopupOpen, imagesReady]);
  // Shown only once complete: images decoded AND the server settings (the
  // coupon %) loaded, so nothing in it changes after it appears.
  const visible = signupPopupOpen && imagesReady && loaded;

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  // Errors show after the first submit attempt, not on blur — a message
  // appearing on blur shifts the consent checkbox under the pointer.
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null); // { code, percent }
  const [copied, setCopied] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState("");

  useEffect(() => {
    if (signupPopupOpen && signupPopupPrefillPhone) {
      setForm((f) => ({ ...f, phone: formatIsraeliPhone(signupPopupPrefillPhone) }));
    }
  }, [signupPopupOpen, signupPopupPrefillPhone]);

  const panelRef = useDialog(visible, closeSignupPopup);

  if (!visible) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: k === "phone" ? formatIsraeliPhone(e.target.value) : e.target.value }));

  const errors = {
    name: form.name.trim() ? "" : "שדה חובה",
    email: form.email.trim() ? (isValidEmail(form.email) ? "" : "כתובת אימייל לא תקינה") : "שדה חובה",
    phone: form.phone.trim() ? (isValidIsraeliPhone(form.phone) ? "" : "מספר טלפון לא תקין") : "שדה חובה",
  };
  const formValid = REQUIRED.every((k) => !errors[k]);
  const percent = C.signupCouponPercent || 5;

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!agreed) setAgreeError("יש לאשר את מדיניות הפרטיות כדי להמשיך");
    if (!formValid || !agreed) return;
    setBusy(true);
    setError("");
    try {
      setSuccess(await submitSignup(form));
    } catch (err) {
      setError(err.message || "ההרשמה נכשלה, נסי שוב");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(success.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — code is still shown on screen */ }
  };

  const field = (k, label, opts = {}) => {
    const bad = touched && errors[k];
    return (
      <div>
        <label htmlFor={`signup-${k}`} style={css(brandLabel)}>{label}</label>
        <input
          id={`signup-${k}`}
          required
          aria-required="true"
          aria-invalid={!!bad}
          aria-describedby={bad ? `signup-${k}-err` : undefined}
          autoComplete={opts.autoComplete}
          inputMode={opts.inputMode}
          dir={opts.ltr ? "ltr" : undefined}
          value={form[k]}
          onChange={set(k)}
          type={opts.type || "text"}
          placeholder={opts.placeholder}
          style={css((bad ? brandFieldErr : brandField) + (opts.ltr ? "text-align:right;" : ""))}
        />
        {bad && <div id={`signup-${k}-err`} role="alert" style={css(brandErrMsg)}>{errors[k]}</div>}
      </div>
    );
  };

  const footer = !success && (
    <>כבר יש לך חשבון? <button type="button" onClick={switchToSignIn} style={css(brandLink + "padding:4px 2px;")}>כניסה</button></>
  );

  return (
    <BrandDialog panelRef={panelRef} labelledBy="signup-title" onClose={closeSignupPopup} footer={footer}>
      {success ? (
        <>
          <h2 id="signup-title" style={css(brandTitle)}>ברוכה הבאה ל‑ALFI!</h2>
          <p style={css(brandLead)}>קוד ההנחה שלך ל‑{success.percent}% הנחה כבר הופעל בעגלה, ונשלח גם למייל:</p>
          <div style={css("border:1.5px dashed var(--c-accent);border-radius:12px;padding:12px;font-size:19px;font-weight:700;letter-spacing:.08em;color:var(--c-accent);margin-bottom:12px;background:rgba(255,255,255,.5);")} dir="ltr">{success.code}</div>
          <button type="button" onClick={copyCode} className="tap-target" style={css("width:100%;padding:10px;border:1px solid var(--c-line-strong);border-radius:var(--r-md);background:transparent;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;margin-bottom:10px;color:var(--c-ink);")}>
            {copied ? "✓ הועתק" : "העתקת הקוד"}
          </button>
          <button type="button" onClick={closeSignupPopup} className="btn btn-primary btn-block" style={css("font-size:15px;padding:12px;")}>
            {signupPopupPendingCheckout ? "המשך לתשלום" : "המשך בקניות"}
          </button>
        </>
      ) : (
        <form onSubmit={submit} noValidate>
          <h2 id="signup-title" style={css(brandTitle)}>{percent}% הנחה על ההזמנה הראשונה</h2>
          <p style={css(brandLead)}>הצטרפי ל‑ALFI וקבלי קוד הנחה מיד, גם למייל.</p>
          <div style={css("display:flex;flex-direction:column;gap:10px;margin-bottom:12px;")}>
            {field("name", "שם מלא", { autoComplete: "name" })}
            {field("email", "אימייל", { type: "email", inputMode: "email", placeholder: "example@mail.com", autoComplete: "email", ltr: true })}
            {field("phone", "טלפון נייד", { type: "tel", inputMode: "tel", placeholder: "050-1234567", autoComplete: "tel", ltr: true })}
          </div>
          <div style={css("margin-bottom:12px;")}>
            <PrivacyConsent checked={agreed} onChange={(v) => { setAgreed(v); if (v) setAgreeError(""); }} error={agreeError} />
          </div>
          {error && <div role="alert" style={css("color:var(--c-danger);font-size:13px;margin-bottom:10px;")}>{error}</div>}
          <button type="submit" disabled={busy} className="btn btn-primary btn-block" style={css("font-size:15px;padding:12px;margin-bottom:4px;")}>
            {busy ? "רגע…" : "קבלת קוד ההנחה"}
          </button>
          <button type="button" onClick={closeSignupPopup} style={css(brandQuiet)}>
            {signupPopupPendingCheckout ? "להמשיך בלי קופון" : "אולי מאוחר יותר"}
          </button>
        </form>
      )}
    </BrandDialog>
  );
}
