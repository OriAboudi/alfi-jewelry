import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { css } from "../lib/css.js";
import { PrivacyPolicyContent, PRIVACY_UPDATED } from "./PrivacyPolicyContent.jsx";

/**
 * Required "I agree to the privacy policy" checkbox for forms that collect
 * personal details (checkout, sign-up coupon). The policy link opens the
 * policy in an overlay on top of the form instead of navigating away, so
 * closing it (button / Escape / backdrop) drops the customer back exactly
 * where they were — same scroll position, nothing they typed is lost —
 * and focus returns to the link they clicked.
 */
export function PrivacyConsent({ checked, onChange, error }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  const close = () => {
    setOpen(false);
    // After the overlay unmounts, hand focus back to where the user was.
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <div>
      <label style={css("display:flex;align-items:flex-start;gap:10px;font-size:13.5px;line-height:1.6;color:var(--c-ink-soft);cursor:pointer;text-align:right;")}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!error}
          style={css("width:18px;height:18px;margin-top:2px;flex:none;accent-color:var(--c-accent);cursor:pointer;")}
        />
        <span>
          קראתי ואני מאשר/ת את{" "}
          <button
            type="button"
            ref={triggerRef}
            onClick={(e) => { e.preventDefault(); setOpen(true); }}
            style={css("background:none;border:0;padding:0;font:inherit;color:var(--c-ink);border-bottom:1px solid var(--c-ink);cursor:pointer;")}
          >מדיניות הפרטיות</button>
        </span>
      </label>
      {error && <div style={css("color:var(--c-danger);font-size:12px;margin-top:5px;text-align:right;")}>{error}</div>}
      {open && <PrivacyPolicyModal onClose={close} />}
    </div>
  );
}

function PrivacyPolicyModal({ onClose }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      style={css("position:fixed;inset:0;z-index:120;background:rgba(46,34,49,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;")}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="מדיניות פרטיות"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        style={css("background:var(--c-bg);border-radius:20px;width:100%;max-width:720px;max-height:calc(100dvh - 32px);display:flex;flex-direction:column;overflow:hidden;box-shadow:var(--shadow-modal);")}
      >
        <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 24px;border-bottom:1px solid var(--c-line);flex:none;")}>
          <div>
            <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:22px;margin:0;")}>מדיניות פרטיות</h2>
            <div style={css("font-size:12px;color:var(--c-ink-mute);")}>עודכן לאחרונה: {PRIVACY_UPDATED}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="סגירה" style={css("border:none;background:none;cursor:pointer;font-size:28px;line-height:1;color:var(--c-ink-mute);width:40px;height:40px;flex:none;")}>×</button>
        </div>
        <div style={css("overflow-y:auto;overscroll-behavior:contain;padding:28px 24px;flex:1;")}>
          <PrivacyPolicyContent />
        </div>
        <div style={css("padding:14px 24px;border-top:1px solid var(--c-line);flex:none;")}>
          <button ref={closeBtnRef} type="button" onClick={onClose} className="btn btn-primary btn-block" style={css("font-size:15px;")}>חזרה לטופס</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
