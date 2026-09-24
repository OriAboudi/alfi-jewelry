import React from "react";
import { css } from "../lib/css.js";
import { saleInfo } from "../lib/pricing.js";
import { PriceTag } from "./PriceTag.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { slugify } from "../lib/routes.js";

// No "tag" field exists on products (see design-handoff/HANDOFF.md's
// "missing data" note) — deterministic, not random, so it doesn't flicker
// between renders. Real products get "חדש" when actually marked featured;
// everything else just rotates through the same 3 decorative labels the
// mockup uses.
const FALLBACK_TAGS = ["חדש", "מומלץ", "אחרונים"];
function tagFor(p, i) {
  const sale = saleInfo(p);
  if (sale.onSale) return `${sale.percent}% הנחה`;
  if (p.featured) return "חדש";
  return FALLBACK_TAGS[i % FALLBACK_TAGS.length];
}

/**
 * RedesignProductCard — the design-handoff card, now used everywhere a
 * product card appears (Home's sliders, Catalog grid, Product page's
 * related products, Favorites).
 */
export function RedesignProductCard({ product: p, index = 0 }) {
  const { openProduct, addToCart, favorites, toggleFavorite } = useStore();
  const outOfStock = Number(p.stock) <= 0;
  const tag = tagFor(p, index);
  const isFav = favorites.includes(p.id);

  const quickAdd = (e) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(p.id, 1, (p.sizes && p.sizes[0]) || "יחיד");
  };

  const onFav = (e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(p.id); };
  const productHref = `/מוצר/${p.id}-${slugify(p.name)}`;
  const openProductClick = (e) => { e.preventDefault(); openProduct(p.id); };
  // Keyboard activation (Enter/Space) on an anchor already navigates via its
  // href natively, but this app is a client-rendered SPA with no real page
  // per href, so it still needs the same preventDefault+openProduct handling
  // as a click.
  const openProductKeys = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProduct(p.id); } };

  return (
    <div className="rd-card glass-strong" style={css("width:100%;box-sizing:border-box;display:flex;flex-direction:column;")}>
      <a
        href={productHref}
        onClick={openProductClick}
        tabIndex={0}
        onKeyDown={openProductKeys}
        aria-label={p.name}
        className="rd-card-img"
        style={css("position:relative;display:block;overflow:hidden;cursor:pointer;")}
      >
        {p.image ? (
          <img
            src={p.image}
            alt={`${p.name} – ${p.category} ${p.material || "כסף 925"}`}
            loading="lazy"
            decoding="async"
            style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;")}
          />
        ) : (
          <div
            className="rd-ph"
            style={css("position:absolute;inset:0;background:#EBE1E6;display:flex;align-items:center;justify-content:center;color:rgba(58,45,61,.42);font-size:13px;")}
          >
            תמונת מוצר
          </div>
        )}
        <span style={css("position:absolute;top:14px;right:14px;font-size:12px;letter-spacing:.12em;background:rgba(246,240,235,.92);padding:6px 12px;")}>{tag}</span>
        {/* Desktop-only per spec. Real favorite toggle, localStorage-backed
            (StoreContext's toggleFavorite/favorites — no accounts/backend
            field, same model as the cart). */}
        <button
          onClick={onFav}
          aria-label={isFav ? "הסרה מהמועדפים" : "הוספה למועדפים"}
          aria-pressed={isFav}
          className="rd-fav-btn"
          style={css(`position:absolute;top:8px;left:8px;width:44px;height:44px;border:0;background:rgba(246,240,235,.92);color:${isFav ? "var(--c-danger)" : "var(--ink)"};cursor:pointer;align-items:center;justify-content:center;`)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>
        </button>
      </a>
      <div style={css("padding:0 8px;display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-top:14px;")}>
        <div style={css("display:flex;flex-direction:column;gap:4px;min-width:0;")}>
          <a href={productHref} onClick={openProductClick} tabIndex={0} onKeyDown={openProductKeys} className="serif rd-card-name" style={css("cursor:pointer;line-height:1.25;")}>{p.name}</a>
          <span className="rd-card-meta" style={css("color:var(--text-muted);")}>{p.category} · {p.material || "כסף 925"}</span>
        </div>
        <span className="rd-card-price"><PriceTag product={p} showPercent={false} /></span>
      </div>
      <button
        onClick={quickAdd}
        disabled={outOfStock}
        className="tap-target rd-add-btn rd-outline"
        style={css(`margin:8px;font:inherit;letter-spacing:.06em;cursor:${outOfStock ? "default" : "pointer"};opacity:${outOfStock ? .55 : 1};`)}
      >
        {outOfStock ? "אזל במלאי" : "הוספה לסל"}
      </button>
    </div>
  );
}
