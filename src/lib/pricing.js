// Shared cart-totals math, used for DISPLAY only by Cart/Checkout/Product.
// The real, authoritative total (including coupon discount) is always
// computed server-side in supabase/functions/create-takbull-payment — this
// just keeps the three client-side previews from drifting out of sync with
// each other.
export function computeTotals(lines, content, couponPercent = 0) {
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const shipping = subtotal >= Number(content.freeShipFrom || 500) ? 0 : Number(content.shipFee || 39);
  const discount = couponPercent > 0 ? Math.round(subtotal * couponPercent) / 100 : 0;
  const total = Math.max(0, subtotal + shipping - discount);
  return { subtotal, shipping, discount, total };
}
