import React from "react";
import { css } from "../lib/css.js";

/**
 * BrandDialog — the shared look of the site's customer pop-ups (sign-up
 * coupon, sign-in): the brand painting with the ALFI JEWELRY logo as a top
 * band, the floral painting behind a frosted cream panel, centred content.
 * Keyboard/focus behaviour comes from useDialog in the caller (panelRef).
 */

// The panel is painted with two images. Opening before they are decoded
// shows the panel first and the pictures popping in after; callers that
// open on their own wait for this (briefly — a slow network still gets the
// dialog after 2.5s). Warmed up early so a click-opened dialog is instant.
const IMAGES = ["/floral-bg.jpg", "/signup-bg.jpg"];
let imagesReady = null;
export function preloadBrandImages() {
  if (!imagesReady) {
    imagesReady = Promise.race([
      Promise.all(IMAGES.map((src) => { const img = new Image(); img.src = src; return img.decode().catch(() => {}); })),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  }
  return imagesReady;
}

// Form pieces shared by both dialogs. 16px text: iOS zooms into smaller fields.
export const brandLabel = "display:block;font-size:12.5px;color:var(--c-ink-mute);margin-bottom:5px;text-align:right;";
export const brandField = "width:100%;padding:13px 14px;border:1.5px solid var(--c-line-strong);border-radius:var(--r-md);font-size:16px;background:rgba(255,255,255,.55);color:var(--c-ink);transition:border-color .2s, background-color .2s;";
export const brandFieldErr = brandField.replace("var(--c-line-strong)", "#d98a72");
export const brandErrMsg = "color:var(--c-danger);font-size:12px;margin-top:5px;text-align:right;";
export const brandTitle = "font-family:var(--font-serif);font-weight:400;font-size:21px;line-height:1.3;margin:0 0 6px;";
export const brandLead = "font-size:13.5px;line-height:1.6;color:var(--c-ink-soft);margin:0 0 16px;";
export const brandLink = "background:none;border:0;padding:6px 4px;font:inherit;cursor:pointer;color:var(--c-accent-dark);font-size:13.5px;font-weight:600;min-height:var(--tap);";
export const brandQuiet = "background:none;border:0;padding:6px;font:inherit;cursor:pointer;font-size:12.5px;color:var(--c-ink-mute);min-height:var(--tap);";

export function BrandDialog({ panelRef, labelledBy, onClose, children, footer }) {
  return (
    <div
      onClick={onClose}
      className="rd-brand-overlay"
      style={css("position:fixed;inset:0;z-index:90;background:rgba(46,34,49,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;")}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="r-signup-panel rd-brand-panel"
        style={css("position:relative;background:#efe4ec url(/floral-bg.jpg) center/cover;border-radius:20px;width:100%;max-width:380px;max-height:88vh;overflow:hidden;box-shadow:var(--shadow-modal);text-align:center;display:flex;flex-direction:column;")}
      >
        <div role="img" aria-label="ALFI Jewelry" style={css("flex:none;height:132px;background:url(/signup-bg.jpg) center 48%/100% auto no-repeat;")} />
        <div className="no-scrollbar" style={css("flex:1;min-height:0;overflow-y:auto;padding:22px 22px 14px;background:rgba(248,243,238,.82);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-top:1px solid rgba(255,255,255,.7);")}>
          {children}
        </div>
        {footer && (
          <div style={css("flex:none;padding:10px 18px 12px;background:rgba(243,236,231,.94);border-top:1px solid rgba(58,45,61,.08);font-size:13px;color:var(--c-ink-soft);")}>
            {footer}
          </div>
        )}
        {/* Last in the DOM (it's positioned over the band): the dialog's
            first focus goes to the form, not to "close". Escape closes too. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירה"
          className="rd-brand-close"
          style={css("position:absolute;top:8px;left:8px;width:44px;height:44px;border:0;border-radius:50%;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;")}
        >
          <span aria-hidden="true" style={css("width:32px;height:32px;border-radius:50%;background:rgba(248,243,238,.85);color:var(--c-ink);display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;box-shadow:0 1px 4px rgba(58,45,61,.18);")}>×</span>
        </button>
      </div>
    </div>
  );
}
