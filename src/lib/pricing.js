// Sale pricing model: `price` is always what the customer actually pays (and
// what create-takbull-payment charges — it reads products.price). A product
// is on sale when `compare_at_price` (the regular price) is set and higher.
export function saleInfo(p) {
  const price = Number(p?.price) || 0;
  const regular = Number(p?.compare_at_price) || 0;
  if (!(regular > price) || price <= 0) return { onSale: false, price, regular: price, percent: 0, saved: 0 };
  return { onSale: true, price, regular, percent: Math.round(((regular - price) / regular) * 100), saved: regular - price };
}

// "N for ₪X" bundle deal settings (admin: content.bundleSize/bundlePrice).
export function bundleConfig(content) {
  const size = Math.max(2, Math.floor(Number(content?.bundleSize)) || 3);
  const price = Math.max(0, Number(content?.bundlePrice) || 200);
  return { size, price };
}

// Bundle discount for the eligible units (one entry per unit, its price).
// Units are grouped most-expensive-first into sets of `size`; each set costs
// `price` (never more than the set's own total). Mirrored exactly in
// supabase/functions/create-takbull-payment/index.ts — keep them in sync.
export function bundleDiscount(unitPrices, size, price) {
  const units = [...unitPrices].map(Number).sort((a, b) => b - a);
  const sets = Math.floor(units.length / size);
  let discount = 0;
  for (let i = 0; i < sets; i++) {
    const sum = units.slice(i * size, (i + 1) * size).reduce((a, v) => a + v, 0);
    discount += Math.max(0, sum - price);
  }
  const rest = units.length % size;
  return { discount: Math.round(discount * 100) / 100, sets, eligible: units.length, missing: units.length && rest ? size - rest : 0 };
}

// Shared cart-totals math, used for DISPLAY only by Cart/Checkout/Product.
// The real, authoritative total (including coupon discount) is always
// computed server-side in supabase/functions/create-takbull-payment — this
// just keeps the client-side previews from drifting out of sync with each
// other. Lines are { price, qty, regular?, bundle? } where regular is the
// pre-sale price and bundle marks a product in the "N for ₪X" deal.
// deliveryMethod "pickup" (self pickup) is always free — same rule as the
// server. Order of application (same on the server): bundle deal → free-
// shipping threshold and coupon on what the items cost after the deal.
export function computeTotals(lines, content, couponPercent = 0, deliveryMethod = "delivery") {
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const regularSubtotal = lines.reduce((a, l) => a + Math.max(l.regular || 0, l.price) * l.qty, 0);
  const saleSavings = regularSubtotal - subtotal;
  const cfg = bundleConfig(content);
  const units = lines.flatMap((l) => (l.bundle ? Array(Math.max(0, l.qty)).fill(l.price) : []));
  const bundle = bundleDiscount(units, cfg.size, cfg.price);
  const itemsTotal = subtotal - bundle.discount;
  const shipping = deliveryMethod === "pickup" ? 0 : (itemsTotal >= Number(content.freeShipFrom || 500) ? 0 : Number(content.shipFee || 39));
  const discount = couponPercent > 0 ? Math.round(itemsTotal * couponPercent) / 100 : 0;
  const total = Math.max(0, itemsTotal + shipping - discount);
  return {
    subtotal, regularSubtotal, saleSavings, shipping, discount, total,
    bundleDiscount: bundle.discount, bundleSets: bundle.sets, bundleEligible: bundle.eligible, bundleMissing: bundle.missing,
    bundleSize: cfg.size, bundlePrice: cfg.price,
    totalSaved: saleSavings + bundle.discount + discount,
  };
}
