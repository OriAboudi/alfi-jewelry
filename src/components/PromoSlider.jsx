import React, { useEffect, useRef, useState } from "react";
import { css } from "../lib/css.js";

const INTERVAL_MS = 4000;
const FADE_MS = 300;

/**
 * PromoSlider — the home page's top strip, showing one short line at a
 * time and auto-advancing every 4s with a quick fade (admin-editable list,
 * content.promoStripItems — see ContentTab.jsx).
 */
export function PromoSlider({ items }) {
  const list = (items || []).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setIndex(0);
    setVisible(true);
    if (list.length <= 1) return undefined;
    const iv = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % list.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  if (!list.length) return null;

  return (
    <span style={css(`font-size:13px;font-weight:600;color:var(--c-accent-dark);white-space:nowrap;transition:opacity ${FADE_MS}ms ease;opacity:${visible ? 1 : 0};`)}>
      {list[index]}
    </span>
  );
}
