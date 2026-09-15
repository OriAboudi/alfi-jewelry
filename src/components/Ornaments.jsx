import React from "react";
import { css } from "../lib/css.js";

/**
 * FlowerMark — the hand-drawn line-flower logo ornament.
 * variant "full" has five stems (used on the auth hero), "simple" has three.
 */
export function FlowerMark({ width = 130, height = 48, sw = 1.3, variant = "simple", style }) {
  return (
    <svg width={width} height={height} viewBox="0 0 160 56" style={{ overflow: "visible", ...(style || {}) }}>
      <g stroke="#bd7355" strokeWidth={sw} fill="none" strokeLinecap="round">
        <path d="M80 52 C 80 36 80 22 80 8" />
        <path d="M80 34 C 64 32 56 23 54 12" />
        <path d="M80 34 C 96 32 104 23 106 12" />
        {variant === "full" && <path d="M80 43 C 69 42 62 36 60 28" />}
        {variant === "full" && <path d="M80 43 C 91 42 98 36 100 28" />}
      </g>
      <circle cx="80" cy="7" r="4.5" fill="#a85a44" />
      <ellipse cx="54" cy="11" rx="7" ry="3.4" fill="#d8a98e" transform="rotate(-32 54 11)" />
      <ellipse cx="106" cy="11" rx="7" ry="3.4" fill="#d8a98e" transform="rotate(32 106 11)" />
    </svg>
  );
}

/**
 * Disc — the round conic-gradient "silver" placeholder shown inside a Thumb
 * when a product has no image yet.
 */
export function Disc({ style, children }) {
  const base = "border-radius:50%;background:conic-gradient(from 200deg,#f3ece4,#d6c8b6,#f7f2ec,#cabfae,#e8e0d4,#f3ece4);";
  return <div style={css(base + (style || ""))}>{children}</div>;
}
