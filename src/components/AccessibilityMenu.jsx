import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { useDialog } from "../hooks/useDialog.js";
import { pathFor } from "../lib/routes.js";

/**
 * AccessibilityMenu — the site's own accessibility toolbar (no third-party
 * overlay script). It complements, never replaces, the real WCAG/IS 5568
 * fixes in the markup. Each option toggles a class on <html>; the matching
 * rules live in styles/a11y.css. Settings persist per visitor.
 */
const KEY = "alfi:a11y";
const DEFAULTS = { text: 0, contrast: false, links: false, readable: false, nomotion: false };
const TEXT_STEPS = [1, 1.12, 1.25, 1.4];

function load() {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) || "{}")) }; } catch { return { ...DEFAULTS }; }
}

// Also called from main.jsx before the first render, so saved settings
// apply without a flash.
export function applyA11y(s = load()) {
  const root = document.documentElement;
  root.classList.toggle("a11y-contrast", !!s.contrast);
  root.classList.toggle("a11y-links", !!s.links);
  root.classList.toggle("a11y-readable", !!s.readable);
  root.classList.toggle("a11y-nomotion", !!s.nomotion);
  root.style.setProperty("--a11y-zoom", String(TEXT_STEPS[s.text] || 1));
  root.classList.toggle("a11y-zoomed", s.text > 0);
  window.dispatchEvent(new Event("a11y-change"));
}

export function openA11yMenu() { window.dispatchEvent(new Event("a11y-open")); }

const Icon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="4" r="2" />
    <path d="M19 8.5c-2.2.6-4.6.9-7 .9s-4.8-.3-7-.9l-.5 1.9c1.9.5 3.8.8 5.7 1v3.1l-2 6.7 1.9.6 1.9-6.1 1.9 6.1 1.9-.6-2-6.7v-3.1c1.9-.2 3.8-.5 5.7-1z" />
  </svg>
);

export function AccessibilityMenu({ go }) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(load);
  const panelRef = useDialog(open, () => setOpen(false));

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("a11y-open", onOpen);
    return () => window.removeEventListener("a11y-open", onOpen);
  }, []);

  const update = (patch) => {
    const next = { ...s, ...patch };
    setS(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode — still applies for this visit */ }
    applyA11y(next);
  };

  const toggle = (k, label) => (
    <button type="button" aria-pressed={!!s[k]} onClick={() => update({ [k]: !s[k] })} className="a11y-opt">
      <span>{label}</span>
      <span className="a11y-switch" aria-hidden="true" />
    </button>
  );

  return (
    <>
      <button
        type="button"
        className="a11y-fab"
        aria-label="תפריט נגישות"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-title"
          dir="rtl"
          className="a11y-panel"
        >
          <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;")}>
            <h2 id="a11y-title" style={css("font-family:var(--font-serif);font-weight:400;font-size:20px;margin:0;")}>נגישות</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="סגירת תפריט הנגישות" className="a11y-close">×</button>
          </div>

          <div className="a11y-opt" role="group" aria-label="גודל טקסט">
            <span>גודל טקסט</span>
            <span style={css("display:flex;align-items:center;gap:6px;")}>
              <button type="button" className="a11y-step" aria-label="הקטנת טקסט" disabled={s.text <= 0} onClick={() => update({ text: s.text - 1 })}>א−</button>
              <span aria-live="polite" style={css("min-width:44px;text-align:center;font-size:13px;")}>{Math.round((TEXT_STEPS[s.text] || 1) * 100)}%</span>
              <button type="button" className="a11y-step" aria-label="הגדלת טקסט" disabled={s.text >= TEXT_STEPS.length - 1} onClick={() => update({ text: s.text + 1 })}>א+</button>
            </span>
          </div>
          {toggle("contrast", "ניגודיות גבוהה")}
          {toggle("links", "הדגשת קישורים")}
          {toggle("readable", "גופן קריא")}
          {toggle("nomotion", "עצירת אנימציות")}

          <button type="button" className="a11y-reset" onClick={() => update({ ...DEFAULTS })}>איפוס הגדרות</button>
          <a
            href={pathFor("accessibility")}
            onClick={(e) => { e.preventDefault(); setOpen(false); go("accessibility"); }}
            className="a11y-statement"
          >הצהרת נגישות</a>
        </div>
      )}
    </>
  );
}
