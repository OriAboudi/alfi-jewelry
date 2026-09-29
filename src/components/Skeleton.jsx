import React from "react";
import { css } from "../lib/css.js";

// Neutral loading placeholders for server-managed content (see .sk in
// redesign.css). They reserve roughly the real content's space, so nothing
// jumps when the data arrives, and never show a stand-in text or photo that
// could be mistaken for the real thing.

// One or more text lines. `width` may be one value or one per line.
export function SkeletonText({ lines = 1, width = "100%", height = 14, gap = 10, style = "" }) {
  const widths = Array.isArray(width) ? width : Array.from({ length: lines }, (_, i) => (i === lines - 1 && lines > 1 ? "70%" : width));
  return (
    <span aria-hidden="true" style={css(`display:flex;flex-direction:column;gap:${gap}px;width:100%;${style}`)}>
      {widths.map((w, i) => <span key={i} className="sk" style={css(`display:block;height:${height}px;width:${w};border-radius:6px;`)} />)}
    </span>
  );
}

// A block (image area, button…).
export function SkeletonBlock({ style = "", className = "" }) {
  return <span aria-hidden="true" className={`sk ${className}`} style={css(`display:block;${style}`)} />;
}

// Same footprint as RedesignProductCard.
export function SkeletonCard() {
  return (
    <div className="rd-card glass-strong" aria-hidden="true" style={css("width:100%;box-sizing:border-box;display:flex;flex-direction:column;")}>
      <span className="rd-card-img sk" style={css("display:block;")} />
      <SkeletonText lines={2} width={["75%", "40%"]} height={13} style="padding:0 4px;" />
    </div>
  );
}

// Screen-reader announcement for a loading region (the shapes are aria-hidden).
export function LoadingLabel({ text = "טוען…" }) {
  return <span role="status" className="sr-only">{text}</span>;
}
