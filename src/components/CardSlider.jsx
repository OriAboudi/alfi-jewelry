import React, { useRef } from "react";
import { css } from "../lib/css.js";

/**
 * CardSlider — horizontal scroll-snap carousel for product/jewelry cards.
 * Swipes natively on touch devices; arrow buttons scroll by one viewport
 * width on desktop/mouse. Each child is expected to size itself (flex
 * item), so this component only owns the scrolling shell + arrows.
 */
export function CardSlider({ children }) {
  const trackRef = useRef(null);

  const scrollByPage = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.86, behavior: "smooth" });
  };

  return (
    <div style={css("position:relative;")}>
      <div
        ref={trackRef}
        className="no-scrollbar"
        style={css("display:flex;gap:2px;overflow-x:auto;overscroll-behavior:contain;scroll-snap-type:x mandatory;scroll-padding-inline:var(--sp-1);-webkit-overflow-scrolling:touch;padding-bottom:4px;")}
      >
        {React.Children.map(children, (child) => (
          <div style={css("scroll-snap-align:start;flex:0 0 auto;")}>{child}</div>
        ))}
      </div>
      <button
        onClick={() => scrollByPage(-1)}
        aria-label="הקודם"
        className="r-slider-arrow"
        style={css("position:absolute;top:38%;right:-14px;width:44px;height:44px;border-radius:50%;border:1px solid var(--c-line);background:#fff;box-shadow:var(--shadow-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--c-ink);")}
      >›</button>
      <button
        onClick={() => scrollByPage(1)}
        aria-label="הבא"
        className="r-slider-arrow"
        style={css("position:absolute;top:38%;left:-14px;width:44px;height:44px;border-radius:50%;border:1px solid var(--c-line);background:#fff;box-shadow:var(--shadow-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--c-ink);")}
      >‹</button>
    </div>
  );
}
