// Shared constants/components for every admin tab — extracted from the
// original monolithic Admin.jsx so each tab file can stay focused.
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { css } from "../../lib/css.js";
import { CAT_NAMES } from "../../lib/categories.js";

export const STATUS_OPTS = ["התקבלה", "בהכנה", "נשלחה", "בדרך", "נמסר", "בוטלה"];

// Starting text for the Orders tab's customer-email composer — the same
// wording the automatic status emails used to send. Always editable before
// sending; "" is a blank free-form message. (The email itself adds the order
// number, tracking link and ALFI footer server-side — see send-order-email.)
export const EMAIL_TEMPLATES = {
  "התקבלה": { subject: "ההזמנה שלך התקבלה", body: "אנחנו כבר מתחילים לטפל בהזמנה שלך." },
  "בהכנה": { subject: "ההזמנה שלך בהכנה", body: "אנחנו מכינים את התכשיט שלך באהבה ובקפידה." },
  "נשלחה": { subject: "ההזמנה שלך נשלחה", body: "החבילה שלך יצאה לדרך ותגיע אליך בקרוב." },
  "בדרך": { subject: "ההזמנה שלך בדרך אליך", body: "השליח כבר בדרך — כדאי לוודא שיש מי שיקבל את החבילה." },
  "נמסר": { subject: "ההזמנה שלך נמסרה", body: "מקווים שתיהנו מהתכשיט החדש! תודה שקנית ב‑ALFI." },
  "בוטלה": { subject: "ההזמנה שלך בוטלה", body: "ההזמנה שלך בוטלה. לשאלות ניתן לפנות אלינו בכל עת." },
  "": { subject: "עדכון לגבי ההזמנה שלך", body: "" },
};

export function emailDraft(templateKey, firstName) {
  const t = EMAIL_TEMPLATES[templateKey] || EMAIL_TEMPLATES[""];
  const greeting = firstName ? `שלום ${firstName},` : "שלום,";
  return { template: templateKey, subject: t.subject, message: t.body ? `${greeting}\n\n${t.body}` : `${greeting}\n\n` };
}
export { CAT_NAMES };
// The 4 core jewelry categories, for inventory-by-category summaries —
// Accessories excluded, matching the homepage's 4-tile convention.
export const CORE_CAT_NAMES = ["טבעות", "עגילים", "שרשראות", "צמידים"];

// Single source of truth for stock health across ProductsTab, DashboardTab
// and InventoryTab, so all three always agree on the same thresholds.
export function stockTier(stock, { fine = 10, low = 5 } = {}) {
  const n = Number(stock) || 0;
  if (n <= 0) return "out";
  if (n < low) return "critical";
  if (n < fine) return "warning";
  return "ok";
}

export const TIER_LABEL = { ok: "תקין", warning: "מלאי נמוך", critical: "מלאי קריטי", out: "אזל במלאי" };
export const TIER_COLOR = {
  ok: { fg: "var(--c-success)", bg: "var(--c-success-bg)" },
  warning: { fg: "var(--c-warning)", bg: "var(--c-warning-bg)" },
  critical: { fg: "var(--c-danger)", bg: "var(--c-danger-bg)" },
  out: { fg: "var(--c-danger)", bg: "var(--c-danger-bg)" },
};

export const lbl = "display:block;font-size:13px;font-weight:600;color:var(--c-ink-mute);margin-bottom:7px;";
export const inp = "width:100%;padding:12px 14px;border:1px solid var(--c-line-strong);border-radius:11px;font-size:15px;background:#fff;";
export const ta = inp + "resize:vertical;";

export function Field({ label, value, onChange, type, placeholder, error }) {
  return (
    <div>
      <label style={css(lbl)}>{label}</label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} type={type || "text"} placeholder={placeholder} style={css(error ? inp.replace("var(--c-line-strong)", "#d98a72") : inp)} />
      {error && <div style={css("color:var(--c-danger);font-size:12px;margin-top:5px;")}>{error}</div>}
    </div>
  );
}

export function Area({ label, value, onChange, rows = 3, placeholder }) {
  return (
    <div>
      <label style={css(lbl)}>{label}</label>
      <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} style={css(ta)} />
    </div>
  );
}

// Full-screen shell shared by every editor/detail modal in the admin panel.
// Portaled to <body>: the admin card is a .glass-card, and its
// backdrop-filter makes it the containing block for position:fixed
// descendants — rendered in place, the "fixed" overlay was sized to the
// (tall) card instead of the viewport, so it opened off-screen.
export function Overlay({ onClose, children }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div role="dialog" aria-modal="true" dir="rtl" style={css("position:fixed;inset:0;z-index:80;background:var(--c-bg);overflow-y:auto;overscroll-behavior:contain;")}>
      <div style={css("max-width:960px;margin:0 auto;padding:0 32px 48px;")}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// Sticky so the title and close button stay reachable while scrolling a
// long order/product.
export function OverlayHeader({ title, onClose }) {
  return (
    <div style={css("position:sticky;top:0;z-index:1;background:var(--c-bg);display:flex;justify-content:space-between;align-items:center;padding:22px 0 16px;margin-bottom:22px;border-bottom:1px solid var(--c-line);")}>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:26px;")}>{title}</h2>
      <button type="button" onClick={onClose} aria-label="סגירה" style={css("border:none;background:none;cursor:pointer;font-size:28px;line-height:1;color:var(--c-ink-mute);width:40px;height:40px;")}>×</button>
    </div>
  );
}

// Small pager used by Products/Orders tabs.
export function Pager({ page, pageSize, count, onPage }) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (pages <= 1) return null;
  return (
    <div style={css("display:flex;justify-content:center;align-items:center;gap:14px;margin-top:22px;")}>
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1} style={css(`padding:8px 16px;border:1px solid var(--c-line-strong);border-radius:9px;background:#fff;cursor:pointer;font-size:13.5px;opacity:${page <= 1 ? 0.5 : 1};`)}>הקודם</button>
      <span style={css("font-size:13.5px;color:var(--c-ink-mute);")}>עמוד {page} מתוך {pages}</span>
      <button onClick={() => onPage(Math.min(pages, page + 1))} disabled={page >= pages} style={css(`padding:8px 16px;border:1px solid var(--c-line-strong);border-radius:9px;background:#fff;cursor:pointer;font-size:13.5px;opacity:${page >= pages ? 0.5 : 1};`)}>הבא</button>
    </div>
  );
}
