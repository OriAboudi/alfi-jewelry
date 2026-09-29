import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { RedesignProductCard } from "../components/RedesignProductCard.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { CAT_NAMES as BASE_CATS } from "../lib/categories.js";
import { pathFor, DEAL_FILTER } from "../lib/routes.js";
import { bundleConfig } from "../lib/pricing.js";
import { useSeoTags } from "../hooks/useSeoTags.js";
import { useEntryState } from "../lib/navMemory.js";
import { SkeletonCard, LoadingLabel } from "../components/Skeleton.jsx";
const BASE_MATERIALS = ["כסף 925", "כסף + זירקון", "כסף מוזהב"];
const SORTS = [
  ["featured", "מומלצים"],
  ["price-asc", "מחיר: נמוך לגבוה"],
  ["price-desc", "מחיר: גבוה לנמוך"],
  ["new", "חדש ביותר"],
];

export function Catalog() {
  const { products, loaded, catFilter, setCatFilter, go, content } = useStore();
  const isDeal = catFilter === DEAL_FILTER;
  const deal = bundleConfig(content);
  const dealTitle = `מבצע ${deal.size} ב־₪${deal.price}`;
  // Filters/sort belong to this history entry: open a product, go Back, and
  // the list is exactly as it was (scroll position included, see navMemory).
  const [matFilter, setMatFilter] = useEntryState("cat.material", "הכל");
  const [sortBy, setSortBy] = useEntryState("cat.sort", "featured");
  const [sortOpen, setSortOpen] = React.useState(false);
  const [priceMax, setPriceMax] = useEntryState("cat.priceMax", null);
  const [inStockOnly, setInStockOnly] = useEntryState("cat.inStock", false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const cats = !loaded || BASE_CATS.filter((c) => products.some((p) => p.category === c)).length
    ? BASE_CATS
    : Array.from(new Set(products.map((p) => p.category)));
  const materials = BASE_MATERIALS.filter((m) => products.some((p) => p.material === m)).length
    ? BASE_MATERIALS
    : Array.from(new Set(products.map((p) => p.material))).filter(Boolean);

  const allPrices = products.map((p) => Number(p.price) || 0);
  const priceMin = allPrices.length ? Math.min(...allPrices) : 0;
  const priceMaxBound = allPrices.length ? Math.max(...allPrices) : 1000;
  const effectivePriceMax = priceMax ?? priceMaxBound;

  let list = catFilter === "הכל" ? products : isDeal ? products.filter((p) => p.in_bundle) : products.filter((p) => p.category === catFilter);
  if (matFilter !== "הכל") list = list.filter((p) => p.material === matFilter);
  list = list.filter((p) => Number(p.price) <= effectivePriceMax);
  if (inStockOnly) list = list.filter((p) => Number(p.stock) > 0);
  list = list.slice().sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "new") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  const sortLabel = SORTS.find(([k]) => k === sortBy)[1];
  const activeFilterCount = (catFilter !== "הכל" ? 1 : 0) + (matFilter !== "הכל" ? 1 : 0) + (priceMax !== null ? 1 : 0) + (inStockOnly ? 1 : 0);

  const isCategory = catFilter !== "הכל";
  const canonicalPath = pathFor("catalog", { catFilter });
  useSeoTags({
    title: isDeal ? `${dealTitle} · ALFI` : isCategory ? `${catFilter} · ALFI` : "כל התכשיטים · ALFI",
    description: isDeal
      ? `${dealTitle}: בוחרים ${deal.size} תכשיטי כסף מהמבצע ומשלמים ₪${deal.price}.`
      : isCategory
      ? `${catFilter} בכסף סטרלינג 925 מקולקציית ALFI.`
      : "כל תכשיטי הכסף של ALFI במקום אחד — טבעות, שרשראות, עגילים וצמידים בכסף סטרלינג 925.",
    canonical: canonicalPath,
    jsonLd: isCategory ? {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "בית", item: "https://alfi-jewelry.com/" },
        { "@type": "ListItem", position: 2, name: catFilter, item: `https://alfi-jewelry.com${canonicalPath}` },
      ],
    } : undefined,
  });

  return (
    <div className="r-container container glass-card" style={css("max-width:1240px;margin:30px auto;padding:30px var(--sp-5) 64px;")}>
      <div style={css("font-size:13.5px;color:var(--c-ink-faint);margin-bottom:var(--sp-4);")}>
        <a href={pathFor("home")} onClick={(e) => { e.preventDefault(); go("home"); }} style={css("cursor:pointer;")}>בית</a> &nbsp;/&nbsp; קטלוג{catFilter !== "הכל" ? ` / ${isDeal ? dealTitle : catFilter}` : ""}
      </div>
      <div style={css("text-align:center;margin-bottom:var(--sp-6);")}>
        <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-display);")}>{catFilter === "הכל" ? "כל התכשיטים" : isDeal ? dealTitle : catFilter}</h1>
        {isDeal && <p style={css("margin:10px auto 0;font-size:16px;color:var(--c-ink-soft);")}>בוחרים {deal.size} תכשיטים מהמבצע ומשלמים ₪{deal.price} בלבד. המחיר מתעדכן אוטומטית בעגלה.</p>}
      </div>
      {/* Mobile: every category one swipe away, without opening the filter
          panel. A plain horizontal scroller — no custom gesture, so it never
          fights the system back-swipe. */}
      <div className="cat-chips" role="group" aria-label="קטגוריות">
        {["הכל", ...cats, ...(products.some((p) => p.in_bundle) ? [DEAL_FILTER] : [])].map((c) => (
          <button key={c} type="button" className="cat-chip" aria-pressed={catFilter === c} onClick={() => setCatFilter(c)}>
            {c === "הכל" ? "הכל" : c === DEAL_FILTER ? dealTitle : c}
          </button>
        ))}
      </div>
      <div className="r-sidebar-grid" style={css("display:grid;grid-template-columns:230px 1fr;gap:46px;align-items:start;")}>
        <aside className="r-sticky" style={css("position:sticky;top:100px;")}>
          <button
            className="r-catalog-filter-toggle tap-target"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            aria-expanded={mobileFiltersOpen}
            style={css("display:none;width:100%;justify-content:space-between;align-items:center;padding:14px 16px;background:#fff;border:1px solid var(--c-line);border-radius:var(--r-md);font-size:14.5px;font-weight:600;color:var(--c-ink);cursor:pointer;margin-bottom:var(--sp-4);")}
          >
            <span>סינון{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</span>
            <span style={css(`color:var(--c-accent);font-size:19px;line-height:1;transition:transform var(--dur) var(--ease);transform:rotate(${mobileFiltersOpen ? "45deg" : "0"});`)}>+</span>
          </button>
          <div className={`r-catalog-filter-body${mobileFiltersOpen ? " is-open" : ""}`}>
            <div style={css("font-size:13px;font-weight:700;letter-spacing:.06em;color:var(--c-ink-mute);margin-bottom:14px;")}>קטגוריות</div>
            <div style={css("display:flex;flex-direction:column;gap:11px;margin-bottom:var(--sp-6);font-size:15px;")}>
              <button type="button" aria-pressed={catFilter === "הכל"} onClick={() => setCatFilter("הכל")} className="tap-target" style={css(`background:none;border:0;padding:0;font:inherit;text-align:right;cursor:pointer;font-weight:${catFilter === "הכל" ? 700 : 600};color:${catFilter === "הכל" ? "var(--c-accent)" : "var(--c-ink-soft)"};`)}>הכל</button>
              {cats.map((c) => (
                <button type="button" key={c} aria-pressed={catFilter === c} onClick={() => setCatFilter(c)} className="tap-target" style={css(`background:none;border:0;padding:0;font:inherit;text-align:right;cursor:pointer;font-weight:${catFilter === c ? 700 : 400};color:${catFilter === c ? "var(--c-accent)" : "var(--c-ink-soft)"};`)}>{c}</button>
              ))}
            </div>
            <div style={css("font-size:13px;font-weight:700;letter-spacing:.06em;color:var(--c-ink-mute);margin-bottom:14px;")}>חומר</div>
            <div style={css("display:flex;flex-direction:column;gap:11px;font-size:15px;margin-bottom:var(--sp-6);")}>
              <button type="button" aria-pressed={matFilter === "הכל"} onClick={() => setMatFilter("הכל")} className="tap-target" style={css(`background:none;border:0;padding:0;font:inherit;text-align:right;cursor:pointer;font-weight:${matFilter === "הכל" ? 700 : 400};color:${matFilter === "הכל" ? "var(--c-accent)" : "var(--c-ink-soft)"};`)}>הכל</button>
              {materials.map((m) => (
                <button type="button" key={m} aria-pressed={matFilter === m} onClick={() => setMatFilter(m)} className="tap-target" style={css(`background:none;border:0;padding:0;font:inherit;text-align:right;cursor:pointer;font-weight:${matFilter === m ? 700 : 400};color:${matFilter === m ? "var(--c-accent)" : "var(--c-ink-soft)"};`)}>{m}</button>
              ))}
            </div>
            <label htmlFor="catalog-price-max" style={css("display:block;font-size:13px;font-weight:700;letter-spacing:.06em;color:var(--c-ink-mute);margin-bottom:14px;")}>מחיר עד {fmt(effectivePriceMax)}</label>
            <input
              id="catalog-price-max"
              aria-valuetext={`עד ${fmt(effectivePriceMax)}`}
              type="range" min={priceMin} max={priceMaxBound} value={effectivePriceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              style={css("width:100%;accent-color:var(--c-accent);cursor:pointer;margin-bottom:var(--sp-6);")}
            />
            <label style={css("display:flex;align-items:center;gap:9px;font-size:14.5px;cursor:pointer;color:var(--c-ink-soft);")}>
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} style={css("width:17px;height:17px;accent-color:var(--c-accent);cursor:pointer;")} />
              במלאי בלבד
            </label>
          </div>
        </aside>
        <div>
          <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-5);padding-bottom:16px;border-bottom:1px solid var(--c-line);position:relative;")}>
            <span style={css("font-size:14.5px;color:var(--c-ink-mute);")}>{loaded ? `${list.length} מוצרים` : "טוען…"}</span>
            <div style={css("position:relative;")}>
              <button type="button" aria-expanded={sortOpen} aria-haspopup="true" onClick={() => setSortOpen((v) => !v)} onKeyDown={(e) => { if (e.key === "Escape") setSortOpen(false); }} className="tap-target" style={css("background:none;border:0;padding:0;font:inherit;text-align:right;font-size:14.5px;color:var(--c-ink-soft);cursor:pointer;display:flex;align-items:center;gap:4px;")}>מיון: {sortLabel} <span aria-hidden="true">▾</span></button>
              {sortOpen && (
                <div onMouseLeave={() => setSortOpen(false)} style={css("position:absolute;left:0;top:100%;margin-top:6px;background:#fff;border:1px solid var(--c-line);border-radius:var(--r-md);box-shadow:var(--shadow-md);overflow:hidden;z-index:10;min-width:180px;")}>
                  {SORTS.map(([k, label]) => (
                    <button type="button" key={k} aria-pressed={sortBy === k} onClick={() => { setSortBy(k); setSortOpen(false); }} onKeyDown={(e) => { if (e.key === "Escape") setSortOpen(false); }} style={css(`background:none;border:0;padding:0;font:inherit;text-align:right;display:block;width:100%;padding:12px 16px;font-size:14px;cursor:pointer;color:${sortBy === k ? "var(--c-accent)" : "var(--c-ink)"};font-weight:${sortBy === k ? 700 : 400};`)}>{label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {!loaded ? (
            <div className="grid-3">
              <LoadingLabel text="טוען תכשיטים…" />
              {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : list.length === 0 ? (
            <div className="card" style={css("padding:60px 20px;text-align:center;color:var(--c-ink-mute);")}>לא נמצאו מוצרים בסינון הזה.</div>
          ) : (
            <div className="grid-3">
              {list.map((p, i) => <RedesignProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
