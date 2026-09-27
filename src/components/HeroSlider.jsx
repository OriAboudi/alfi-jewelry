import React, { useEffect, useRef, useState } from "react";
import { css } from "../lib/css.js";

/**
 * HeroSlider — full-bleed autoplay crossfade slider for the homepage hero.
 * Accepts separate desktop/mobile image sets (like tzufa.co.il does — their
 * mobile hero is a genuinely different, portrait-cropped photo per slide,
 * not just a resized desktop one) and switches between them purely via CSS
 * breakpoint (.r-hero-layer-mobile/-desktop in index.css), not JS viewport
 * detection, so there's no hydration/resize flicker. `imagesMobile` is
 * optional — if empty, mobile just reuses the desktop images.
 */
export function HeroSlider({ images, imagesMobile, autoplayMs = 5500, children }) {
  const desktopSlides = images && images.length ? images : [null];
  const mobileSlides = imagesMobile && imagesMobile.length ? imagesMobile : desktopSlides;
  const slideCount = Math.max(desktopSlides.length, mobileSlides.length);
  const [active, setActive] = useState(0);
  const timer = useRef(null);
  // WCAG 2.2.2 (Pause, Stop, Hide): auto-rotation can be paused with a
  // visible button, and never starts for visitors who asked for less motion
  // (OS setting, or "עצירת אנימציות" in the accessibility menu).
  const prefersStill = () => typeof window !== "undefined" && (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("a11y-nomotion"));
  const [paused, setPaused] = useState(prefersStill);

  useEffect(() => {
    const onA11y = () => { if (prefersStill()) setPaused(true); };
    window.addEventListener("a11y-change", onA11y);
    return () => window.removeEventListener("a11y-change", onA11y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (slideCount <= 1 || paused) return undefined;
    timer.current = setInterval(() => setActive((i) => (i + 1) % slideCount), autoplayMs);
    return () => clearInterval(timer.current);
  }, [slideCount, autoplayMs, paused]);

  const layer = (slides, className) => slides.map((src, i) => {
    const isActive = i === active % slides.length;
    return (
      <div
        key={i}
        className={`${className} rd-hero-img`}
        style={css(`position:absolute;inset:0;transition:opacity .9s ease;opacity:${isActive ? 1 : 0};background-image:${src ? `url("${src}")` : "radial-gradient(120% 100% at 50% 25%,#efe9f1,#ded1e2)"};`)}
        aria-hidden={!isActive}
      />
    );
  });

  // The background photo layer is absolutely positioned (it must fill
  // whatever height the hero ends up being) — but `children` (the text/CTA
  // panel) is rendered as a plain sibling, NOT nested inside that absolute
  // div. An absolutely-positioned parent can't be stretched taller by its
  // own content, so if the panel lived inside it, real panel content
  // (headline + tagline + button) taller than the hero's base height would
  // just get clipped by the parent's overflow:hidden instead of the hero
  // growing to fit it. As a sibling, the panel is a normal-flow child of
  // whatever renders <HeroSlider> (Home.jsx's .rd-hero, a flex container),
  // so its real height can push that container taller when it needs to.
  return (
    <>
      <div className="rd-hero-bg" style={css("position:absolute;inset:0;overflow:hidden;")}>
        {layer(mobileSlides, "r-hero-layer-mobile")}
        {layer(desktopSlides, "r-hero-layer-desktop")}
      </div>
      {slideCount > 1 && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "הפעלת החלפת התמונות" : "עצירת החלפת התמונות"}
          aria-pressed={paused}
          style={css("position:absolute;bottom:14px;left:14px;z-index:3;width:40px;height:40px;border:0;border-radius:50%;background:rgba(251,248,245,.85);color:var(--ink);cursor:pointer;display:flex;align-items:center;justify-content:center;")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
          </svg>
        </button>
      )}
      {children}
    </>
  );
}
