import React from "react";

/**
 * BrandLogo — the ALFI logo (gold A with a lily, "ALFI", a hairline and
 * "SILVER JEWELRY"), lifted off the brand's embossed-gold artwork into
 * transparent images in public/brand/.
 *   variant="lockup" — horizontal ALFI whose A is the lily monogram (header)
 *   variant="full"   — the whole stacked logo (pop-up, footer)
 * Decorative images (alt=""): the link or element around it carries the name.
 * Width/height are set so nothing shifts while the images load.
 */
export function BrandLogo({ variant = "lockup", className = "", eager = false }) {
  const loading = eager ? "eager" : "lazy";
  if (variant === "full") {
    return <img src="/brand/alfi-logo.webp" alt="" width="376" height="480" loading={loading} decoding="async" className={`alfi-logo-full ${className}`} />;
  }
  // One composed image: the lily A *is* the first letter, LFI follows it.
  return <img src="/brand/alfi-lockup.webp" alt="" width="304" height="152" loading={loading} decoding="async" className={`alfi-lockup ${className}`} />;
}
