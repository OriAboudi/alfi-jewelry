import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { Disc } from "../components/Ornaments.jsx";
import { HeroSlider } from "../components/HeroSlider.jsx";
import { CardSlider } from "../components/CardSlider.jsx";
import { ProductCard } from "../components/ProductCard.jsx";
import { store } from "../lib/store.js";
import { useStore } from "../context/StoreContext.jsx";

const BASE_CATS = ["טבעות", "שרשראות", "עגילים", "צמידים", "אקססוריז"];
// Fixed order for the homepage's 4-tile category section, per reference site.
const HOME_TILE_CATS = ["צמידים", "עגילים", "שרשראות", "טבעות"];
const TRUST_ITEMS = ["✓ כסף סטרלינג 925 אמיתי", "✓ עבודת יד באולפן שלנו", "✓ אריזת מתנה בכל הזמנה"];

function SliderSection({ eyebrow, title, ctaLabel, onCta, products }) {
  if (!products.length) return null;
  return (
    <section className="container" style={css("padding-block:var(--sp-6);")}>
      <div style={css("display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:var(--sp-6);flex-wrap:wrap;gap:12px;")}>
        <div>
          {eyebrow && <div className="eyebrow" style={css("margin-bottom:8px;")}>{eyebrow}</div>}
          <h2 className="title-h2" style={css("font-size:var(--fs-h1);")}>{title}</h2>
        </div>
        <span onClick={onCta} style={css("cursor:pointer;font-size:15px;color:var(--c-ink-mute);border-bottom:1px solid var(--c-accent);padding-bottom:2px;")}>{ctaLabel}</span>
      </div>
      <CardSlider>
        {products.map((p) => <ProductCard key={p.id} product={p} width="clamp(155px,40vw,230px)" />)}
      </CardSlider>
    </section>
  );
}

function Banner({ image, title, subtitle, ctaLabel, onCta }) {
  // No admin-uploaded image yet -> fall back to the site's own default
  // background (the same floral image used site-wide), not a flat color,
  // so the banner still looks intentional before a real photo is set.
  const bg = image ? `url("${image}") center/cover` : `url("floral-bg.jpg") center/cover`;
  return (
    <section style={css(`position:relative;min-height:clamp(150px,32vw,420px);background:${bg};display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;`)}>
      <div style={css("position:absolute;inset:0;background:linear-gradient(rgba(250,245,239,.3),rgba(250,245,239,.68));")} />
      <div style={css("position:relative;padding:var(--sp-4) var(--sp-5);max-width:560px;")}>
        <h2 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);line-height:1.15;margin-bottom:var(--sp-3);")}>{title}</h2>
        {subtitle && <p style={css("font-size:15.5px;color:var(--c-ink-soft);margin-bottom:var(--sp-4);")}>{subtitle}</p>}
        <button onClick={onCta} className="btn btn-primary">{ctaLabel}</button>
      </div>
    </section>
  );
}

