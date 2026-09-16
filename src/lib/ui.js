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
  // Always longhand background-* properties (never the `background`
  // shorthand) so callers can cleanly override just backgroundSize/
  // backgroundColor via `extra` — mixing shorthand and longhand for the
  // same underlying value is exactly what React warns is unreliable
  // across re-renders.
  return {
    borderRadius: 14,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: grad,
    backgroundImage: img ? `url("${img}")` : "none",
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    ...(extra ? css(extra) : {}),
  };
}
