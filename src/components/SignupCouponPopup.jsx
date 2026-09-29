import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { isValidEmail, isValidIsraeliPhone, formatIsraeliPhone } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";
import { PrivacyConsent } from "./PrivacyConsent.jsx";
import { useDialog } from "../hooks/useDialog.js";

const labelStyle = "display:block;font-size:12.5px;color:var(--c-ink-mute);margin-bottom:5px;";
const fieldStyle = "width:100%;padding:13px 14px;border:1.5px solid var(--c-line-strong);border-radius:var(--r-md);font-size:15px;background:transparent;transition:border-color .2s;";
const fieldErrStyle = fieldStyle.replace("var(--c-line-strong)", "#d98a72");
const errMsgStyle = "color:var(--c-danger);font-size:12px;margin-top:5px;";

const REQUIRED = ["name", "email", "phone"];

// The panel is painted with two images (the floral background and the ALFI
// band). Opening before they are decoded showed the panel first and then
// the pictures popping in one after the other; wait for both (briefly — a
// slow network still gets the popup after 2.5s).
const POPUP_IMAGES = ["/floral-bg.jpg", "/signup-bg.jpg"];
let popupImagesReady = null;
function preloadPopupImages() {
  if (!popupImagesReady) {
    popupImagesReady = Promise.race([
      Promise.all(POPUP_IMAGES.map((src) => { const img = new Image(); img.src = src; return img.decode().catch(() => {}); })),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  }
  return popupImagesReady;
}

export function SignupCouponPopup() {
  const { signupPopupOpen, signupPopupPendingCheckout, signupPopupPrefillPhone, content: C, loaded, couponCode, submitSignup, closeSignupPopup } = useStore();
  const [imagesReady, setImagesReady] = useState(false);
  useEffect(() => {
    if (!signupPopupOpen || imagesReady) return undefined;
    let alive = true;
    preloadPopupImages().then(() => { if (alive) setImagesReady(true); });
    return () => { alive = false; };
  }, [signupPopupOpen, imagesReady]);
  // Shown only once complete: images decoded AND the server settings (the
  // coupon %) loaded, so nothing in it changes after it appears.
  const visible = signupPopupOpen && imagesReady && loaded;

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null); // { code, percent }
  const [copied, setCopied] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState("");

  // Reaching this popup from the header's phone-login flow (number not on
  // file yet) hands off the phone already typed there, so it doesn't need
  // to be re-entered here.
  useEffect(() => {
    if (signupPopupOpen && signupPopupPrefillPhone) {
      setForm((f) => ({ ...f, phone: formatIsraeliPhone(signupPopupPrefillPhone) }));
    }
  }, [signupPopupOpen, signupPopupPrefillPhone]);

  const panelRef = useDialog(visible, closeSignupPopup);

  if (!visible) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPhone = (e) => setForm((f) => ({ ...f, phone: formatIsraeliPhone(e.target.value) }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const errors = {
    name: form.name.trim() ? "" : "שדה חובה",
    email: form.email.trim() ? (isValidEmail(form.email) ? "" : "כתובת אימייל לא תקינה") : "שדה חובה",
    phone: form.phone.trim() ? (isValidIsraeliPhone(form.phone) ? "" : "מספר טלפון לא תקין") : "שדה חובה",
  };
  const formValid = REQUIRED.every((k) => !errors[k]);
  const percent = C.signupCouponPercent || 5;

  const submit = async () => {
    if (!agreed) setAgreeError("יש לאשר את מדיניות הפרטיות כדי להמשיך");
    if (!formValid) { setTouched({ name: true, email: true, phone: true }); return; }
    if (!agreed) return;
    setBusy(true);
    setError("");
    try {
      const result = await submitSignup(form);
      setSuccess(result);
    } catch (e) {
      setError(e.message || "ההרשמה נכשלה, נסי שוב");
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

  const close = () => closeSignupPopup();

  const field = (k, label, opts = {}) => (
    <div>
      <label htmlFor={`signup-${k}`} style={css(labelStyle)}>{label}</label>
      <input
        id={`signup-${k}`}
        required
        aria-required="true"
        aria-invalid={!!(touched[k] && errors[k])}
        aria-describedby={touched[k] && errors[k] ? `signup-${k}-err` : undefined}
        autoComplete={opts.autoComplete}
        value={form[k]}
        onChange={opts.onChange || set(k)}
        onBlur={blur(k)}
        type={opts.type || "text"}
        placeholder={opts.placeholder}
        style={css(touched[k] && errors[k] ? fieldErrStyle : fieldStyle)}
      />
      {touched[k] && errors[k] && <div id={`signup-${k}-err`} role="alert" style={css(errMsgStyle)}>{errors[k]}</div>}
    </div>
  );

  return (
    <div
      onClick={close}
      style={css("position:fixed;inset:0;z-index:90;background:rgba(46,34,49,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;")}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-title"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="r-signup-panel"
        // Top band: the brand painting with the ALFI JEWELRY logo
        // (public/signup-bg.jpg). Behind the form: the site's own floral
        // painting (no lettering to ghost through), under a frosted cream
        // layer so every line stays readable.
        style={css("position:relative;background:#efe4ec url(/floral-bg.jpg) center/cover;border-radius:20px;width:100%;max-width:380px;max-height:88vh;overflow:hidden;box-shadow:var(--shadow-modal);text-align:center;display:flex;flex-direction:column;")}
      >
        <div role="img" aria-label="ALFI Jewelry" style={css("flex:none;height:150px;background:url(/signup-bg.jpg) center 48%/100% auto no-repeat;")} />

        <div className="no-scrollbar" style={css("flex:1;min-height:0;overflow-y:auto;padding:22px 22px 18px;background:rgba(248,243,238,.8);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-top:1px solid rgba(255,255,255,.7);")}>
        {success ? (
          <>
            <h2 id="signup-title" style={css("font-family:var(--font-serif);font-weight:400;font-size:19px;margin-bottom:7px;")}>ברוכה הבאה ל‑ALFI!</h2>
            <p style={css("font-size:12.5px;color:var(--c-ink-soft);margin-bottom:14px;")}>קוד ההנחה שלך ל‑{success.percent}% הנחה נשלח גם לאימייל שלך:</p>
            <div style={css("border:1.5px dashed var(--c-accent);border-radius:12px;padding:11px;font-size:18px;font-weight:700;letter-spacing:.07em;color:var(--c-accent);margin-bottom:12px;")}>{success.code}</div>
            <button onClick={copyCode} className="tap-target" style={css("width:100%;padding:10px;border:1px solid var(--c-line-strong);border-radius:var(--r-md);background:transparent;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:10px;")}>
              {copied ? "✓ הועתק!" : "העתקת הקוד"}
            </button>
            <button onClick={close} className="btn btn-primary btn-block" style={css("font-size:14px;padding:11px;")}>
              {signupPopupPendingCheckout ? "המשך לתשלום" : "המשך בקניות"}
            </button>
          </>
        ) : (
          <>
            <h2 id="signup-title" style={css("font-family:var(--font-serif);font-weight:400;font-size:19px;margin-bottom:14px;")}>{percent}% הנחה על ההזמנה הראשונה</h2>
            <div style={css("display:flex;flex-direction:column;gap:9px;text-align:right;margin-bottom:12px;")}>
              {field("name", "שם מלא", { autoComplete: "name" })}
              {field("email", "אימייל", { type: "email", placeholder: "example@mail.com", autoComplete: "email" })}
              {field("phone", "טלפון", { type: "tel", onChange: setPhone, placeholder: "050-1234567", autoComplete: "tel" })}
            </div>
            <div style={css("margin-bottom:12px;")}>
              <PrivacyConsent checked={agreed} onChange={(v) => { setAgreed(v); if (v) setAgreeError(""); }} error={agreeError} />
            </div>
            {error && <div role="alert" style={css("color:var(--c-danger);font-size:12px;margin-bottom:10px;")}>{error}</div>}
            <button onClick={submit} disabled={busy} className="btn btn-primary btn-block" style={css("font-size:14px;padding:11px;margin-bottom:8px;")}>
              {busy ? "רגע…" : "קבלת הקופון"}
            </button>
            <button type="button" onClick={close} className="tap-target" style={css("display:inline-block;background:none;border:0;padding:0 6px;font-family:inherit;cursor:pointer;font-size:12px;color:var(--c-ink-mute);")}>
              {signupPopupPendingCheckout ? "להמשיך בלי קופון" : "אולי מאוחר יותר"}
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
