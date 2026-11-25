import React from "react";

/**
 * BrandLogo — the ALFI logo (gold A with a lily, "ALFI", a hairline and
 * "SILVER JEWELRY"), lifted off the brand's embossed-gold artwork into
 * transparent images in public/brand/.
 *   variant="lockup" — horizontal: monogram beside ALFI + tagline (header)
 *   variant="full"   — the whole stacked logo (pop-up, footer)
 * Decorative images (alt=""): the link or element around it carries the name.
 * Width/height are set so nothing shifts while the images load.
 */
export function BrandLogo({ variant = "lockup", tagline = true, className = "", eager = false }) {
  const loading = eager ? "eager" : "lazy";
  if (variant === "full") {
    return <img src="/brand/alfi-logo.webp" alt="" width="376" height="480" loading={loading} decoding="async" className={`alfi-logo-full ${className}`} />;
  }
  return (
    <span className={`alfi-lockup ${className}`} dir="ltr">
      <img src="/brand/alfi-monogram.webp" alt="" width="166" height="168" loading={loading} decoding="async" className="alfi-lockup-mono" />
      <span className="alfi-lockup-text">
        <img src="/brand/alfi-wordmark.webp" alt="" width="292" height="64" loading={loading} decoding="async" className="alfi-lockup-word" />
        {tagline && <img src="/brand/alfi-tagline.webp" alt="" width="213" height="40" loading={loading} decoding="async" className="alfi-lockup-tag" />}
      </span>
    </span>
  );
}