export function Home() {
  const { content: C, products, go, setCatFilter } = useStore();
  const [openFaq, setOpenFaq] = React.useState(null);
  const [bestSellers, setBestSellers] = React.useState([]);

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
  const slider2 = bestSellers.length ? bestSellers : products.slice(8, 16);
  const usedIds = new Set([...slider1, ...slider2].map((p) => p.id));
  const slider3 = products.filter((p) => !usedIds.has(p.id)).slice(0, 8);

  const freeShipFrom = Number(C.freeShipFrom || 500);
  const heroImages = (C.heroImages && C.heroImages.length ? C.heroImages : (C.heroImage ? [C.heroImage] : []));

  const goCat = (c) => { setCatFilter(c); go("catalog"); };
  const goCatalog = () => go("catalog");

  const FAQ_ITEMS = [
    { q: "מה זה כסף 925?", a: "כסף סטרלינג 925 הוא כסף טהור בשילוב סגסוגת עדינה שמעניקה לו חוזק — כל תכשיט נוצר ומלוטש ביד באולפן שלנו." },
    { q: "איך בוחרים מידה?", a: "בעמוד כל מוצר אפשר לבחור מידה מתוך האפשרויות הזמינות. לא בטוחים באיזו מידה מתאימה? אפשר לפנות אלינו ונשמח לעזור." },
    { q: "איך שומרים על התכשיט?", a: "יש להימנע ממגע עם מים, בשמים וכימיקלים, ולאחסן בנפרד בשקית סגורה הרחק מאור שמש ישיר." },
    { q: "מה מדיניות ההחזרות?", a: `ניתן להחזיר תוך 14 יום מקבלת המשלוח, באריזה המקורית. משלוח חינם בהזמנה מעל ${fmt(freeShipFrom)}.` },
  ];

  return (
    <div>
      {/* TOP PROMO STRIP */}
      <section style={css("background:var(--c-line-soft);border-bottom:1px solid var(--c-line);")}>
        <div className="container" style={css("padding:var(--sp-3) var(--sp-4);display:flex;flex-wrap:wrap;justify-content:center;gap:10px var(--sp-6);text-align:center;")}>
          {TRUST_ITEMS.map((t) => (
            <span key={t} style={css("font-size:13px;font-weight:600;color:var(--c-accent-dark);white-space:nowrap;")}>{t}</span>
          ))}
          <span style={css("font-size:13px;font-weight:600;color:var(--c-accent-dark);white-space:nowrap;")}>✓ משלוח חינם מעל {fmt(freeShipFrom)}</span>
        </div>
      </section>

      {/* HERO — large image */}
      <section className="r-hero" style={css("position:relative;width:100%;margin-bottom:0;aspect-ratio:4/3;min-height:200px;max-height:580px;")}>
        <HeroSlider images={heroImages}>
          <div className="r-hero-badge" style={css("position:absolute;top:var(--sp-5);right:var(--sp-5);background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border-radius:var(--r-pill);padding:10px 22px;font-size:14.5px;font-weight:600;color:var(--c-accent);letter-spacing:.05em;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.08);z-index:2;")}>{C.heroBadge}</div>
          <div className="r-hero-cta" style={css("position:absolute;bottom:var(--sp-5);right:var(--sp-5);z-index:2;")}>
            <button onClick={goCatalog} className="btn btn-primary" style={css("padding:10px 22px;font-size:13.5px;box-shadow:0 12px 34px rgba(0,0,0,.22);")}>{C.heroCtaLabel}</button>
          </div>
        </HeroSlider>
      </section>

      {/* SLIDER 1 */}
      <SliderSection eyebrow={C.featuredKicker} title={C.featuredTitle} ctaLabel="לכל המוצרים ←" onCta={goCatalog} products={slider1} />

      {/* 4 CATEGORY TILES */}
      <section className="container" style={css("padding-block:var(--sp-6);")}>
        <div className="grid-4" style={css("gap:2px;")}>
          {tileCats.map((c) => {
            const img = (C.categoryImages || {})[c] || "";
            return (
              <div key={c} onClick={() => goCat(c)} className="tap-target hover-lift" style={css("cursor:pointer;position:relative;")}>
                <div style={thumb(img, GRAD_CARD, "aspect-ratio:5/6;border-radius:0;border:1px solid var(--c-line);background-size:contain;")}>
                  {!img && <Disc style="width:40%;aspect-ratio:1;" />}
                  <span style={css("position:absolute;bottom:12px;right:12px;left:12px;background:rgba(255,255,255,.92);text-align:center;font-size:14px;font-weight:700;padding:8px 10px;")}>{c}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BANNER 2 — large image */}
      <Banner image={C.banner2Image} title={C.banner2Title} subtitle={C.banner2Subtitle} ctaLabel={C.banner2CtaLabel} onCta={() => go("collections")} />

      {/* SLIDER 2 — best sellers */}
      <SliderSection eyebrow="❀ הכי אהובים" title="הנמכרים ביותר" ctaLabel="לכל המוצרים ←" onCta={goCatalog} products={slider2} />

      {/* BANNER 3 — promo */}
      <Banner image={C.banner3Image} title={C.banner3Title} subtitle={C.banner3Subtitle} ctaLabel={C.banner3CtaLabel} onCta={goCatalog} />

      {/* SLIDER 3 */}
      <SliderSection eyebrow="❀ עוד השראה" title="תכשיטים נוספים שתאהבו" ctaLabel="לכל המוצרים ←" onCta={goCatalog} products={slider3} />

      {/* BRIEF BRAND BLURB */}
      <section style={css("background:var(--c-line-soft);padding-block:var(--sp-7);text-align:center;")}>
        <div className="container" style={css("max-width:640px;")}>
          <h2 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:var(--sp-3);")}>{C.aboutTitle}</h2>
          <p style={css("font-size:16px;color:var(--c-ink-soft);line-height:1.7;")}>{C.aboutText}</p>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="container" style={css("max-width:760px;padding-block:var(--sp-7);")}>
          <h2 className="title-h2" style={css("font-size:var(--fs-h1);text-align:center;margin-bottom:var(--sp-6);")}>שאלות נפוצות</h2>
          {FAQ_ITEMS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i} style={css("border-bottom:1px solid var(--c-line);")}>
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="tap-target"
                  style={css("width:100%;background:none;border:none;padding:18px 0;display:flex;justify-content:space-between;align-items:center;font-size:15.5px;font-weight:600;cursor:pointer;color:var(--c-ink);text-align:right;")}
                >
                  {f.q}<span style={css(`color:var(--c-accent);font-size:20px;line-height:1;transition:transform var(--dur) var(--ease);transform:rotate(${open ? "45deg" : "0"});`)}>+</span>
                </button>
                {open && <p style={css("padding:0 0 18px;font-size:14.5px;color:var(--c-ink-soft);line-height:1.7;")}>{f.a}</p>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
