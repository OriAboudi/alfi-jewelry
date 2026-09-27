import React from "react";
import { css } from "../lib/css.js";
import { saleInfo } from "../lib/pricing.js";
import { PriceTag } from "../components/PriceTag.jsx";
import { GRAD_CARD } from "../lib/ui.js";
import { Disc } from "../components/Ornaments.jsx";
import { HeroSlider } from "../components/HeroSlider.jsx";
import { CardSlider } from "../components/CardSlider.jsx";
import { RedesignProductCard } from "../components/RedesignProductCard.jsx";
import { store } from "../lib/store.js";
import { useStore } from "../context/StoreContext.jsx";
import { CAT_NAMES as BASE_CATS } from "../lib/categories.js";
import { pathFor } from "../lib/routes.js";
import { useSeoTags } from "../hooks/useSeoTags.js";
import { Reveal } from "../components/Reveal.jsx";
// Fixed order for the homepage's 2x2 collections grid, per reference site.
const HOME_TILE_CATS = ["טבעות", "שרשראות", "עגילים", "צמידים"];

const GoArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);

// The design-handoff's two product sliders (used twice: "featured" and
// "second"), with a glass section-header strip (title + "לכל התכשיטים"
// link) above the rail. Desktop prev/next arrows are floating buttons on
// the rail's own left/right edges (CardSlider itself), not in this header.
function ProductSlider({ title, mobileTitle, ctaLabel, onCta, products }) {
  if (!products.length) return null;
  return (
    <Reveal as="section" className="rd-slider-max" style={css("padding:36px 0 40px;display:flex;flex-direction:column;gap:18px;")}>
      <div className="glass rd-slider-head" style={css("display:flex;justify-content:space-between;align-items:center;")}>
        <div style={css("display:flex;align-items:baseline;gap:20px;")}>
          <h2 className="serif rd-slider-title" style={css("margin:0;font-weight:300;")}>
            <span className="rd-only-desktop">{title}</span>
            <span className="rd-only-mobile">{mobileTitle}</span>
          </h2>
          <a href={pathFor("catalog", { catFilter: "הכל" })} onClick={(e) => { e.preventDefault(); onCta(); }} style={css("cursor:pointer;font-size:15px;letter-spacing:.06em;border-bottom:1px solid var(--ink);padding:8px 0 2px;")}>לכל התכשיטים</a>
        </div>
      </div>
      <CardSlider>
        {products.map((p, i) => <RedesignProductCard key={p.id} product={p} index={i} />)}
      </CardSlider>
    </Reveal>
  );
}

