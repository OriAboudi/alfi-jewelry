import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { isValidEmail, isValidIsraeliPhone, formatIsraeliPhone } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";
import { FlowerMark } from "./Ornaments.jsx";

const labelStyle = "display:block;font-size:12.5px;color:var(--c-ink-mute);margin-bottom:5px;";
const fieldStyle = "width:100%;padding:13px 14px;border:1.5px solid var(--c-line-strong);border-radius:var(--r-md);font-size:15px;background:#fff;transition:border-color .2s;";
const fieldErrStyle = fieldStyle.replace("var(--c-line-strong)", "#d98a72");
const errMsgStyle = "color:var(--c-danger);font-size:12px;margin-top:5px;";

const REQUIRED = ["name", "email", "phone"];

export function SignupCouponPopup() {
  const { signupPopupOpen, signupPopupPendingCheckout, signupPopupPrefillPhone, content: C, couponCode, submitSignup, closeSignupPopup } = useStore();

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null); // { code, percent }
  const [copied, setCopied] = useState(false);

  // Reaching this popup from the header's phone-login flow (number not on
  // file yet) hands off the phone already typed there, so it doesn't need
  // to be re-entered here.
  useEffect(() => {
    if (signupPopupOpen && signupPopupPrefillPhone) {
      setForm((f) => ({ ...f, phone: formatIsraeliPhone(signupPopupPrefillPhone) }));
    }
  }, [signupPopupOpen, signupPopupPrefillPhone]);

  if (!signupPopupOpen) return null;

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
    if (!formValid) { setTouched({ name: true, email: true, phone: true }); return; }
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
      <label style={css(labelStyle)}>{label}</label>
      <input
        value={form[k]}
        onChange={opts.onChange || set(k)}
        onBlur={blur(k)}
        type={opts.type || "text"}
        placeholder={opts.placeholder}
        style={css(touched[k] && errors[k] ? fieldErrStyle : fieldStyle)}
      />
      {touched[k] && errors[k] && <div style={css(errMsgStyle)}>{errors[k]}</div>}
    </div>
  );

  return (
    <div
      onClick={close}
      style={css("position:fixed;inset:0;z-index:90;background:rgba(46,34,49,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;")}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="r-signup-panel"
        style={css("position:relative;background:var(--c-bg);border-radius:20px;width:100%;max-width:360px;max-height:85vh;overflow-y:auto;padding:26px 22px 20px;box-shadow:var(--shadow-modal);text-align:center;")}
      >
        <span onClick={close} className="tap-target" style={css("position:absolute;top:8px;left:8px;cursor:pointer;font-size:20px;color:var(--c-ink-mute);line-height:1;width:32px;height:32px;display:flex;align-items:center;justify-content:center;")}>×</span>

        <FlowerMark width={72} height={28} variant="simple" style={{ margin: "0 auto 8px" }} />

        {success ? (
          <>
            <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:19px;margin-bottom:7px;")}>ברוכה הבאה ל‑ALFI!</h2>
            <p style={css("font-size:12.5px;color:var(--c-ink-soft);margin-bottom:14px;")}>קוד ההנחה שלך ל‑{success.percent}% הנחה נשלח גם לאימייל שלך:</p>
            <div style={css("border:1.5px dashed var(--c-accent);border-radius:12px;padding:11px;font-size:18px;font-weight:700;letter-spacing:.07em;color:var(--c-accent);margin-bottom:12px;")}>{success.code}</div>
            <button onClick={copyCode} className="tap-target" style={css("width:100%;padding:10px;border:1px solid var(--c-line-strong);border-radius:var(--r-md);background:#fff;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:10px;")}>
              {copied ? "✓ הועתק!" : "העתקת הקוד"}
            </button>
            <button onClick={close} className="btn btn-primary btn-block" style={css("font-size:14px;padding:11px;")}>
              {signupPopupPendingCheckout ? "המשך לתשלום" : "המשך בקניות"}
            </button>
          </>
        ) : (
          <>
            <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:19px;margin-bottom:6px;")}>{percent}% הנחה על ההזמנה הראשונה</h2>
            <p style={css("font-size:12.5px;color:var(--c-ink-soft);margin-bottom:14px;")}>הרשמה של פחות מדקה — הקוד יישלח מיד אליך במייל.</p>
            <div style={css("display:flex;flex-direction:column;gap:9px;text-align:right;margin-bottom:12px;")}>
              {field("name", "שם מלא")}
              {field("email", "אימייל", { type: "email", placeholder: "example@mail.com" })}
              {field("phone", "טלפון", { onChange: setPhone, placeholder: "050-1234567" })}
            </div>
            {error && <div style={css("color:var(--c-danger);font-size:12px;margin-bottom:10px;")}>{error}</div>}
            <button onClick={submit} disabled={busy} className="btn btn-primary btn-block" style={css("font-size:14px;padding:11px;margin-bottom:8px;")}>
              {busy ? "רגע…" : "קבלת הקופון"}
            </button>
            <span onClick={close} className="tap-target" style={css("display:inline-block;cursor:pointer;font-size:12px;color:var(--c-ink-mute);")}>
              {signupPopupPendingCheckout ? "להמשיך בלי קופון" : "אולי מאוחר יותר"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
