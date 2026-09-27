import React, { useEffect, useRef, useState } from "react";
import { css } from "../lib/css.js";

// The hero photos are shot on a light-grey studio backdrop. Rendered with
// mix-blend-mode: multiply over the hero's cream glass surface, that grey
// would print as a slightly dirty cream; lifting the photo's brightness so
// its backdrop reaches ~white makes the backdrop vanish into the glass
// (white x surface = surface) while the model and jewellery stay intact.
// The lift is measured per photo from its top corners (pure backdrop), so
// future uploads with a different backdrop tone calibrate themselves.
function measureLift(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const S = 64;
        const c = document.createElement("canvas");
        c.width = S; c.height = S;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, S, S);
        const corner = (x0) => {
          const d = ctx.getImageData(x0, 0, 6, 6).data;
          let m = 0;
          for (let i = 0; i < d.length; i += 4) m += Math.max(d[i], d[i + 1], d[i + 2]);
          return m / (d.length / 4);
        };
        const backdrop = (corner(0) + corner(S - 6)) / 2;
        resolve(Math.min(1.25, Math.max(1, 252 / Math.max(backdrop, 1))).toFixed(3));
      } catch { resolve(null); } // no CORS / tainted canvas: CSS default lift stays
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

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
  const mediaRef = useRef(null);
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

  // Calibrate the active photo's brightness lift (CSS vars on the hero
  // section; see .rd-hero-img in redesign.css).
  useEffect(() => {
    const host = mediaRef.current?.parentElement;
    if (!host) return undefined;
    let alive = true;
    const d = desktopSlides[active % desktopSlides.length];
    const m = mobileSlides[active % mobileSlides.length];
    Promise.all([measureLift(d), measureLift(m)]).then(([dl, ml]) => {
      if (!alive) return;
      if (dl) host.style.setProperty("--hero-lift-desktop", dl);
      if (ml) host.style.setProperty("--hero-lift-mobile", ml);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, desktopSlides.join("|"), mobileSlides.join("|")]);

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

  // The photo is its own block (.rd-hero-media) beside/above the text
  // panel — the pictures are product shots (jewellery on a model), so
  // nothing sits on top of them except the small pause control. `children`
  // (the headline/CTA panel) stays a normal-flow sibling, so the hero grows
  // to fit real content instead of clipping it.
  return (
    <>
      <div ref={mediaRef} className="rd-hero-media">
        {layer(mobileSlides, "r-hero-layer-mobile")}
        {layer(desktopSlides, "r-hero-layer-desktop")}
        {slideCount > 1 && (
          <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "הפעלת החלפת התמונות" : "עצירת החלפת התמונות"}
          aria-pressed={paused}
          style={css("position:absolute;bottom:14px;left:14px;z-index:3;width:40px;height:40px;border:0;border-radius:50%;background:rgba(251,248,245,.92);box-shadow:0 2px 8px rgba(58,45,61,.18);color:var(--ink);cursor:pointer;display:flex;align-items:center;justify-content:center;")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
          </svg>
        </button>
      )}
      </div>
      {children}
    </>
  );
}
