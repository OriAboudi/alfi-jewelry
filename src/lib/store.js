/* =============================================================================
 *  ALFI · Data layer  (src/lib/store.js)
 *  -----------------------------------------------------------------------------
 *  One module = all data access for the storefront and the admin panel.
 *  Every screen talks ONLY to the exported `store` object, so swapping the
 *  backend never changes a single line of UI code.
 *
 *  Backend is chosen automatically:
 *    • Supabase  → when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set
 *                  (real Postgres + Auth + Storage). Run supabase/schema.sql.
 *    • Local     → otherwise. Stores everything in the browser's localStorage.
 *                  Zero setup — perfect for development & demos.
 *
 *  Every method returns a Promise.
 * ========================================================================== */
import { createClient } from "@supabase/supabase-js";
import { compressImage } from "./imageCompress.js";

const SB_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || "product-images";

export const BACKEND = SB_URL && SB_KEY ? "supabase" : (import.meta.env.DEV ? "local" : "none");

/* ---------------------------------------------------------------------------
 *  SEED DATA — used by the local backend on first run.
 * ------------------------------------------------------------------------- */
export const SEED_PRODUCTS = [
  { id: 1, name: "טבעת ורד", category: "טבעות", price: 480, material: "כסף 925", featured: true, image: "", sizes: ["S", "M", "L", "XL"], description: "טבעת כסף 925 בעיצוב עלי כותרת עדינים הנפתחים סביב האצבע. כל פרח מעוצב ומלוטש בקפידה." },
  { id: 2, name: "שרשרת פריחה", category: "שרשראות", price: 620, material: "כסף 925", featured: true, image: "", sizes: ['40 ס"מ', '45 ס"מ', '50 ס"מ'], description: "תליון פרח כסף על שרשרת חוליות עדינה. אורך מתכוונן, מושלם לשכבות." },
  { id: 3, name: "עגילי יסמין", category: "עגילים", price: 340, material: "כסף 925", featured: true, image: "", sizes: ["יחיד"], description: "עגילי תליה קלילים בצורת ניצן יסמין, נוחים לכל אורך היום." },
  { id: 4, name: "צמיד גן", category: "צמידים", price: 560, material: "כסף 925", featured: true, image: "", sizes: ["S", "M", "L"], description: "צמיד חוליות עם פרחי כסף זעירים משובצים לאורכו. נסגר בתפס בטוח." },
  { id: 5, name: "טבעת עלה", category: "טבעות", price: 390, material: "כסף 925", featured: false, image: "", sizes: ["S", "M", "L", "XL"], description: "עלה כסף מעודן הכורך את האצבע בקו אורגני ורך." },
  { id: 6, name: "שרשרת לבנדר", category: "שרשראות", price: 720, material: "כסף + זירקון", featured: false, image: "", sizes: ['40 ס"מ', '45 ס"מ'], description: "מחרוזת ענפי לבנדר מכסף עם שיבוץ זירקון עדין." },
  { id: 7, name: "עגילי כלנית", category: "עגילים", price: 420, material: "כסף 925", featured: false, image: "", sizes: ["יחיד"], description: "עגילי צמוד בצורת כלנית פורחת, עם מרכז מלוטש מבריק." },
  { id: 8, name: "צמיד שזיף", category: "צמידים", price: 680, material: "כסף מוזהב", featured: false, image: "", sizes: ["S", "M", "L"], description: "צמיד נוקשה דק עם פריחת שזיף חרוטה, אלגנטי וקליל." },
];

export const SEED_COLLECTIONS = [
  { id: 1, title: "פריחת אביב", subtitle: "הקולקציה החדשה", image: "", description: "תכשיטים בהשראת פריחת השדה — קלילים, צבעוניים ומלאי חיים." },
  { id: 2, title: "כלות", subtitle: "ליום המיוחד", image: "", description: "עדינות זוהרת לכלה ולמלוות — כסף סטרלינג עם נצנוץ זירקון." },
  { id: 3, title: "מתנות", subtitle: "לרגעים קטנים", image: "", description: "תכשיט שאומר הכל, גם בלי מילים. ארוז ומוכן למסירה." },
];

