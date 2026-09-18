import React from "react";
import { css } from "../lib/css.js";

// Shown for the brief moment between landing back on the site (from a
// Takbull redirect, or an emailed order-tracking link) and the real order
// data finishing its fetch — see the "pending redirect" screen detection in
// StoreContext.jsx. Without this, the app's default screen (home) would
// flash on screen first, which looked like a bug rather than a normal load.
export function Loading() {
  return (
    <div style={css("min-height:60vh;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:60px 20px;")}>
      <div style={css("width:44px;height:44px;border-radius:50%;border:3px solid var(--c-line-strong);border-top-color:var(--c-accent);margin-bottom:18px;animation:r-spin 0.8s linear infinite;")} />
      <style>{"@keyframes r-spin{to{transform:rotate(360deg)}}"}</style>
      <p style={css("font-size:15px;color:var(--c-ink-soft);")}>רגע, טוענים את פרטי ההזמנה…</p>
    </div>
  );
}
