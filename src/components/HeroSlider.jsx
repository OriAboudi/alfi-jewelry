import React, { useEffect, useRef, useState } from "react";
import { css } from "../lib/css.js";

/**
 * HeroSlider — full-bleed autoplay crossfade slider for the homepage hero.
 * `images` is an array of URLs; an empty array falls back to a single
 * gradient "slide" so the hero still renders something. Overlay content
 * (badge/CTA) is passed as children and stays fixed above the slides.
 */
export function HeroSlider({ images, autoplayMs = 5500, children }) {
  const slides = images && images.length ? images : [null];
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    setActive(0);
    if (slides.length <= 1) return undefined;
    timer.current = setInterval(() => setActive((i) => (i + 1) % slides.length), autoplayMs);
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, autoplayMs]);

  const goTo = (i) => {
    setActive(i);
    if (timer.current) clearInterval(timer.current);
    if (slides.length > 1) timer.current = setInterval(() => setActive((x) => (x + 1) % slides.length), autoplayMs);
  };

  // `position:absolute;inset:0` instead of `width/height:100%` — the parent
  // <section> (Home.jsx) only sets min-height/max-height, not an explicit
  // height, so a percentage-height child doesn't reliably resolve against
  // it (renders at 0 height, invisible, even though the background-image
  // itself loads fine — hence "the network request succeeds but nothing
  // shows"). Absolute positioning fills the parent's actual rendered box
  // regardless of how that height was determined.
  return (
    <div style={css("position:absolute;inset:0;overflow:hidden;")}>
      {slides.map((src, i) => (
        <div
          key={i}
          style={css(`position:absolute;inset:0;transition:opacity .9s ease;opacity:${i === active ? 1 : 0};background:${src ? `url("${src}") center/cover` : "radial-gradient(120% 100% at 50% 25%,#f3e8dd,#ecd9c8)"};`)}
          aria-hidden={i !== active}
        />
      ))}
      {children}
      {slides.length > 1 && (
        <div style={css("position:absolute;bottom:var(--sp-4);left:50%;transform:translateX(-50%);display:flex;gap:9px;z-index:2;")}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`שקופית ${i + 1}`}
              aria-current={i === active}
              style={css(`width:${i === active ? "22px" : "8px"};height:8px;border-radius:var(--r-pill);border:none;cursor:pointer;background:${i === active ? "var(--c-accent)" : "rgba(255,255,255,.7)"};transition:width var(--dur) var(--ease),background var(--dur) var(--ease);padding:0;`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
