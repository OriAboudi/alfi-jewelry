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

// Screens with a real, indexable URL. Everything else (cart, checkout,
// confirm, payment-failed, status, my-orders, favorites, loading, admin,
// admin-login) intentionally has no entry here — pathFor returns null for
// them, which callers treat as "leave the current URL alone."
export function pathFor(screen, ctx = {}) {
  const { catFilter, pid, products } = ctx;
  switch (screen) {
    case "home":
      return "/";
    case "catalog":
      if (!catFilter || catFilter === "הכל") return "/קטלוג";
      if (CAT_NAMES.includes(catFilter)) return `/${catFilter}`;
      return "/קטלוג";
    case "product": {
      const p = (products || []).find((x) => String(x.id) === String(pid));
      return p ? `/מוצר/${pid}-${slugify(p.name)}` : `/מוצר/${pid}`;
    }
    case "collections":
      return "/קולקציות";
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
    default:
      return null;
  }
}

const STATIC_ROUTES = {
  "/": { screen: "home" },
  "/קטלוג": { screen: "catalog", catFilter: "הכל" },
  "/קולקציות": { screen: "collections" },
  "/הסיפור-שלנו": { screen: "story" },
  "/צור-קשר": { screen: "contact" },
  "/משלוחים-והחזרות": { screen: "shipping" },
  "/מדיניות-פרטיות": { screen: "privacy" },
  "/תנאי-שימוש": { screen: "terms" },
};

// pathname only — never location.search. Keeping this pure and search-blind
// is what guarantees it can never interfere with the Takbull payment-redirect
// query-param flow in StoreContext.jsx, which lives entirely in `search`.
export function parsePath(pathname) {
  const path = decodeURIComponent(pathname || "/");
  if (STATIC_ROUTES[path]) return STATIC_ROUTES[path];

  const productMatch = /^\/מוצר\/(\d+)/.exec(path);
  if (productMatch) return { screen: "product", pid: productMatch[1] };

  const segment = path.replace(/^\/+|\/+$/g, "");
  if (CAT_NAMES.includes(segment)) return { screen: "catalog", catFilter: segment };

  return null;
}
