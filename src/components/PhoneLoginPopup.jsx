import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { isValidIsraeliPhone, formatIsraeliPhone } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";

const fieldStyle = "width:100%;padding:13px 14px;border:1.5px solid var(--c-line-strong);border-radius:var(--r-md);font-size:15px;background:#fff;transition:border-color .2s;";
const fieldErrStyle = fieldStyle.replace("var(--c-line-strong)", "#d98a72");

// No real accounts/passwords on this site (guest-checkout only — see
// StoreContext's customerLogout) — this is just a phone-number lookup
// against whatever was collected at sign-up. Found -> greet by name and
// restore the coupon. Not found -> hand off to the sign-up popup (same
// component the footer's button uses) with the phone already filled in.
export function PhoneLoginPopup() {
  const { phoneLoginOpen, phoneLoginBusy, phoneLoginError, loginByPhone, closePhoneLogin } = useStore();
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (phoneLoginOpen) { setPhone(""); setTouched(false); }
  }, [phoneLoginOpen]);

  if (!phoneLoginOpen) return null;

  const valid = isValidIsraeliPhone(phone);

  const submit = () => {
    if (!valid) { setTouched(true); return; }
    loginByPhone(phone).catch(() => {});
  };

  return (
    <div
      onClick={closePhoneLogin}
      style={css("position:fixed;inset:0;z-index:90;background:rgba(46,34,49,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;")}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="r-signup-panel"
        style={css("position:relative;background:var(--c-bg);border-radius:20px;width:100%;max-width:360px;padding:26px 22px 20px;box-shadow:var(--shadow-modal);text-align:center;")}
      >
        <span onClick={closePhoneLogin} className="tap-target" style={css("position:absolute;top:8px;left:8px;cursor:pointer;font-size:20px;color:var(--c-ink-mute);line-height:1;width:32px;height:32px;display:flex;align-items:center;justify-content:center;")}>×</span>

        <div className="serif" style={css("font-size:24px;letter-spacing:.36em;padding-right:.36em;color:var(--ink);margin-bottom:10px;")}>ALFI</div>

        <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:19px;margin-bottom:6px;")}>כניסה עם מספר טלפון</h2>
        <p style={css("font-size:12.5px;color:var(--c-ink-soft);margin-bottom:16px;")}>הזינו את הטלפון שנרשמתם איתו — אם עדיין לא נרשמתם, ניצור לכם חשבון וקופון חדש.</p>

        <div style={css("text-align:right;margin-bottom:12px;")}>
          <input
            value={phone}
            onChange={(e) => setPhone(formatIsraeliPhone(e.target.value))}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            type="tel"
            placeholder="050-1234567"
            style={css(touched && !valid ? fieldErrStyle : fieldStyle)}
            autoFocus
          />
          {touched && !valid && <div style={css("color:var(--c-danger);font-size:12px;margin-top:5px;")}>מספר טלפון לא תקין</div>}
        </div>

        {phoneLoginError && <div style={css("color:var(--c-danger);font-size:12px;margin-bottom:10px;")}>{phoneLoginError}</div>}

        <button onClick={submit} disabled={phoneLoginBusy} className="btn btn-primary btn-block" style={css("font-size:14px;padding:11px;")}>
          {phoneLoginBusy ? "רגע…" : "כניסה"}
        </button>
      </div>
    </div>
  );
}