export const SEED_CONTENT = {
  heroBadge: "❀ קולקציה חדשה",
  heroImage: "",
  heroImages: [],
  heroImagesMobile: [],
  heroCtaLabel: "לצפייה בקולקציה",
  authHeadline: "איכות שרואים, מחיר שאוהבים.",
  authTagline: "תכשיטי כסף סטרלינג 925 באיכות אמיתית ובמחיר נגיש — עדינים, חמים ונצחיים.",
  featuredKicker: "❀ נבחרי הקולקציה",
  featuredTitle: "פורחים השבוע",
  promoStripItems: [
    "✓ כסף סטרלינג 925 אמיתי",
    "✓ איכות אמיתית במחיר הוגן",
    "✓ אריזת מתנה בכל הזמנה",
    "✓ משלוח חינם מעל ₪500",
  ],
  categoryImages: { "טבעות": "", "שרשראות": "", "עגילים": "", "צמידים": "", "אקססוריז": "" },
  banner2Image: "",
  banner2Title: "הקולקציה החדשה שלנו",
  banner2Subtitle: "תכשיטים באיכות אמיתית ובמחיר נגיש — כל פיסה מספרת סיפור אחר.",
  banner2CtaLabel: "לצפייה בקולקציה",
  banner3Image: "",
  banner3Title: "3 תכשיטים ב‑200 ₪",
  banner3Subtitle: "מבצע לזמן מוגבל — משלבים בין טבעות, עגילים, צמידים ושרשראות.",
  banner3CtaLabel: "לצפייה במבצע",
  aboutTitle: "נוצר באהבה, נשמר בלב.",
  aboutText: "כל תכשיט ב‑ALFI מעוצב בקפידה רבה ומציע איכות אמיתית במחיר נגיש. אנחנו מאמינים שהעדינות היא צורת היופי המתוחכמת ביותר.",
  storyImage: "floral-bg.jpg",
  storyKicker: "❀ הסיפור שלנו",
  storyTitle: "שתי אחיות, חלום אחד",
  storyLead: "ALFI התחילה כחלום קטן של שתי אחיות. היום כל תכשיט שלנו עדיין נולד באותה דרך — בסבלנות, בדיוק ובאהבה.",
  storyBody: "אנחנו מאמינות שתכשיט איכותי לא חייב לעלות הון. כל פיסה מעוצבת בקפידה מכסף סטרלינג 925 אמיתי, ללא קיצורי דרך.",
  storyQuote: "העדינות היא צורת היופי המתוחכמת ביותר.",
  storyHeroImage: "",
  value1Title: "עיצוב מוקפד",
  value1Text: "כל תכשיט מעוצב בקפידה ובתשומת לב לפרטים — ייחודי כמו מי שעונד אותו.",
  value2Title: "כסף 925",
  value2Text: "רק כסף סטרלינג טהור, חומרים נקיים ואחריות לכל החיים.",
  value3Title: "מחיר הוגן",
  value3Text: "איכות אמיתית במחיר שאפשר לאהוב, בלי פשרות.",
  processTitle: "מהשרטוט למוצר המוגמר",
  processText: "כל קולקציה מתחילה בסקיצה, עוברת ליצירת אב‑טיפוס, ומגיעה אליכם רק אחרי בדיקה אישית. זה לוקח זמן — וזה בדיוק העניין.",
  freeShipFrom: 500,
  shipFee: 39,
  lowStockThreshold: 5,
  stockFineThreshold: 10,
  signupCouponPercent: 5,
  signupCouponEnabled: true,
  signupPopupDelaySeconds: 10,
};

// Default admin (LOCAL/dev backend only — never used in production, see BACKEND above).
// In Supabase you promote a real user instead. Password is generated per-machine,
// not hardcoded, and printed to the dev console on first run.
const SEED_ADMIN = { name: "מנהל ALFI", email: "admin@alfi.co.il", role: "admin" };

/* ---------- helpers ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const COUPON_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
function generateCouponCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += COUPON_CODE_CHARS[Math.floor(Math.random() * COUPON_CODE_CHARS.length)];
  return "ALFI-" + s;
}
function weakHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return "h" + (h >>> 0).toString(36);
}
function fileExt(file) {
  const m = /\.([a-z0-9]+)$/i.exec(file.name || "");
  return (m && m[1].toLowerCase()) || "png";
}
function toDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* =========================================================================
 *  LOCAL BACKEND  (localStorage)
 * ======================================================================= */
