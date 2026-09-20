import React, { useEffect, useRef, useState } from "react";

/**
 * Reveal — a single scroll-triggered entrance per section (fade + slight
 * rise), reusing the .rd-rise keyframe that already existed in redesign.css
 * but was never wired to anything. Deliberately applied once per section,
 * not per card/child — one authored moment per section beats a scattered
 * cascade of identical entrances on every element.
 *
 * prefers-reduced-motion is handled entirely in CSS (.rd-reveal-pending /
 * .rd-rise both collapse to opacity:1, no motion) so this component doesn't
 * need to branch on it itself.
 */
export function Reveal({ children, className = "", as: Tag = "div", delay, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const delayClass = delay ? ` rd-d${delay}` : "";
  return (
    <Tag ref={ref} className={`${className} ${visible ? "rd-rise" + delayClass : "rd-reveal-pending"}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
