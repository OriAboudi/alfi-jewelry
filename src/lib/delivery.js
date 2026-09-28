// Delivery methods — shared by checkout, order screens and the admin.
// The pickup address is an admin setting (content.pickupAddress, edited in
// Admin → תוכן האתר); this default only applies until an admin sets one.
// Keep in sync with DEFAULT_PICKUP_ADDRESS in
// supabase/functions/create-takbull-payment/index.ts.
export const DEFAULT_PICKUP_ADDRESS = "דן 13, נהלל";

export const pickupAddressOf = (content) => String(content?.pickupAddress || "").trim() || DEFAULT_PICKUP_ADDRESS;

export const isPickup = (order) => order?.delivery_method === "pickup";

// One-line "where does this order go" text for order screens.
export function deliveryLine(order) {
  if (isPickup(order)) return `איסוף עצמי · ${order.pickup_address || DEFAULT_PICKUP_ADDRESS}`;
  const a = order?.shipping_address || {};
  return [a.address, a.city, a.zip].filter(Boolean).join(", ") || "—";
}
