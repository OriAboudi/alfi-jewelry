import React, { useRef, useState } from "react";
import { css } from "../lib/css.js";

const LeftArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M15 5l-7 7 7 7" /></svg>
);
const RightArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M9 5l7 7-7 7" /></svg>
);

/**
 * CardSlider — horizontal scroll-snap rail for product cards (design-handoff
 * redesign, with a later placement tweak: prev/next as floating left/right
 * arrows beside the rail itself — in the section's side margin, where the
 * rail doesn't reach — instead of the header row above it).
 *
 * Pure presentational scroll math (RTL scrollLeft sign handling, snap
 * points) — no business/cart logic here.
 */
export function CardSlider({ children }) {
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const cardStep = () => {
    const el = trackRef.current;
    if (!el || !el.firstElementChild) return el ? el.clientWidth : 0;
    const card = el.firstElementChild;
    const gap = parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap || "0") || 0;
    return card.offsetWidth + gap;
  };

  // dir=1 -> positive scrollLeft delta -> back toward the start of the list.
  // dir=-1 -> negative delta -> forward. Modern browsers report a negative
  // scrollLeft in RTL as content scrolls toward the end of reading order
  // (visually left).
  const scrollByCard = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * cardStep(), behavior: "smooth" });
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max <= 0 ? 0 : Math.min(1, Math.abs(el.scrollLeft) / max));
  };

  return (
    <div style={css("position:relative;")}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="rd-rail rd-rail-gutter"
        style={css("display:flex;overflow-x:auto;padding-top:8px;padding-bottom:24px;")}
      >
        {React.Children.map(children, (child) => (
          // The width has to live here, not on the card's own root div —
          // this wrapper is the actual flex item of .rd-rail; the card
          // inside it is only a block-level grandchild, so a `flex`
          // declaration on the card itself is silently ignored (it was
          // collapsing to its text content's width, not the intended
          // 210–270px — see the "cards too narrow" report).
          <div className="rd-snap rd-card-width">{child}</div>
        ))}
      </div>
      <div className="rd-progress-gutter" style={css("height:2px;background:rgba(58,45,61,.18);display:flex;")}>
        <span style={css(`width:${Math.max(6, progress * 100)}%;background:var(--ink);transition:width .15s linear;`)} />
      </div>
      {/* Reported as swapped — clicking the left arrow was doing the right
          arrow's job. The button on the left edge should reveal what's
          further along the (RTL) list — that's the negative-delta
          direction, not the positive one. */}
      <button className="rd-arrow rd-rail-arrow rd-rail-arrow-left" aria-label="הבא" onClick={() => scrollByCard(-1)}><LeftArrow /></button>
      <button className="rd-arrow rd-rail-arrow rd-rail-arrow-right" aria-label="הקודם" onClick={() => scrollByCard(1)}><RightArrow /></button>
    </div>
  );
}
