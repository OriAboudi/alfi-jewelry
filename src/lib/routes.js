// Real URL routing for what was previously a pure in-memory "screen" state
// machine (see StoreContext.jsx). Two pure functions only — no history/DOM
// access here, so this stays trivially usable from the sitemap build script
// (plain Node, no browser globals) as well as from the app itself.
import { CAT_NAMES } from "./categories.js";

// Decorative only — the product path's slug suffix is never read back on
// parse (see parsePath), so this never needs to be reversible/unique.
export function slugify(str) {
  return String(str || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/["'/?#%\\]/g, "");
}

// Screens with a real URL. Cart, favorites, account ("my-orders") and order
// status have one too (noindex, not in the sitemap) so Back/Forward move
// between them naturally. Checkout, confirm, payment-failed, loading, admin
// and admin-login intentionally have none — pathFor returns null for them,
// which callers treat as "leave the current URL alone" (so it can never
// interfere with the Takbull payment-redirect flow).
// Catalog filter value for "only the products in the bundle deal".
export const DEAL_FILTER = "מבצע";

export function pathFor(screen, ctx = {}) {
  const { catFilter, pid, products, orderId } = ctx;
  switch (screen) {
    case "home":
      return "/";
    case "catalog":
      if (!catFilter || catFilter === "הכל") return "/קטלוג";
      if (catFilter === DEAL_FILTER) return "/מבצע";
      if (CAT_NAMES.includes(catFilter)) return `/${catFilter}`;
      return "/קטלוג";
    case "product": {
      const p = (products || []).find((x) => String(x.id) === String(pid));
      return p ? `/מוצר/${pid}-${slugify(p.name)}` : `/מוצר/${pid}`;
    }
    case "collections":
      return "/קולקציות";
    case "sets":
      return "/סטים";
    // A set's own page. The set's name rides in pid (the screen's item id).
    case "set":
      return pid ? `/סט/${slugify(pid)}` : "/סטים";
    case "story":
      return "/הסיפור-שלנו";
    case "contact":
      return "/צור-קשר";
    case "shipping":
      return "/משלוחים-והחזרות";
    case "privacy":
      return "/מדיניות-פרטיות";
    case "terms":
      return "/תנאי-שימוש";
    case "accessibility":
      return "/הצהרת-נגישות";
    case "cart":
      return "/עגלה";
    case "favorites":
      return "/מועדפים";
    case "my-orders":
      return "/החשבון-שלי";
    case "status":
      return orderId ? `/הזמנה/${orderId}` : null;
    default:
      return null;
  }
}

// Pages the admin can hide from the storefront (admin → "עמודים באתר").
// Stored as content.hiddenPages (array of keys). A hidden page loses every
// link to it and its URL falls back to home. Not offered: home/catalog/
// product/cart/checkout (the buying flow), favorites, and the legal pages
// (privacy, terms, accessibility statement) the site must always show.
// "sets" is only the sets list — a set's own page stays reachable, since a
// unified set's pieces open it to be bought.
export const HIDEABLE_PAGES = [
  { key: "collections", label: "קולקציות", path: "/קולקציות" },
  { key: "sets", label: "סטים", path: "/סטים" },
  { key: "deal", label: "מבצעים", path: "/מבצע" },
  { key: "story", label: "הסיפור שלנו", path: "/הסיפור-שלנו" },
  { key: "contact", label: "צור קשר", path: "/צור-קשר" },
  { key: "shipping", label: "משלוחים והחזרות", path: "/משלוחים-והחזרות" },
];

// The hideable page a screen belongs to, or null if it can't be hidden.
export function pageKeyFor(screen, catFilter) {
  if (screen === "catalog") return catFilter === DEAL_FILTER ? "deal" : null;
  return HIDEABLE_PAGES.some((p) => p.key === screen) ? screen : null;
}

export function pageHidden(content, key) {
  return !!key && (content?.hiddenPages || []).includes(key);
}

const STATIC_ROUTES = {
  "/": { screen: "home" },
  "/קטלוג": { screen: "catalog", catFilter: "הכל" },
  "/מבצע": { screen: "catalog", catFilter: "מבצע" },
  "/קולקציות": { screen: "collections" },
  "/סטים": { screen: "sets" },
  "/הסיפור-שלנו": { screen: "story" },
  "/צור-קשר": { screen: "contact" },
  "/משלוחים-והחזרות": { screen: "shipping" },
  "/מדיניות-פרטיות": { screen: "privacy" },
  "/תנאי-שימוש": { screen: "terms" },
  "/הצהרת-נגישות": { screen: "accessibility" },
  "/עגלה": { screen: "cart" },
  "/מועדפים": { screen: "favorites" },
  "/החשבון-שלי": { screen: "my-orders" },
};

// pathname only — never location.search. Keeping this pure and search-blind
// is what guarantees it can never interfere with the Takbull payment-redirect
// query-param flow in StoreContext.jsx, which lives entirely in `search`.
export function parsePath(pathname) {
  const path = decodeURIComponent(pathname || "/");
  if (STATIC_ROUTES[path]) return STATIC_ROUTES[path];

  const productMatch = /^\/מוצר\/(\d+)/.exec(path);
  if (productMatch) return { screen: "product", pid: productMatch[1] };

  const setMatch = /^\/סט\/(.+?)\/?$/.exec(path);
  if (setMatch) return { screen: "set", pid: setMatch[1] };

  const orderMatch = /^\/הזמנה\/([0-9a-f-]{36})$/i.exec(path);
  if (orderMatch) return { screen: "status", orderId: orderMatch[1] };

  const segment = path.replace(/^\/+|\/+$/g, "");
  if (CAT_NAMES.includes(segment)) return { screen: "catalog", catFilter: segment };

  return null;
}
