import { css } from "./css.js";

// Plain white card surface (tzufa-style: real product photography sits on
// clean white, not a colored/gradient backdrop) — used both as the filled
// background behind real photos and as the empty-image placeholder fill.
export const GRAD_CARD = "var(--c-surface)";
export const GRAD_PRODUCT = "var(--c-surface)";
export const GRAD_COVER = "var(--c-surface)";

/**
 * thumb() — returns a React style object for an image box that shows the
 * product image when present, or a soft gradient placeholder when empty.
 */
export function thumb(img, grad = GRAD_CARD, extra) {
  return {
    borderRadius: 14,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: img ? `url("${img}") center/cover` : grad,
    ...(extra ? css(extra) : {}),
  };
}
