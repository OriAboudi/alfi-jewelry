// Sale pricing model: `price` is always what the customer actually pays (and
// what create-takbull-payment charges — it reads products.price). A product
// is on sale when `compare_at_price` (the regular price) is set and higher.
export function saleInfo(p) {
  const price = Number(p?.price) || 0;
  const regular = Number(p?.compare_at_price) || 0;
  if (!(regular > price) || price <= 0) return { onSale: false, price, regular: price, percent: 0, saved: 0 };
  return { onSale: true, price, regular, percent: Math.round(((regular - price) / regular) * 100), saved: regular - price };
}

// The deal on products marked in_bundle — the admin picks which one is live
// (content.dealType). Every type groups the eligible units into sets of
// `size`; what a full set saves depends on the type:
//   nForPrice     — "N for ₪X": the set costs `price` (content.bundleSize/bundlePrice)
//   buy2get1      — buy 2, get 1 free: the cheapest of every 3 is free
//   buy1get1      — buy 1, get 1 free: the cheaper of every 2 is free
//   secondPercent — buy 1, the second at `percent`% off (content.dealPercent)
// Mirrored in supabase/functions/create-takbull-payment — keep in sync.
export const DEAL_TYPES = [
  { id: "nForPrice", name: "N תכשיטים במחיר קבוע (למשל 3 ב־₪200)" },
  { id: "buy2get1", name: "קנה 2 קבל 1 מתנה" },
  { id: "buy1get1", name: "קנה 1 קבל 1 מתנה" },
  { id: "secondPercent", name: "קנה 1, השני בהנחה (למשל 60%)" },
];

export function bundleConfig(content) {
  const type = DEAL_TYPES.some((t) => t.id === content?.dealType) ? content.dealType : "nForPrice";
  if (type === "buy2get1") return { type, size: 3, price: 0, percent: 100, label: "קנה 2 קבל 1 מתנה", tag: "2+1 מתנה", benefit: "והזול מביניהם מתנה", pitch: "קונים 2 תכשיטים מהמבצע ומקבלים שלישי מתנה (הזול מביניהם)." };
  if (type === "buy1get1") return { type, size: 2, price: 0, percent: 100, label: "קנה 1 קבל 1 מתנה", tag: "1+1 מתנה", benefit: "והזול מביניהם מתנה", pitch: "קונים תכשיט מהמבצע ומקבלים שני מתנה (הזול מביניהם)." };
  if (type === "secondPercent") {
    const percent = Math.min(100, Math.max(1, Math.round(Number(content?.dealPercent)) || 60));
    return { type, size: 2, price: 0, percent, label: `השני ב־${percent}% הנחה`, tag: `השני ב־${percent}%`, benefit: `והזול מביניהם ב־${percent}% הנחה`, pitch: `קונים 2 תכשיטים מהמבצע והזול מביניהם ב־${percent}% הנחה.` };
  }
  const size = Math.max(2, Math.floor(Number(content?.bundleSize)) || 3);
  const price = Math.max(0, Number(content?.bundlePrice) || 200);
  return { type, size, price, percent: 0, label: `${size} ב־₪${price}`, tag: `${size} ב־₪${price}`, benefit: `וההזמנה נכנסת ל־${size} ב־₪${price}`, pitch: `בוחרים ${size} תכשיטים מהמבצע ומשלמים ₪${price} בלבד.` };
}

// Deal discount for the eligible units (one entry per unit, its price).
// Units are grouped most-expensive-first into sets of `cfg.size`; a set
// never costs more than its own total. Mirrored exactly in
// supabase/functions/create-takbull-payment/index.ts — keep them in sync.
export function bundleDiscount(unitPrices, cfg) {
  const { size } = cfg;
  const units = [...unitPrices].map(Number).sort((a, b) => b - a);
  const sets = Math.floor(units.length / size);
  let discount = 0;
  for (let i = 0; i < sets; i++) {
    const group = units.slice(i * size, (i + 1) * size);
    if (cfg.type === "nForPrice") discount += Math.max(0, group.reduce((a, v) => a + v, 0) - cfg.price);
    else discount += (group[size - 1] * cfg.percent) / 100;
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
// A set is one of two types (admin: content.setUnified, { "<set name>": true }):
// splittable (the default) — every piece is also sold on its own; unified —
// sold only whole, its pieces can't be bought separately.
export function buildSets(products, content) {
  const prices = content?.setPrices || {};
  const unified = content?.setUnified || {};
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
    sets[name] = { name, price, regular, members, ids: members.map((m) => String(m.id)), unified: !!unified[name] };
  }
  return sets;
}

// The live unified set this product is a piece of (null when it is sold on
// its own). `sets` is buildSets()' result.
export function unifiedSetOf(product, sets) {
  const s = (sets || {})[String(product?.set_name || "").trim()];
  return s && s.unified ? s : null;
}

// The products shoppers can buy one by one — everything except the pieces
// of unified sets (those are reached through their set's page).
export function soldAlone(products, content) {
  const sets = buildSets(products, content);
  return (products || []).filter((p) => !unifiedSetOf(p, sets));
}

// Unified sets the cart holds only part of (its pieces must come in equal
// quantities). Lines are { id, qty }. Mirrored in create-takbull-payment,
// which refuses such an order — keep in sync.
export function brokenUnifiedSets(lines, sets) {
  const qty = {};
  for (const l of lines) if (l.id != null) qty[String(l.id)] = (qty[String(l.id)] || 0) + l.qty;
  return Object.values(sets || {}).filter((s) => {
    if (!s.unified) return false;
    const q = s.ids.map((id) => qty[id] || 0);
    return Math.max(...q) !== Math.min(...q);
  });
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
// pre-sale price and bundle marks a product in the deal (bundleConfig).
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
  const bundle = bundleDiscount(units, cfg);
  const itemsTotal = subtotal - setRes.discount - bundle.discount;
  const shipping = deliveryMethod === "pickup" ? 0 : (itemsTotal >= Number(content.freeShipFrom || 500) ? 0 : Number(content.shipFee || 39));
  const discount = couponPercent > 0 ? Math.round(itemsTotal * couponPercent) / 100 : 0;
  const total = Math.max(0, itemsTotal + shipping - discount);
  return {
    subtotal, regularSubtotal, saleSavings, shipping, discount, total,
    bundleDiscount: bundle.discount, bundleSets: bundle.sets, bundleEligible: bundle.eligible, bundleMissing: bundle.missing,
    bundleSize: cfg.size, bundlePrice: cfg.price, deal: cfg,
    setDiscount: setRes.discount, setsApplied: setRes.applied,
    totalSaved: saleSavings + setRes.discount + bundle.discount + discount,
  };
}
