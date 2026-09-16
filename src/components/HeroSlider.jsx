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

  useEffect(() => {
    setActive(0);
    if (slideCount <= 1) return undefined;
    timer.current = setInterval(() => setActive((i) => (i + 1) % slideCount), autoplayMs);
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideCount, autoplayMs]);

  const layer = (slides, className) => slides.map((src, i) => {
    const isActive = i === active % slides.length;
    return (
      <div
        key={i}
        className={className}
        style={css(`position:absolute;inset:0;transition:opacity .9s ease;opacity:${isActive ? 1 : 0};background-image:${src ? `url("${src}")` : "radial-gradient(120% 100% at 50% 25%,#f3e8dd,#ecd9c8)"};background-position:center;background-size:cover;background-repeat:no-repeat;`)}
        aria-hidden={!isActive}
      />
    );
  });

  return (
    <div style={css("position:absolute;inset:0;overflow:hidden;")}>
      {layer(mobileSlides, "r-hero-layer-mobile")}
      {layer(desktopSlides, "r-hero-layer-desktop")}
      {children}
    </div>
  );
}
