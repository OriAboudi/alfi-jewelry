import React from "react";
import { css } from "../lib/css.js";
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
    <section className="rd-slider-max" style={css("padding:36px 0 40px;display:flex;flex-direction:column;gap:18px;")}>
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
    </section>
  );
}

export function Home() {
  const { content: C, products, go, setCatFilter, openSignupPopup } = useStore();
  const [bestSellers, setBestSellers] = React.useState([]);

  useSeoTags({
    title: "ALFI · תכשיטי כסף סטרלינג 925 לאישה — טבעות, שרשראות, עגילים וצמידים",
    description: "ALFI — תכשיטי כסף סטרלינג 925 בהשראת הטבע. טבעות, שרשראות, עגילים וצמידים לאישה.",
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
  const slider1 = (featuredList.length ? featuredList : products).slice(0, 8);
  const slider2raw = bestSellers.length ? bestSellers : products.slice(8, 16);
  const usedIds = new Set(slider1.map((p) => p.id));
  const leftover2 = slider2raw.filter((p) => !usedIds.has(p.id));
  const slider2 = (leftover2.length ? leftover2 : [...products].reverse()).slice(0, 8);

  const heroImages = (C.heroImages && C.heroImages.length ? C.heroImages : (C.heroImage ? [C.heroImage] : []));
  const heroImagesMobile = C.heroImagesMobile || [];

  const goCat = (c) => { setCatFilter(c); go("catalog"); };
  const goCatalog = () => go("catalog");

  return (
    <div>
      {/* HERO — just the image (no glass panel/text over it). The page still
          needs exactly one real H1 for SEO/screen readers, so it's
          visually-hidden (sr-only) rather than disappearing entirely — a
          legitimate accessibility pattern, not the deceptive "hidden text"
          Google penalizes, since it accurately describes the page and isn't
          stuffed with extra keywords. */}
      <h1 style={css("position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;")}>ALFI — תכשיטי כסף סטרלינג 925 בהשראת הטבע</h1>
      <section className="rd-hero" style={css("position:relative;overflow:hidden;display:flex;align-items:center;box-sizing:border-box;")}>
        <HeroSlider images={heroImages} imagesMobile={heroImagesMobile} />
      </section>

      {/* FEATURED SLIDER */}
      <ProductSlider title={C.featuredTitle || "נבחרים מהסדנה"} mobileTitle="נבחרים" ctaLabel="לכל התכשיטים" onCta={goCatalog} products={slider1} />

      {/* COLLECTIONS 2x2 */}
      <section className="rd-section-pad" style={css("display:flex;flex-direction:column;gap:32px;")}>
        <div className="glass rd-collections-head rd-only-desktop" style={css("display:flex;justify-content:space-between;align-items:center;")}>
          <h2 className="serif" style={css("margin:0;font-size:46px;font-weight:300;")}>הקולקציות</h2>
          <span style={css("font-size:15px;color:var(--text-body);")}>{tileCats.join(" · ")}</span>
        </div>
        <div className="rd-cat-grid">
          {tileCats.map((c, i) => {
            const img = (C.categoryImages || {})[c] || "";
            return (
              <a key={c} href={pathFor("catalog", { catFilter: c })} onClick={(e) => { e.preventDefault(); goCat(c); }} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); goCat(c); } }} tabIndex={0} className="rd-cat rd-cat-desktop glass-strong tap-target">
                <div style={css("overflow:hidden;")}>
                  <div className="rd-img" style={css(`border-radius:0;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background-color:${GRAD_CARD};width:100%;height:100%;`)}>
                    {img ? (
                      <img src={img} alt={`${c} כסף 925`} style={css("width:100%;height:100%;object-fit:cover;object-position:center;")} />
                    ) : (
                      <Disc style="width:36%;aspect-ratio:1;" />
                    )}
                  </div>
                </div>
                <div className="rd-cat-text" style={css("display:flex;flex-direction:column;justify-content:space-between;")}>
                  <span style={css("font-size:13px;letter-spacing:.3em;color:var(--accent2);")}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="serif rd-cat-name" style={css("font-weight:300;line-height:1;")}>{c}</span>
                  <span className="rd-go" style={css("align-self:flex-start;height:50px;padding:0 22px;border:1px solid var(--ink);display:flex;align-items:center;gap:12px;font-size:15px;letter-spacing:.06em;")}>לקולקציה<GoArrowIcon /></span>
                </div>
              </a>
            );
          })}
        </div>
        {/* Mobile: plain white tiles, image only — no text label, no glass
            wrapper, shadow, or arrow icon. Category name moves to aria-label
            for screen readers since it no longer appears visually. */}
        <div className="rd-cat-grid-mobile">
          {tileCats.map((c) => {
            const img = (C.categoryImages || {})[c] || "";
            return (
              <a key={c} href={pathFor("catalog", { catFilter: c })} onClick={(e) => { e.preventDefault(); goCat(c); }} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); goCat(c); } }} tabIndex={0} aria-label={c} className="rd-cat-mobile tap-target">
                <div className="rd-tile" style={css(`border-radius:0;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background-color:${GRAD_CARD};`)}>
                  {img ? (
                    <img src={img} alt={`${c} כסף 925`} style={css("width:100%;height:100%;object-fit:cover;object-position:center;")} />
                  ) : (
                    <Disc style="width:62%;aspect-ratio:1;" />
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* PROMO BANNER — content.banner3* (existing admin fields; closest
          match to the mockup's "3 תכשיטים ב-220 ₪" promo slot). Full
          screen width, unlike the other sections. */}
      <section className="rd-promo-section">
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
      </section>

      {/* SECOND SLIDER — best sellers */}
      <ProductSlider title="עוד תכשיטים שתאהבי" mobileTitle="עוד תכשיטים" ctaLabel="לכל התכשיטים" onCta={goCatalog} products={slider2} />

      {/* BRAND STORY PANEL */}
      <section className="rd-section-pad-b">
        <div className="glass-strong rd-story-box">
          <div style={css("display:flex;flex-direction:column;gap:24px;")}>
            <div style={css("font-size:13px;letter-spacing:.3em;color:var(--accent2);")}>מהסדנה</div>
            <h2 className="serif rd-story-h2" style={css("margin:0;font-weight:300;")}>כל תכשיט<br />מתחיל בפרח אחד</h2>
            <a href={pathFor("story")} onClick={(e) => { e.preventDefault(); go("story"); }} style={css("align-self:flex-start;cursor:pointer;font-size:15px;border-bottom:1px solid var(--ink);padding:10px 0 4px;")}>לסיפור המלא</a>
          </div>
          <div style={css("display:flex;flex-direction:column;gap:28px;")}>
            <p className="rd-story-p" style={css("margin:0;color:var(--text-body);")}>{C.aboutText}</p>
            <div style={css("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;border-top:1px solid #D9CACD;padding-top:28px;")}>
              <div style={css("display:flex;flex-direction:column;gap:6px;")}><div className="serif" style={css("font-size:26px;")}>925</div><div style={css("font-size:14px;color:var(--text-muted);")}>כסף סטרלינג</div></div>
              <div style={css("display:flex;flex-direction:column;gap:6px;")}><div className="serif" style={css("font-size:26px;")}>עיצוב</div><div style={css("font-size:14px;color:var(--text-muted);")}>עיצוב עדין ומוקפד</div></div>
              <div style={css("display:flex;flex-direction:column;gap:6px;")}><div className="serif" style={css("font-size:26px;")}>טבע</div><div style={css("font-size:14px;color:var(--text-muted);")}>השראה מהגן</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER (desktop reference) — no separate email-capture backend
          exists; this opens the same sign-up/coupon popup as the footer's
          "קבלת קוד הנחה" button always has, per HANDOFF.md's "keep the
          existing newsletter submit logic if there is one". */}
      <section className="rd-only-desktop" style={css("padding:0 64px 120px;display:flex;justify-content:center;")}>
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
      </section>
    </div>
  );
}
