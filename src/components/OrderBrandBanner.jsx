import React from "react";

/**
 * OrderBrandBanner — the order-confirmation brand mark, matching the order
 * emails: the "ALFI" wordmark (site serif, wide tracking, ink) on the floral
 * painting. Used on the confirmation and order-status pages. Styles live in
 * redesign.css (.rd-order-brand).
 */
export function OrderBrandBanner() {
  return (
    <div className="rd-order-brand">
      <span className="serif rd-order-brand-word" dir="ltr">ALFI</span>
    </div>
  );
}
