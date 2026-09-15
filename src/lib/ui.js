import { css } from "./css.js";

// Gradient fills used as image fallbacks — warmer/richer than a flat pale
// cream so an unpopulated product card still reads as "jewelry", not blank.
export const GRAD_CARD = "radial-gradient(110% 100% at 55% 28%,#f3ddc2,#dcb488)";
export const GRAD_PRODUCT = "radial-gradient(120% 100% at 60% 25%,#f6dcc2,#dfab7d)";
export const GRAD_COVER = "radial-gradient(120% 100% at 55% 30%,#f3ddc2,#dcb488)";

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