const LS = {
  products: "alfi:products",
  content: "alfi:content",
  users: "alfi:users",
  orders: "alfi:orders",
  collections: "alfi:collections",
  session: "alfi:session",
  coupons: "alfi:coupons",
};
const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn("ALFI: storage write failed", e); } };

function seedLocal() {
  if (!localStorage.getItem(LS.products)) write(LS.products, SEED_PRODUCTS);
  if (!localStorage.getItem(LS.content)) write(LS.content, SEED_CONTENT);
  if (!localStorage.getItem(LS.orders)) write(LS.orders, []);
  if (!localStorage.getItem(LS.collections)) write(LS.collections, SEED_COLLECTIONS);
  if (!localStorage.getItem(LS.coupons)) write(LS.coupons, []);
  if (!read(LS.users, null)) {
    const password = uid();
    write(LS.users, [{ id: uid(), name: SEED_ADMIN.name, email: SEED_ADMIN.email, pass: weakHash(password), role: "admin", created_at: new Date().toISOString() }]);
    console.info(`ALFI (dev, local backend): seeded admin login → ${SEED_ADMIN.email} / ${password}`);
  }
}

const local = {
  auth: {
    async login({ email, password }) {
      const users = read(LS.users, []);
      email = (email || "").trim().toLowerCase();
      const u = users.find((x) => x.email === email);
      if (!u || u.pass !== weakHash(password)) throw new Error("אימייל או סיסמה שגויים");
      const pub = { id: u.id, name: u.name, email: u.email, role: u.role };
      write(LS.session, pub); return pub;
    },
    async logout() { localStorage.removeItem(LS.session); },
    async current() { return read(LS.session, null); },
  },
  products: {
    // No params → full array (storefront usage). With params → paginated
    // {rows, count} for the admin panel — same shape as the Supabase backend.
    async list(params) {
      const all = read(LS.products, []);
      if (!params) return all;
      const { search, category, page = 1, pageSize = 20 } = params;
      let rows = all;
      if (search) rows = rows.filter((p) => (p.name || "").includes(search));
      if (category && category !== "הכל") rows = rows.filter((p) => p.category === category);
      const count = rows.length;
      const start = (page - 1) * pageSize;
      return { rows: rows.slice(start, start + pageSize), count };
    },
    async get(id) { return read(LS.products, []).find((p) => String(p.id) === String(id)) || null; },
    async lowStock(threshold) {
      return read(LS.products, []).filter((p) => Number(p.stock) <= threshold).sort((a, b) => a.stock - b.stock);
    },
    async create(data) {
      const items = read(LS.products, []);
      const id = items.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
      const p = { id, name: "", category: "טבעות", price: 0, material: "כסף 925", featured: false, image: "", images: [], sizes: ["S", "M", "L"], description: "", ...data };
      items.push(p); write(LS.products, items); return p;
    },
    async update(id, patch) {
      const items = read(LS.products, []);
      const i = items.findIndex((p) => String(p.id) === String(id));
      if (i < 0) throw new Error("מוצר לא נמצא");
      items[i] = { ...items[i], ...patch, id: items[i].id }; write(LS.products, items); return items[i];
    },
    async remove(id) { write(LS.products, read(LS.products, []).filter((p) => String(p.id) !== String(id))); },
  },
  collections: {
    async list() { return read(LS.collections, []); },
    async get(id) { return read(LS.collections, []).find((c) => String(c.id) === String(id)) || null; },
    async create(data) {
      const items = read(LS.collections, []);
      const id = items.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1;
      const c = { id, title: "", subtitle: "", image: "", description: "", ...data };
      items.push(c); write(LS.collections, items); return c;
    },
    async update(id, patch) {
      const items = read(LS.collections, []);
      const i = items.findIndex((c) => String(c.id) === String(id));
      if (i < 0) throw new Error("קולקציה לא נמצאה");
      items[i] = { ...items[i], ...patch, id: items[i].id }; write(LS.collections, items); return items[i];
    },
    async remove(id) { write(LS.collections, read(LS.collections, []).filter((c) => String(c.id) !== String(id))); },
  },
  content: {
    async get() { return { ...SEED_CONTENT, ...read(LS.content, {}) }; },
    async update(patch) { const c = { ...SEED_CONTENT, ...read(LS.content, {}), ...patch }; write(LS.content, c); return c; },
  },
  orders: {
    async create(order) {
      const orders = read(LS.orders, []);
      const o = { id: uid(), number: "#ALF‑" + (2400 + orders.length + 19), status: "התקבלה", created_at: new Date().toISOString(), ...order };
      orders.unshift(o); write(LS.orders, orders); return o;
    },
    // No params → full array (admin panel loaded everything historically).
    // With params → paginated {rows, count}, matching the Supabase backend.
    async listAll(params) {
      const all = read(LS.orders, []);
      if (!params) return all;
      const { search, status, paymentStatus, page = 1, pageSize = 20 } = params;
      let rows = all;
      if (search) rows = rows.filter((o) => (o.number || "").includes(search));
      if (status) rows = rows.filter((o) => o.status === status);
      if (paymentStatus) rows = rows.filter((o) => o.payment_status === paymentStatus);
      const count = rows.length;
      const start = (page - 1) * pageSize;
      return { rows: rows.slice(start, start + pageSize), count };
    },
    async update(id, patch) {
      const orders = read(LS.orders, []);
      const i = orders.findIndex((o) => String(o.id) === String(id));
      if (i < 0) throw new Error("הזמנה לא נמצאה");
      orders[i] = { ...orders[i], ...patch }; write(LS.orders, orders); return orders[i];
    },
    // Dev-only stand-in for the Supabase update-order-status Edge Function —
    // no email is sent locally, just the status change itself.
    async updateStatus(id, status) { return local.orders.update(id, { status }); },
    async getPublic(id) {
      const o = read(LS.orders, []).find((x) => String(x.id) === String(id));
      if (!o) throw new Error("הזמנה לא נמצאה");
      return { ...o, history: [] };
    },
    // Dev-only stand-in — status history isn't tracked in the local backend.
    async history() { return []; },
  },
  users: {
    async list() { return read(LS.users, []).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at })); },
  },
  storage: {
    // No cloud in local mode — embed the image as a data-URL so it persists.
    async uploadImage(file) { return toDataURL(file); },
  },
  stats: {
    // Best-effort local equivalent of the order_stats/best_selling_products
    // Postgres functions, for dev-mode parity — computed in JS over the
    // in-memory order list rather than in the database.
    async summary() {
      const orders = read(LS.orders, []).filter((o) => !o.is_test);
      const paid = orders.filter((o) => o.payment_status === "paid");
      const statusCounts = {};
      for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      return {
        revenue: paid.reduce((a, o) => a + (Number(o.total) || 0), 0),
        order_count: orders.length,
        paid_order_count: paid.length,
        status_counts: statusCounts,
      };
    },
    async bestSellers({ limit = 5 } = {}) {
      const orders = read(LS.orders, []).filter((o) => !o.is_test && o.payment_status === "paid");
      const byId = new Map();
      for (const o of orders) {
        for (const it of o.items || []) {
          const cur = byId.get(it.id) || { product_id: it.id, name: it.name, qty_sold: 0, revenue: 0 };
          cur.qty_sold += Number(it.qty) || 0;
          cur.revenue += (Number(it.price) || 0) * (Number(it.qty) || 0);
          byId.set(it.id, cur);
        }
      }
      return [...byId.values()].sort((a, b) => b.qty_sold - a.qty_sold).slice(0, limit);
    },
  },
  checkout: {
    // No payment gateway in local mode — place the order directly, no redirect.
    async createSession({ items, shipping_address, paymentMethod = "takbull", couponCode }) {
      const products = read(LS.products, []);
      const content = { ...SEED_CONTENT, ...read(LS.content, {}) };
      const verified = items.map((it) => {
        const p = products.find((x) => String(x.id) === String(it.id));
        if (!p) throw new Error("מוצר לא נמצא: " + it.id);
        const qty = Math.max(1, Math.min(50, Number(it.qty) || 1));
        return { id: p.id, name: p.name, price: Number(p.price) || 0, qty, size: it.size || "" };
      });
      const subtotal = verified.reduce((a, it) => a + it.price * it.qty, 0);
      const shipping = subtotal >= Number(content.freeShipFrom || 500) ? 0 : Number(content.shipFee || 39);

      let discount = 0;
      let appliedCouponCode = null;
      if (couponCode) {
        const coupons = read(LS.coupons, []);
        const coupon = coupons.find((c) => c.code === String(couponCode).trim().toUpperCase());
        if (coupon && coupon.status === "active") {
          discount = Math.round(subtotal * (Number(coupon.percent) || 0)) / 100;
          appliedCouponCode = coupon.code;
        }
      }
      const total = Math.max(0, subtotal + shipping - discount);

      const order = await local.orders.create({
        items: verified, subtotal, shipping, discount, coupon_code: appliedCouponCode, total,
        shipping_address: { city: "תל אביב", ...shipping_address },
        payment_status: "paid", payment_method: paymentMethod, user_id: null,
      });

      // Local orders are "paid" immediately (no separate IPN step), so redeem
      // the coupon right here instead of waiting for a webhook.
      if (appliedCouponCode) {
        const coupons = read(LS.coupons, []);
        const i = coupons.findIndex((c) => c.code === appliedCouponCode);
        if (i >= 0) { coupons[i] = { ...coupons[i], status: "redeemed", redeemed_at: new Date().toISOString(), order_id: order.id }; write(LS.coupons, coupons); }
      }

      return { url: null, order };
    },
  },
  signup: {
    // Dev-only stand-in for the signup-coupon Edge Function — no email is
    // sent locally (local mode never sends any email), the code is just
    // generated and stored so the pop-up's on-screen success state works.
    async subscribe({ name, email, phone }) {
      const cleanEmail = String(email || "").trim().toLowerCase();
      const content = { ...SEED_CONTENT, ...read(LS.content, {}) };
      if (content.signupCouponEnabled === false) throw new Error("ההרשמה אינה זמינה כרגע");
      const percent = Number(content.signupCouponPercent || 5);
      const coupons = read(LS.coupons, []);
      const existing = coupons.find((c) => c.email === cleanEmail && c.status === "active");
      if (existing) return { code: existing.code, percent: Number(existing.percent) };
      const code = generateCouponCode();
      coupons.unshift({ id: uid(), code, name, email: cleanEmail, phone, percent, status: "active", created_at: new Date().toISOString() });
      write(LS.coupons, coupons);
      return { code, percent };
    },
    // Dev-only stand-in for the login-by-phone Edge Function.
    async loginByPhone(phone) {
      const phoneDigits = String(phone || "").replace(/[^\d]/g, "");
      const match = read(LS.coupons, [])
        .filter((c) => c.phone && String(c.phone).replace(/[^\d]/g, "") === phoneDigits)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      if (!match) return { found: false };
      return {
        found: true,
        name: match.name,
        email: match.email,
        coupon: match.status === "active" ? { code: match.code, percent: Number(match.percent) } : null,
      };
    },
  },
  coupon: {
    async validate(code) {
      const clean = String(code || "").trim().toUpperCase();
      const coupon = read(LS.coupons, []).find((c) => c.code === clean);
      if (!coupon) throw new Error("קוד קופון לא נמצא");
      if (coupon.status === "redeemed") throw new Error("קוד הקופון כבר נוצל");
      if (coupon.status === "void") throw new Error("קוד הקופון בוטל");
      return { valid: true, percent: Number(coupon.percent) || 0 };
    },
  },
  adminCoupons: {
    async list({ page = 1, pageSize = 20 } = {}) {
      const all = read(LS.coupons, []);
      const count = all.length;
      const start = (page - 1) * pageSize;
      return { rows: all.slice(start, start + pageSize), count };
    },
    async void(id) {
      const coupons = read(LS.coupons, []);
      const i = coupons.findIndex((c) => c.id === id);
      if (i < 0) throw new Error("קופון לא נמצא");
      coupons[i] = { ...coupons[i], status: "void" };
      write(LS.coupons, coupons);
      return coupons[i];
    },
  },
};

