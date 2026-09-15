import { css } from "./css.js";

// Gradient fills used as image fallbacks — a neutral warm-grey card surface
// (not tan/caramel, which reads as gold) so an unpopulated product card
// still looks intentional without implying the wrong metal.
export const GRAD_CARD = "radial-gradient(110% 100% at 55% 28%,#f1ece3,#d8d0c3)";
export const GRAD_PRODUCT = "radial-gradient(120% 100% at 60% 25%,#f3eee5,#dad2c6)";
export const GRAD_COVER = "radial-gradient(120% 100% at 55% 30%,#f1ece3,#d8d0c3)";

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
