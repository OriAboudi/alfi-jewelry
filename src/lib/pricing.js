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

// How a set is named to shoppers: "סט <name>" — unless the admin already
// wrote the word (set_name "סט גלייס" stays "סט גלייס", not "סט סט גלייס").
export function setTitle(name) {
  const n = String(name || "").trim();
  return /^סט(\s|$)/.test(n) ? n : `סט ${n}`;
}

// A set is shown in the sets slider / sets page only while every piece is
// in stock (its own page still opens, marked sold out).
export function setInStock(set) {
  return set.members.every((m) => Number(m.stock) > 0);
}

// Product sets: products sharing a set_name form a set, priced by the admin
// in content.setPrices. Only sets with 2+ members and a price are live.
export function buildSets(products, content) {
  const prices = content?.setPrices || {};
  const byName = {};
  for (const p of products || []) {
    const name = String(p.set_name || "").trim();
    if (name) (byName[name] ||= []).push(p);
  }
  const sets = {};
  for (const [name, members] of Object.entries(byName)) {
    const price = Number(prices[name]) || 0;
    if (members.length < 2 || price <= 0) continue;
    const regular = members.reduce((a, m) => a + (Number(m.price) || 0), 0);
    sets[name] = { name, price, regular, members, ids: members.map((m) => String(m.id)) };
  }
  return sets;
}

// Set deal: each complete set in the cart (one of every member) costs the
// set price instead of its members' prices (never more). Returns the units
// it used per product id, so those units don't also count toward the
// bundle deal. Mirrored exactly in create-takbull-payment — keep in sync.
export function setDeal(lines, sets) {
  const qty = {};
  for (const l of lines) if (l.id != null) qty[String(l.id)] = (qty[String(l.id)] || 0) + l.qty;
  const used = {};
  const applied = [];
  let discount = 0;
  for (const s of Object.values(sets || {})) {
    const count = Math.min(...s.ids.map((id) => qty[id] || 0));
    if (!(count >= 1)) continue;
    const each = Math.max(0, s.regular - s.price);
    if (!(each > 0)) continue;
    for (const id of s.ids) used[id] = (used[id] || 0) + count;
    discount += each * count;
    applied.push({ name: s.name, count, discount: each * count });
  }
  return { discount: Math.round(discount * 100) / 100, used, applied };
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
export function computeTotals(lines, content, couponPercent = 0, deliveryMethod = "delivery", sets = {}) {
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const regularSubtotal = lines.reduce((a, l) => a + Math.max(l.regular || 0, l.price) * l.qty, 0);
  const saleSavings = regularSubtotal - subtotal;
  // 1) complete sets, 2) the bundle deal on the remaining units.
  const setRes = setDeal(lines, sets);
  const left = { ...setRes.used };
  const cfg = bundleConfig(content);
  const units = lines.flatMap((l) => {
    if (!l.bundle) return [];
    const id = String(l.id);
    const skip = Math.min(l.qty, left[id] || 0);
    if (skip) left[id] -= skip;
    return Array(Math.max(0, l.qty - skip)).fill(l.price);
  });
  const bundle = bundleDiscount(units, cfg.size, cfg.price);
  const itemsTotal = subtotal - setRes.discount - bundle.discount;
  const shipping = deliveryMethod === "pickup" ? 0 : (itemsTotal >= Number(content.freeShipFrom || 500) ? 0 : Number(content.shipFee || 39));
  const discount = couponPercent > 0 ? Math.round(itemsTotal * couponPercent) / 100 : 0;
  const total = Math.max(0, itemsTotal + shipping - discount);
  return {
    subtotal, regularSubtotal, saleSavings, shipping, discount, total,
    bundleDiscount: bundle.discount, bundleSets: bundle.sets, bundleEligible: bundle.eligible, bundleMissing: bundle.missing,
    bundleSize: cfg.size, bundlePrice: cfg.price,
    setDiscount: setRes.discount, setsApplied: setRes.applied,
    totalSaved: saleSavings + setRes.discount + bundle.discount + discount,
  };
}