export function Home() {
  const { content: C, products, go, setCatFilter, openSignupPopup, openProduct } = useStore();
  const [bestSellers, setBestSellers] = React.useState([]);

  useSeoTags({
    title: "ALFI · תכשיטי כסף סטרלינג 925 לאישה — טבעות, שרשראות, עגילים וצמידים",
    description: "ALFI — תכשיטי כסף סטרלינג 925 באיכות אמיתית ובמחיר נגיש. טבעות, שרשראות, עגילים וצמידים לאישה.",
    canonical: "/",
  });

  React.useEffect(() => {
    let alive = true;
    store.stats.bestSellers({ limit: 8 })
      .then((rows) => {
        if (!alive) return;
        const matched = rows
          .map((r) => products.find((p) => String(p.id) === String(r.product_id)))
          .filter(Boolean);
        setBestSellers(matched);
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  const cats = BASE_CATS.filter((c) => products.some((p) => p.category === c)).length
    ? BASE_CATS
    : Array.from(new Set(products.map((p) => p.category)));
  const tileCats = HOME_TILE_CATS.filter((c) => cats.includes(c)).length ? HOME_TILE_CATS.filter((c) => cats.includes(c)) : cats.slice(0, 4);

  const featuredList = products.filter((p) => p.featured);

  // Hero mini-shop (desktop): four real, in-stock pieces with live prices.
  // Real best-sellers (from actual orders) when there are enough of them,
  // otherwise the admin's featured picks — the label says which, truthfully.
  const inStock = (p) => Number(p.stock) > 0;
  const heroBest = bestSellers.filter(inStock);
  const heroShopIsBest = heroBest.length >= 3;
  const heroShop = (heroShopIsBest ? heroBest : [...featuredList, ...products].filter(inStock))
    .filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i)
    .slice(0, 4);
  // Live sale hook: only rendered when a product is actually on sale.
  const maxSalePct = products.filter(inStock).reduce((m, p) => Math.max(m, saleInfo(p).percent), 0);
  const slider1 = (featuredList.length ? featuredList : products).slice(0, 8);
  const slider2raw = bestSellers.length ? bestSellers : products.slice(8, 16);
  const usedIds = new Set(slider1.map((p) => p.id));
  const leftover2 = slider2raw.filter((p) => !usedIds.has(p.id));
  const slider2 = (leftover2.length ? leftover2 : [...products].reverse()).slice(0, 8);

  // Deliberately NOT falling back to the legacy single-image `heroImage`
  // field here: it predates the admin gallery upload's client-side
  // compression pipeline, so it can silently hold a multi-megabyte
  // uncompressed original (found one live at ~7MB) — showing the existing
  // gradient placeholder until a real image is uploaded to the gallery
  // beats risking that as the page's largest, highest-priority image.
  const heroImages = C.heroImages && C.heroImages.length ? C.heroImages : [];
  const heroImagesMobile = C.heroImagesMobile || [];

  const goCat = (c) => { setCatFilter(c); go("catalog"); };
  const goCatalog = () => go("catalog");

  return (
    <div>
      {/* HERO — real headline + CTA panel over the image, using content
          fields that already existed in the data (authHeadline/heroBadge/
          heroCtaLabel) but were never wired to any screen. This is also the
          page's one real, visible H1 — a genuine heading beats a
          visually-hidden one for both SEO and the people reading it. */}
      <section className="rd-hero" style={css("position:relative;")}>
        <HeroSlider images={heroImages} imagesMobile={heroImagesMobile}>
          <div className="rd-hero-panel" style={css("display:flex;flex-direction:column;align-items:flex-start;")}>
            <h1 className="serif rd-hero-h1" style={css("margin:0;font-weight:300;color:var(--ink-deep);")}>{C.authHeadline}</h1>
            {C.authTagline && <p className="rd-hero-p" style={css("margin:0;color:var(--text-body);")}>{C.authTagline}</p>}
            <div className="rd-hero-actions" style={css("display:flex;flex-wrap:wrap;align-items:center;gap:12px 22px;width:100%;")}>
              <button onClick={goCatalog} className="rd-btn rd-btn-outline" style={css("height:52px;padding:0 28px;background:transparent;color:var(--ink);border:1px solid var(--ink);font:inherit;font-size:15px;letter-spacing:.06em;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;")}>
                {C.heroCtaLabel || "לצפייה בקולקציה"}<GoArrowIcon />
              </button>
              {maxSalePct > 0 && (
                <a href={pathFor("catalog", { catFilter: "הכל" })} onClick={(e) => { e.preventDefault(); goCatalog(); }} className="rd-hero-sale">
                  <span className="rd-hero-sale-chip">מבצע</span>
                  עד {maxSalePct}% הנחה על פריטים נבחרים
                </a>
              )}
            </div>
            {/* The admin "hero badge" line — a quiet signature under the CTA
                (linking to the collections), not a boxed label above the H1. */}
            {C.heroBadge && (
              <div className={`rd-hero-note${heroShop.length >= 3 ? " rd-hero-note--shop" : ""}`}>
                <a href={pathFor("collections")} onClick={(e) => { e.preventDefault(); go("collections"); }}>{C.heroBadge}</a>
              </div>
            )}
            {heroShop.length >= 3 && (
              <div className="rd-hero-shop">
                <div className="rd-hero-shop-head">
                  <span>{heroShopIsBest ? "הנמכרים ביותר" : (C.heroBadge || "נבחרות מהקולקציה")}</span>
                  <a href={pathFor("catalog", { catFilter: "הכל" })} onClick={(e) => { e.preventDefault(); goCatalog(); }}>לכל התכשיטים</a>
                </div>
                <ul className="rd-hero-shop-list">
                  {heroShop.map((p) => (
                    <li key={p.id}>
                      <a href={pathFor("product", { pid: p.id, products })} onClick={(e) => { e.preventDefault(); openProduct(p.id); }} className="rd-hero-shop-item">
                        <span className="rd-hero-shop-thumb">
                          {p.image ? <img src={p.image} alt="" loading="lazy" decoding="async" /> : <Disc style="width:46%;aspect-ratio:1;" />}
                        </span>
                        <span className="serif rd-hero-shop-name">{p.name}</span>
                        <PriceTag product={p} size={13} showPercent={false} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </HeroSlider>
      </section>

      {/* FEATURED SLIDER */}
      <ProductSlider title={C.featuredTitle || "נבחרים מהסדנה"} mobileTitle="נבחרים" ctaLabel="לכל התכשיטים" onCta={goCatalog} products={slider1} />

      {/* COLLECTIONS 2x2 */}
      <Reveal as="section" className="rd-section-pad" style={css("display:flex;flex-direction:column;gap:32px;")}>
        <div className="glass rd-collections-head" style={css("display:flex;justify-content:space-between;align-items:center;")}>
          <h2 className="serif rd-collections-title" style={css("margin:0;font-weight:300;")}>הקולקציות</h2>
          <span className="rd-only-desktop" style={css("font-size:15px;color:var(--text-body);")}>{tileCats.join(" · ")}</span>
        </div>
        <div className="rd-cat-grid">
          {tileCats.map((c, i) => {
            const img = (C.categoryImages || {})[c] || "";
            return (
              <a key={c} href={pathFor("catalog", { catFilter: c })} onClick={(e) => { e.preventDefault(); goCat(c); }} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); goCat(c); } }} tabIndex={0} className="rd-cat rd-cat-desktop glass-strong tap-target">
                <div style={css("overflow:hidden;")}>
                  <div className="rd-img" style={css(`border-radius:0;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background-color:${GRAD_CARD};width:100%;height:100%;`)}>
                    {img ? (
                      <img src={img} alt={`${c} כסף 925`} loading="lazy" decoding="async" style={css("width:100%;height:100%;object-fit:cover;object-position:center;")} />
                    ) : (
                      <Disc style="width:36%;aspect-ratio:1;" />
                    )}
                  </div>
                </div>
                <div className="rd-cat-text" style={css("display:flex;flex-direction:column;justify-content:space-between;")}>
                  <span className="serif rd-cat-name" style={css("font-weight:300;line-height:1;")}>{c}</span>
                  <span className="rd-go" style={css("align-self:flex-start;height:50px;padding:0 22px;border:1px solid var(--ink);display:flex;align-items:center;gap:12px;font-size:15px;letter-spacing:.06em;")}>לקולקציה<GoArrowIcon /></span>
                </div>
              </a>
            );
          })}
        </div>
        {/* Mobile: the desktop card in miniature — cream card, photo on top,
            category name + arrow as a visible caption, spaced 2-up grid. */}
        <div className="rd-cat-grid-mobile">
          {tileCats.map((c) => {
            const img = (C.categoryImages || {})[c] || "";
            return (
              <a key={c} href={pathFor("catalog", { catFilter: c })} onClick={(e) => { e.preventDefault(); goCat(c); }} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); goCat(c); } }} tabIndex={0} className="rd-cat-mobile glass-strong tap-target">
                <div className="rd-tile" style={css(`border-radius:0;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background-color:${GRAD_CARD};`)}>
                  {img ? (
                    <img src={img} alt={`${c} כסף 925`} loading="lazy" decoding="async" style={css("width:100%;height:100%;object-fit:cover;object-position:center;")} />
                  ) : (
                    <Disc style="width:62%;aspect-ratio:1;" />
                  )}
                </div>
                <div className="rd-cat-caption">
                  <span className="serif rd-cat-caption-name">{c}</span>
                  <span className="rd-cat-caption-go" aria-hidden="true"><GoArrowIcon /></span>
                </div>
              </a>
            );
          })}
        </div>
      </Reveal>

      {/* PROMO BANNER — content.banner3* (existing admin fields; closest
          match to the mockup's "3 תכשיטים ב-220 ₪" promo slot). Full
          screen width, unlike the other sections. */}
      <Reveal as="section" className="rd-promo-section">
        <div className="rd-promo glass-strong rd-promo-box">
          <div style={css("position:relative;overflow:hidden;")}>
            <div
              className="rd-promo-img"
              style={css(`position:absolute;inset:0;background-image:url("${C.banner3Image || "floral-bg.jpg"}");background-size:${C.banner3Image ? "cover" : "150%"};background-position:${C.banner3Image ? "center" : "70% 55%"};`)}
            />
          </div>
          <div className="rd-promo-text" style={css("display:flex;flex-direction:column;justify-content:center;")}>
            <span style={css("align-self:flex-start;height:34px;padding:0 16px;display:flex;align-items:center;background:var(--ink-fill);color:var(--cream);font-size:13px;letter-spacing:.2em;")}>מבצע</span>
            <h2 className="serif rd-promo-h2" style={css("margin:0;font-weight:300;color:var(--ink-deep);")}>{C.banner3Title || "3 תכשיטים ב־220 ₪"}</h2>
            <p className="rd-promo-p" style={css("margin:0;color:var(--text-body);")}>{C.banner3Subtitle || "בוחרים כל שלושה תכשיטים ומשלמים 220 ₪ בלבד. [תנאי המבצע — אילו פריטים משתתפים ועד מתי]"}</p>
            <button onClick={goCatalog} className="rd-btn rd-btn-outline rd-promo-cta" style={css("align-self:flex-start;display:flex;align-items:center;gap:14px;background:transparent;color:var(--ink);border:1px solid var(--ink);font:inherit;font-size:16px;letter-spacing:.08em;cursor:pointer;")}>{C.banner3CtaLabel || "לבחירת התכשיטים"}<GoArrowIcon /></button>
          </div>
        </div>
      </Reveal>

      {/* SECOND SLIDER — best sellers */}
      <ProductSlider title="עוד תכשיטים שתאהבי" mobileTitle="עוד תכשיטים" ctaLabel="לכל התכשיטים" onCta={goCatalog} products={slider2} />

      {/* BRAND STORY PANEL */}
      <Reveal as="section" className="rd-section-pad-b">
        <div className="glass-strong rd-story-box">
          <div style={css("display:flex;flex-direction:column;gap:24px;")}>
            <h2 className="serif rd-story-h2" style={css("margin:0;font-weight:300;")}>כל תכשיט<br />מתחיל באהבה</h2>
            <a href={pathFor("story")} onClick={(e) => { e.preventDefault(); go("story"); }} style={css("align-self:flex-start;cursor:pointer;font-size:15px;border-bottom:1px solid var(--ink);padding:10px 0 4px;")}>לסיפור המלא</a>
          </div>
          <div style={css("display:flex;flex-direction:column;gap:28px;")}>
            <p className="rd-story-p" style={css("margin:0;color:var(--text-body);")}>{C.aboutText}</p>
            <div style={css("font-size:15px;color:var(--ink);border-top:1px solid #D9CACD;padding-top:28px;")}>כסף סטרלינג 925 · עיצוב מוקפד · מחיר הוגן</div>
          </div>
        </div>
      </Reveal>

      {/* NEWSLETTER (desktop reference) — no separate email-capture backend
          exists; this opens the same sign-up/coupon popup as the footer's
          "קבלת קוד הנחה" button always has, per HANDOFF.md's "keep the
          existing newsletter submit logic if there is one". */}
      <Reveal as="section" className="rd-only-desktop" style={css("padding:0 64px 120px;display:flex;justify-content:center;")}>
        <div className="glass" style={css("width:680px;padding:48px 56px;box-sizing:border-box;display:flex;flex-direction:column;gap:20px;align-items:center;text-align:center;")}>
          <h3 className="serif" style={css("margin:0;font-size:38px;font-weight:300;")}>הצטרפי לגן של ALFI</h3>
          <button
            onClick={() => openSignupPopup(false)}
            style={css("width:100%;display:flex;align-items:center;justify-content:space-between;border:0;border-bottom:1px solid var(--ink);background:transparent;font:inherit;cursor:pointer;padding:0;")}
          >
            <span style={css("height:52px;display:flex;align-items:center;font-size:17px;color:var(--text-muted);")}>כתובת אימייל</span>
            <span style={css("height:52px;display:flex;align-items:center;font-size:16px;letter-spacing:.08em;color:var(--ink);")}>הרשמה</span>
          </button>
        </div>
      </Reveal>
    </div>
  );
}
