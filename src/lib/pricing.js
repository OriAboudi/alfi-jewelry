// Sale pricing model: `price` is always what the customer actually pays (and
// what create-takbull-payment charges — it reads products.price). A product
// is on sale when `compare_at_price` (the regular price) is set and higher.
export function saleInfo(p) {
  const price = Number(p?.price) || 0;
  const regular = Number(p?.compare_at_price) || 0;
  if (!(regular > price) || price <= 0) return { onSale: false, price, regular: price, percent: 0, saved: 0 };
  return { onSale: true, price, regular, percent: Math.round(((regular - price) / regular) * 100), saved: regular - price };
}

// Shared cart-totals math, used for DISPLAY only by Cart/Checkout/Product.
// The real, authoritative total (including coupon discount) is always
// computed server-side in supabase/functions/create-takbull-payment — this
// just keeps the three client-side previews from drifting out of sync with
// each other. Lines are { price, qty, regular? } where regular is the
// pre-sale price (same as price when not on sale).
export function computeTotals(lines, content, couponPercent = 0) {
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const regularSubtotal = lines.reduce((a, l) => a + Math.max(l.regular || 0, l.price) * l.qty, 0);
  const saleSavings = regularSubtotal - subtotal;
  const shipping = subtotal >= Number(content.freeShipFrom || 500) ? 0 : Number(content.shipFee || 39);
  const discount = couponPercent > 0 ? Math.round(subtotal * couponPercent) / 100 : 0;
  const total = Math.max(0, subtotal + shipping - discount);
  return { subtotal, regularSubtotal, saleSavings, shipping, discount, total, totalSaved: saleSavings + discount };
}
