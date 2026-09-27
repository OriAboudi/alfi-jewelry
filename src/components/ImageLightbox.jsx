import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { css } from "../lib/css.js";

/**
 * ImageLightbox — full-screen image viewer (admin product list + product
 * editor). Portaled to <body> and stacked above the admin Overlay (z 80).
 * Close: ×, Escape, or a click on the dark backdrop. Several images: the
 * arrow buttons or ←/→ keys step through them.
 */
// SVG, not ‹ › characters — those are bidi-mirrored inside RTL text.
const Chevron = ({ dir }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === "right" ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
  </svg>
);

export function ImageLightbox({ images, startIndex = 0, onClose }) {
  const list = (images || []).filter(Boolean);
  const [idx, setIdx] = useState(Math.min(startIndex, Math.max(0, list.length - 1)));
  const many = list.length > 1;
  const step = (d) => setIdx((i) => (i + d + list.length) % list.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopImmediatePropagation(); onClose(); }
      // RTL page: the right arrow key goes to the previous image.
      else if (many && e.key === "ArrowRight") step(-1);
      else if (many && e.key === "ArrowLeft") step(1);
    };
    // Capture phase so Escape closes only the lightbox, not the editor under it.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, many, list.length]);

  if (!list.length) return null;

  const navBtn = "position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border:0;border-radius:50%;background:rgba(251,248,245,.9);color:var(--c-ink);font-size:24px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;";

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="תצוגת תמונה"
      dir="rtl"
      style={css("position:fixed;inset:0;z-index:130;background:rgba(30,22,32,.88);display:flex;align-items:center;justify-content:center;padding:56px 16px 48px;")}
    >
      <button type="button" onClick={onClose} aria-label="סגירה" style={css("position:absolute;top:12px;left:12px;width:44px;height:44px;border:0;border-radius:50%;background:rgba(251,248,245,.9);color:var(--c-ink);font-size:26px;line-height:1;cursor:pointer;")}>×</button>
      <img
        src={list[idx]}
        alt={`תמונה ${idx + 1}`}
        onClick={(e) => e.stopPropagation()}
        style={css("max-width:min(92vw, 1100px);max-height:100%;object-fit:contain;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.35);")}
      />
      {many && (
        <>
          <button type="button" aria-label="התמונה הקודמת" onClick={(e) => { e.stopPropagation(); step(-1); }} style={css(navBtn + "right:16px;")}><Chevron dir="right" /></button>
          <button type="button" aria-label="התמונה הבאה" onClick={(e) => { e.stopPropagation(); step(1); }} style={css(navBtn + "left:16px;")}><Chevron dir="left" /></button>
          <div dir="ltr" style={css("position:absolute;bottom:14px;left:0;right:0;text-align:center;color:#fff;font-size:14px;")}>{idx + 1} / {list.length}</div>
        </>
      )}
    </div>,
    document.body
  );
}
