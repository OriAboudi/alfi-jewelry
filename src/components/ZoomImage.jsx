import React, { useEffect, useRef, useState } from "react";

const MAX_ZOOM = 6;

// Touch devices have no hover state — combining onMouseEnter with onClick on
// the same element is a well-known trap on iOS Safari, where the first tap
// only fires the "hover" and a second tap is needed to actually click. This
// check disables all the mouse-only zoom wiring below on touch devices, so
// a single tap always registers immediately.
const IS_TOUCH = typeof window !== "undefined" && (("ontouchstart" in window) || navigator.maxTouchPoints > 0);

/**
 * ZoomImage — hover-follows-cursor magnifier over an image (desktop only).
 * Hold Ctrl (or pinch on a trackpad — browsers report that as a wheel event
 * with ctrlKey set, so this naturally supports it too) while scrolling to
 * zoom in/out further. Pure CSS background-position panning, no modal, no
 * external dependencies. On touch devices this renders as a plain static
 * image instead.
 *
 * A plain wheel scroll (no Ctrl) is deliberately never intercepted — it
 * always scrolls the page. An earlier version zoomed on any wheel scroll
 * while hovering, which meant it had to swallow every scroll input over the
 * image to stop the page scrolling underneath it at the same time; users
 * trying to just scroll past the image kept getting stuck. Gating on Ctrl
 * (same convention browsers themselves use for page zoom) means the two
 * interactions never compete: unmodified scroll always passes through.
 */
export function ZoomImage({ src, radius = 18, onClick, zoomScale = 2.4, cursor = "zoom-in" }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hover, setHover] = useState(false);
  const [scale, setScale] = useState(zoomScale);

  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  useEffect(() => {
    if (IS_TOUCH || !hover) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const onWheelNative = (e) => {
      if (!e.ctrlKey && !e.metaKey) return; // plain scroll: don't touch it, let the page scroll
      e.preventDefault();
      setScale((s) => Math.max(zoomScale, Math.min(MAX_ZOOM, s - e.deltaY * 0.01)));
    };
    // Registered non-passive ONLY so preventDefault works for the Ctrl+wheel
    // case above — every other wheel event returns immediately without
    // calling it, so normal scrolling is completely unaffected.
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [hover, zoomScale]);

  return (
    <div
      ref={ref}
      onMouseEnter={IS_TOUCH ? undefined : () => setHover(true)}
      onMouseLeave={IS_TOUCH ? undefined : () => { setHover(false); setScale(zoomScale); }}
      onMouseMove={IS_TOUCH ? undefined : move}
      onClick={onClick}
      style={{
        position: "relative", overflow: "hidden", borderRadius: radius,
        background: "#efe9f1", width: "100%", height: "100%", cursor: IS_TOUCH ? "default" : cursor,
        boxShadow: hover ? "inset 0 0 0 1px rgba(189,115,85,.35)" : "inset 0 0 0 1px rgba(0,0,0,0)",
        transition: "box-shadow .35s ease",
      }}
    >
      <div
        style={{
          width: "100%", height: "100%",
          backgroundImage: src ? `url("${src}")` : "none",
          backgroundSize: hover ? `${scale * 100}%` : "cover",
          backgroundPosition: hover ? `${pos.x}% ${pos.y}%` : "center",
          backgroundRepeat: "no-repeat",
          transition: "background-size .12s ease-out",
        }}
      />
      {!IS_TOUCH && (
      <div
        style={{
          position: "absolute", bottom: 14, insetInlineStart: 14,
          width: 38, height: 38, borderRadius: "50%",
          background: "rgba(255,255,255,.92)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 6px 18px rgba(58,45,61,.18)",
          opacity: hover ? 0 : 1,
          transform: hover ? "scale(.8)" : "scale(1)",
          transition: "opacity .25s ease, transform .25s ease",
          pointerEvents: "none",
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--c-accent)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.2" y2="16.2" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>
      )}
      {!IS_TOUCH && (
      <div
        style={{
          position: "absolute", top: 14, insetInlineEnd: 14,
          padding: "6px 12px", borderRadius: 999,
          background: "rgba(20,14,10,.55)", backdropFilter: "blur(4px)",
          color: "#fff", fontSize: 12, letterSpacing: ".01em",
          opacity: hover ? 1 : 0,
          transform: hover ? "translateY(0)" : "translateY(-6px)",
          transition: "opacity .25s ease, transform .25s ease",
          pointerEvents: "none", whiteSpace: "nowrap",
        }}
      >
        Ctrl + גלגלת להגדלה · ×{scale.toFixed(1)}
      </div>
      )}
    </div>
  );
}
