import React from "react";

// Simple line-style pictograms matching the stroke recipe already used for
// the header's cart/person icons (stroke="currentColor", strokeWidth 1.8,
// round caps) — generic symbols, not reproductions of any brand's logo
// artwork.
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export function WhatsAppIcon({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" />
      <path d="M8.3 9.6c0 3.6 2.7 6.3 6.1 6.3" strokeWidth={1.5} />
    </svg>
  );
}

export function InstagramIcon({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EmailIcon({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
