import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { saleInfo } from "../lib/pricing.js";

/**
 * Price display shared by product cards, search results and the product
 * page: sale price, the regular price struck through, and the "-X%" chip.
 * `qty` multiplies both prices (cart/checkout line totals).
 */
export function PriceTag({ product, qty = 1, size, showPercent = true, style = "" }) {
  const s = saleInfo(product);
  // No size → inherit (e.g. .rd-card-price sets it per breakpoint).
  const fs = size ? `font-size:${size}px;` : "";
  if (!s.onSale) {
    return <span style={css(`font-weight:600;white-space:nowrap;${fs}${style}`)}>{fmt(s.price * qty)}</span>;
  }
  return (
    <span style={css(`display:inline-flex;align-items:baseline;flex-wrap:wrap;gap:4px 8px;white-space:nowrap;${fs}${style}`)}>
      <span style={css("font-weight:700;color:var(--c-accent);")}>{fmt(s.price * qty)}</span>
      <s style={css("color:var(--c-ink-faint);font-size:.82em;font-weight:400;")} aria-label={`במקום ${fmt(s.regular * qty)}`}>{fmt(s.regular * qty)}</s>
      {showPercent && <span dir="ltr" style={css("align-self:center;font-size:11.5px;font-weight:700;color:var(--c-accent);background:var(--c-accent-soft);padding:2px 7px;border-radius:100px;")}>-{s.percent}%</span>}
    </span>
  );
}
