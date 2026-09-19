// Shared constants/components for every admin tab — extracted from the
// original monolithic Admin.jsx so each tab file can stay focused.
import React from "react";
import { css } from "../../lib/css.js";
import { CAT_NAMES } from "../../lib/categories.js";

export const STATUS_OPTS = ["התקבלה", "בהכנה", "נשלחה", "בדרך", "נמסר", "בוטלה"];
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

// Overlay shell shared by every editor/detail modal in the admin panel.
export function Overlay({ onClose, maxWidth = 560, children }) {
  return (
    <div onClick={onClose} style={css("position:fixed;inset:0;z-index:80;background:rgba(46,34,49,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;")}>
      <div onClick={(e) => e.stopPropagation()} dir="rtl" style={css(`background:var(--c-bg);border-radius:20px;width:100%;max-width:${maxWidth}px;max-height:90vh;overflow-y:auto;padding:32px;box-shadow:var(--shadow-modal);`)}>
        {children}
      </div>
    </div>
  );
}

export function OverlayHeader({ title, onClose }) {
  return (
    <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;")}>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:26px;")}>{title}</h2>
      <span onClick={onClose} style={css("cursor:pointer;font-size:24px;color:var(--c-ink-mute);")}>×</span>
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