/* =========================================================================
 *  SUPABASE BACKEND  (@supabase/supabase-js — Auth + Postgres + Storage)
 * ======================================================================= */
function makeSupabase() {
  const sb = createClient(SB_URL, SB_KEY);

  async function profileFor(user) {
    if (!user) return null;
    let role = "customer";
    let name = (user.user_metadata && user.user_metadata.name) || user.email;
    try {
      const { data } = await sb.from("profiles").select("name, role").eq("id", user.id).single();
      if (data) { role = data.role || role; name = data.name || name; }
    } catch { /* profile row may not exist yet */ }
    return { id: user.id, name, email: user.email, role };
  }

  return {
    auth: {
      async login({ email, password }) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message || "אימייל או סיסמה שגויים");
        return profileFor(data.user);
      },
      async logout() { await sb.auth.signOut(); },
      async current() {
        const { data } = await sb.auth.getUser();
        return profileFor(data?.user);
      },
    },
    products: {
      // No params → full array (storefront usage, unchanged). With params →
      // paginated {rows, count} for the admin panel, computed server-side.
      async list(params) {
        if (!params) { const { data, error } = await sb.from("products").select("*").order("id"); if (error) throw error; return data || []; }
        const { search, category, page = 1, pageSize = 20 } = params;
        let q = sb.from("products").select("*", { count: "exact" }).order("id");
        if (search) q = q.ilike("name", `%${search}%`);
        if (category && category !== "הכל") q = q.eq("category", category);
        const from = (page - 1) * pageSize;
        const { data, error, count } = await q.range(from, from + pageSize - 1);
        if (error) throw error;
        return { rows: data || [], count: count || 0 };
      },
      async get(id) { const { data, error } = await sb.from("products").select("*").eq("id", id).single(); if (error) throw error; return data; },
      async lowStock(threshold) {
        const { data, error } = await sb.from("products").select("*").lte("stock", threshold).order("stock");
        if (error) throw error;
        return data || [];
      },
      async create(d) { const { data, error } = await sb.from("products").insert(d).select().single(); if (error) throw error; return data; },
      async update(id, p) { const { data, error } = await sb.from("products").update(p).eq("id", id).select().single(); if (error) throw error; return data; },
      async remove(id) { const { error } = await sb.from("products").delete().eq("id", id); if (error) throw error; },
    },
    collections: {
      async list() { const { data, error } = await sb.from("collections").select("*").order("id"); if (error) throw error; return data || []; },
      async get(id) { const { data, error } = await sb.from("collections").select("*").eq("id", id).single(); if (error) throw error; return data; },
      async create(d) { const { data, error } = await sb.from("collections").insert(d).select().single(); if (error) throw error; return data; },
      async update(id, p) { const { data, error } = await sb.from("collections").update(p).eq("id", id).select().single(); if (error) throw error; return data; },
      async remove(id) { const { error } = await sb.from("collections").delete().eq("id", id); if (error) throw error; },
    },
    content: {
      async get() {
        const { data } = await sb.from("content").select("data").eq("id", 1).single();
        return { ...SEED_CONTENT, ...(data?.data || {}) };
      },
      async update(patch) {
        const { data: cur } = await sb.from("content").select("data").eq("id", 1).single();
        const next = { ...SEED_CONTENT, ...(cur?.data || {}), ...patch };
        const { error } = await sb.from("content").upsert({ id: 1, data: next });
        if (error) throw error;
        return next;
      },
    },
    orders: {
      // No params → full array (unchanged). With params → paginated
      // {rows, count} for the admin Orders tab.
      async listAll(params) {
        if (!params) { const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false }); if (error) throw error; return data || []; }
        const { search, status, paymentStatus, page = 1, pageSize = 20 } = params;
        let q = sb.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
        if (search) q = q.ilike("number", `%${search}%`);
        if (status) q = q.eq("status", status);
        if (paymentStatus) q = q.eq("payment_status", paymentStatus);
        const from = (page - 1) * pageSize;
        const { data, error, count } = await q.range(from, from + pageSize - 1);
        if (error) throw error;
        return { rows: data || [], count: count || 0 };
      },
      // Only used by admin flows that don't need a notification (none left —
      // status changes go through updateStatus below). Kept for completeness.
      async update(id, p) { const { data, error } = await sb.from("orders").update(p).eq("id", id).select().single(); if (error) throw error; return data; },
      // Status changes go through the update-order-status Edge Function
      // (never a direct table write) so a notification email always fires.
      async updateStatus(id, status) {
        const { data, error } = await sb.functions.invoke("update-order-status", { body: { id, status } });
        if (error) throw new Error(error.message || "עדכון הסטטוס נכשל");
        if (data?.error) throw new Error(data.error);
        return data.order;
      },
      async getPublic(id) {
        const { data, error } = await sb.functions.invoke("get-order", { body: { id } });
        if (error) throw new Error(error.message || "טעינת ההזמנה נכשלה");
        if (data?.error) throw new Error(data.error);
        return data.order;
      },
      // Admin-only — relies on the "order_status_history admin read" RLS
      // policy, so this simply returns [] for a non-admin session.
      async history(id) {
        const { data, error } = await sb.from("order_status_history").select("status, changed_at, notified").eq("order_id", id).order("changed_at", { ascending: true });
        if (error) throw error;
        return data || [];
      },
    },
    users: {
      async list() { const { data, error } = await sb.from("profiles").select("*"); if (error) throw error; return data || []; },
    },
    stats: {
      async summary({ from, to } = {}) {
        const { data, error } = await sb.rpc("order_stats", { p_from: from || null, p_to: to || null });
        if (error) throw error;
        return (data && data[0]) || { revenue: 0, order_count: 0, paid_order_count: 0, status_counts: {} };
      },
      async bestSellers({ from, to, limit = 5 } = {}) {
        const { data, error } = await sb.rpc("best_selling_products", { p_from: from || null, p_to: to || null, p_limit: limit });
        if (error) throw error;
        return data || [];
      },
    },
    storage: {
      async uploadImage(file) {
        // Every upload gets a unique, never-reused path (timestamp + random
        // suffix, upsert:false) — content-addressed in effect, so a full
        // year of caching is always safe: a changed image is a new path,
        // never a mutated one.
        const uploadFile = await compressImage(file);
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt(uploadFile)}`;
        const { error } = await sb.storage.from(BUCKET).upload(path, uploadFile, { cacheControl: "31536000", upsert: false });
        if (error) throw new Error("העלאת התמונה נכשלה: " + error.message);
        const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
        return data.publicUrl;
      },
    },
    checkout: {
      async createSession({ items, shipping_address, testAmount, couponCode }) {
        const { data, error } = await sb.functions.invoke("create-takbull-payment", {
          body: { items, shipping_address, testAmount, couponCode },
        });
        if (error) throw new Error(error.message || "יצירת ההזמנה נכשלה");
        if (data?.error) {
          if (data.debug) {
            // Open DevTools console to copy this for Takbull support:
            // the exact request sent and the exact response received.
            console.error("Takbull request:", data.debug.request);
            console.error("Takbull response:", data.debug.response);
          }
          throw new Error(data.error);
        }
        return data; // { url, order }
      },
    },
    signup: {
      async subscribe({ name, email, phone }) {
        const { data, error } = await sb.functions.invoke("signup-coupon", { body: { name, email, phone } });
        if (error) throw new Error(error.message || "ההרשמה נכשלה");
        if (data?.error) throw new Error(data.error);
        return data; // { code, percent }
      },
      async loginByPhone(phone) {
        const { data, error } = await sb.functions.invoke("login-by-phone", { body: { phone } });
        if (error) throw new Error(error.message || "ההתחברות נכשלה");
        if (data?.error) throw new Error(data.error);
        return data; // { found, name, email, coupon }
      },
    },
    coupon: {
      async validate(code) {
        const { data, error } = await sb.functions.invoke("validate-coupon", { body: { code } });
        if (error) throw new Error(error.message || "בדיקת הקופון נכשלה");
        if (data?.error) throw new Error(data.error);
        return data; // { valid, percent }
      },
    },
    adminCoupons: {
      async list({ page = 1, pageSize = 20 } = {}) {
        const { data, error } = await sb.functions.invoke("admin-coupons", { body: { action: "list", page, pageSize } });
        if (error) throw new Error(error.message || "טעינת הקופונים נכשלה");
        if (data?.error) throw new Error(data.error);
        return data; // { rows, count }
      },
      async void(id) {
        const { data, error } = await sb.functions.invoke("admin-coupons", { body: { action: "void", id } });
        if (error) throw new Error(error.message || "ביטול הקופון נכשל");
        if (data?.error) throw new Error(data.error);
        return data.coupon;
      },
    },
  };
}

/* =========================================================================
 *  Boot
 * ======================================================================= */
let store;
if (BACKEND === "supabase") {
  store = makeSupabase();
} else if (BACKEND === "local") {
  seedLocal();
  store = local;
} else {
  throw new Error(
    "ALFI: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing in this build. " +
    "The local (localStorage) backend is dev-only and is disabled in production builds " +
    "to avoid shipping a demo admin login. Set the Supabase env vars in Netlify's " +
    "Site settings → Environment variables and redeploy."
  );
}

export { store };
export default store;
