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

const SB_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || "product-images";

export const BACKEND = SB_URL && SB_KEY ? "supabase" : (import.meta.env.DEV ? "local" : "none");

/* ---------------------------------------------------------------------------
 *  SEED DATA — used by the local backend on first run.
 * ------------------------------------------------------------------------- */
export const SEED_PRODUCTS = [
  { id: 1, name: "טבעת ורד", category: "טבעות", price: 480, material: "כסף 925", featured: true, image: "", sizes: ["S", "M", "L", "XL"], description: "טבעת כסף 925 בעיצוב עלי כותרת עדינים הנפתחים סביב האצבע. כל פרח מעוצב ומלוטש בעבודת יד." },
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
  heroCtaLabel: "לצפייה בקולקציה",
  authHeadline: "כל פרח מספר סיפור.",
  authTagline: "תכשיטי כסף סטרלינג 925 בעבודת יד, בהשראת עולם הצומח — עדינים, חמים ונצחיים.",
  featuredKicker: "❀ נבחרי הקולקציה",
  featuredTitle: "פורחים השבוע",
  aboutTitle: "נוצר ביד, נשמר בלב.",
  aboutText: "כל תכשיט ב‑ALFI נולד בהשראת הטבע ועובר דרך ידיו של אומן. אנחנו מאמינים שהעדינות היא צורת היופי המתוחכמת ביותר.",
  storyImage: "floral-bg.jpg",
  storyKicker: "❀ הסיפור שלנו",
  storyTitle: "נולדנו מתוך אהבה לטבע",
  storyLead: "ALFI התחילה בשולחן עבודה קטן, צבת, ופרח אחד שסירב להישכח. היום כל תכשיט שלנו עדיין נולד באותה דרך — ביד, בסבלנות, באהבה.",
  storyBody: "אנחנו מלקטים השראה משדות, מגינות ומרגעים שקטים, ומתרגמים אותם לכסף סטרלינג 925. כל פיסה מעוצבת, נוצקת ומלוטשת בעבודת יד באולפן שלנו — ללא קיצורי דרך וללא ייצור המוני.",
  storyQuote: "העדינות היא צורת היופי המתוחכמת ביותר.",
  storyHeroImage: "",
  value1Title: "עבודת יד",
  value1Text: "כל תכשיט נוצר ומלוטש ביד באולפן שלנו — ייחודי כמו מי שעונד אותו.",
  value2Title: "כסף 925",
  value2Text: "רק כסף סטרלינג טהור, חומרים נקיים ואחריות לכל החיים.",
  value3Title: "בהשראת הטבע",
  value3Text: "פרחים, עלים וענפים — קו עדין שמספר סיפור על כל אצבע.",
  processTitle: "מהשרטוט אל היד",
  processText: "כל קולקציה מתחילה בסקיצה, עוברת ליצירת אב‑טיפוס, ומגיעה אליכם רק אחרי בדיקה אישית. זה לוקח זמן — וזה בדיוק העניין.",
  freeShipFrom: 500,
  shipFee: 39,
};

// Default admin (LOCAL/dev backend only — never used in production, see BACKEND above).
// In Supabase you promote a real user instead. Password is generated per-machine,
// not hardcoded, and printed to the dev console on first run.
const SEED_ADMIN = { name: "מנהל ALFI", email: "admin@alfi.co.il", role: "admin" };

/* ---------- helpers ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
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
};
const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn("ALFI: storage write failed", e); } };

function seedLocal() {
  if (!localStorage.getItem(LS.products)) write(LS.products, SEED_PRODUCTS);
  if (!localStorage.getItem(LS.content)) write(LS.content, SEED_CONTENT);
  if (!localStorage.getItem(LS.orders)) write(LS.orders, []);
  if (!localStorage.getItem(LS.collections)) write(LS.collections, SEED_COLLECTIONS);
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
    async list() { return read(LS.products, []); },
    async get(id) { return read(LS.products, []).find((p) => String(p.id) === String(id)) || null; },
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
    async listAll() { return read(LS.orders, []); },
    async update(id, patch) {
      const orders = read(LS.orders, []);
      const i = orders.findIndex((o) => String(o.id) === String(id));
      if (i < 0) throw new Error("הזמנה לא נמצאה");
      orders[i] = { ...orders[i], ...patch }; write(LS.orders, orders); return orders[i];
    },
    async getPublic(id) {
      const o = read(LS.orders, []).find((x) => String(x.id) === String(id));
      if (!o) throw new Error("הזמנה לא נמצאה");
      return o;
    },
  },
  users: {
    async list() { return read(LS.users, []).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at })); },
  },
  storage: {
    // No cloud in local mode — embed the image as a data-URL so it persists.
    async uploadImage(file) { return toDataURL(file); },
  },
  checkout: {
    // No payment gateway in local mode — place the order directly, no redirect.
    async createSession({ items, shipping_address, paymentMethod = "takbull" }) {
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
      const order = await local.orders.create({
        items: verified, subtotal, shipping, total: subtotal + shipping,
        shipping_address: { city: "תל אביב", ...shipping_address },
        payment_status: "paid", payment_method: paymentMethod, user_id: null,
      });
      return { url: null, order };
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
      async list() { const { data, error } = await sb.from("products").select("*").order("id"); if (error) throw error; return data || []; },
      async get(id) { const { data, error } = await sb.from("products").select("*").eq("id", id).single(); if (error) throw error; return data; },
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
      async listAll() { const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false }); if (error) throw error; return data || []; },
      async update(id, p) { const { data, error } = await sb.from("orders").update(p).eq("id", id).select().single(); if (error) throw error; return data; },
      async getPublic(id) {
        const { data, error } = await sb.functions.invoke("get-order", { body: { id } });
        if (error) throw new Error(error.message || "טעינת ההזמנה נכשלה");
        if (data?.error) throw new Error(data.error);
        return data.order;
      },
    },
    users: {
      async list() { const { data, error } = await sb.from("profiles").select("*"); if (error) throw error; return data || []; },
    },
    storage: {
      async uploadImage(file) {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt(file)}`;
        const { error } = await sb.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) throw new Error("העלאת התמונה נכשלה: " + error.message);
        const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
        return data.publicUrl;
      },
    },
    checkout: {
      async createSession({ items, shipping_address, testAmount }) {
        const { data, error } = await sb.functions.invoke("create-takbull-payment", {
          body: { items, shipping_address, testAmount },
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
