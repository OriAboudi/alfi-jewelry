import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { FlowerMark, Disc } from "../components/Ornaments.jsx";
import { HeroSlider } from "../components/HeroSlider.jsx";
import { CardSlider } from "../components/CardSlider.jsx";
import { useStore } from "../context/StoreContext.jsx";

const BASE_CATS = ["טבעות", "שרשראות", "עגילים", "צמידים"];
const TRUST_ITEMS = ["✓ כסף סטרלינג 925 אמיתי", "✓ עבודת יד באולפן שלנו", "✓ אריזת מתנה בכל הזמנה"];

export function Home() {
  const { content: C, products, go, openProduct, setCatFilter } = useStore();

  const cats = BASE_CATS.filter((c) => products.some((p) => p.category === c)).length
    ? BASE_CATS
    : Array.from(new Set(products.map((p) => p.category)));

  const featuredList = products.filter((p) => p.featured);
  const featured = (featuredList.length ? featuredList : products).slice(0, 8);
  const freeShipFrom = Number(C.freeShipFrom || 500);
  const heroImages = (C.heroImages && C.heroImages.length ? C.heroImages : (C.heroImage ? [C.heroImage] : []));

  const goCat = (c) => { setCatFilter(c); go("catalog"); };

  return (
    <div>
      {/* HERO */}
      <section className="r-hero" style={css("position:relative;width:100%;margin-bottom:0;min-height:clamp(340px,62vw,580px);max-height:580px;")}>
        <HeroSlider images={heroImages}>
          <div className="r-hero-badge" style={css("position:absolute;top:var(--sp-5);right:var(--sp-5);background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border-radius:var(--r-pill);padding:10px 22px;font-size:14.5px;font-weight:600;color:var(--c-accent);letter-spacing:.05em;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.08);z-index:2;")}>{C.heroBadge}</div>
          <div className="r-hero-cta" style={css("position:absolute;bottom:var(--sp-5);right:var(--sp-5);z-index:2;")}>
            <button onClick={() => go("catalog")} className="btn btn-primary" style={css("padding:16px 38px;font-size:16.5px;box-shadow:0 12px 34px rgba(0,0,0,.22);")}>{C.heroCtaLabel}</button>
          </div>
        </HeroSlider>
      </section>

      {/* TRUST STRIP */}
      <section style={css("background:var(--c-accent-soft);border-bottom:1px solid var(--c-line);")}>
        <div className="container" style={css("padding:var(--sp-3) var(--sp-4);display:flex;flex-wrap:wrap;justify-content:center;gap:10px var(--sp-6);text-align:center;")}>
          {TRUST_ITEMS.map((t) => (
            <span key={t} style={css("font-size:13px;font-weight:600;color:var(--c-accent-dark);white-space:nowrap;")}>{t}</span>
          ))}
          <span style={css("font-size:13px;font-weight:600;color:var(--c-accent-dark);white-space:nowrap;")}>✓ משלוח חינם מעל {fmt(freeShipFrom)}</span>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container grid-4" style={css("padding-block:var(--sp-6);")}>
        {cats.map((c) => (
          <div key={c} onClick={() => goCat(c)} className="tap-target" style={css("cursor:pointer;text-align:center;")}>
            <div style={thumb(null, GRAD_CARD, "aspect-ratio:4/5;margin-bottom:13px;box-shadow:var(--shadow-sm);")}>
              <Disc style="width:44%;aspect-ratio:1;" />
            </div>
            <div style={css("font-size:15px;font-weight:600;")}>{c}</div>
          </div>
        ))}
      </section>

      {/* FEATURED */}
      <section className="container" style={css("padding-block:var(--sp-6);")}>
        <div style={css("display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:var(--sp-6);flex-wrap:wrap;gap:12px;")}>
          <div>
            <div className="eyebrow" style={css("margin-bottom:8px;")}>{C.featuredKicker}</div>
            <h2 className="title-h2" style={css("font-size:var(--fs-h1);")}>{C.featuredTitle}</h2>
          </div>
          <span onClick={() => go("catalog")} style={css("cursor:pointer;font-size:15px;color:var(--c-ink-mute);border-bottom:1px solid var(--c-gold);padding-bottom:2px;")}>לכל המוצרים ←</span>
        </div>
        <CardSlider>
          {featured.map((p) => (
            <div key={p.id} onClick={() => openProduct(p.id)} style={css("cursor:pointer;width:clamp(155px,40vw,230px);")}>
              <div style={thumb(p.image, GRAD_CARD, "aspect-ratio:4/5;margin-bottom:0;box-shadow:var(--shadow-sm);")}>
                {!p.image && <Disc style="width:48%;aspect-ratio:1;" />}
                <span style={css("position:absolute;top:10px;right:10px;background:#fff;font-size:11px;padding:4px 9px;border-radius:var(--r-pill);color:#8a6a58;letter-spacing:.03em;")}>{p.category}</span>
                {Number(p.stock) === 0 && <span style={css("position:absolute;top:10px;left:10px;background:var(--c-danger-bg);color:var(--c-danger);font-size:10.5px;font-weight:700;padding:4px 9px;border-radius:var(--r-pill);")}>אזל במלאי</span>}
                {p.featured && <span style={css("position:absolute;bottom:10px;right:10px;background:var(--c-gold);color:#fff;font-size:10.5px;font-weight:700;padding:4px 10px;border-radius:var(--r-pill);letter-spacing:.03em;")}>נבחרת</span>}
              </div>
              <div style={css("font-family:var(--font-serif);font-size:17px;margin-bottom:4px;margin-top:12px;")}>{p.name}</div>
              <div style={css("font-size:15px;color:var(--c-accent);font-weight:600;")}>{fmt(p.price)}</div>
            </div>
          ))}
        </CardSlider>
      </section>

      {/* STORY TEASER */}
      <section style={css("background:var(--c-line-soft);margin-top:var(--sp-5);position:relative;overflow:hidden;")}>
        <div className="container r-split" style={css("padding-block:70px;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;")}>
          <div style={css(`aspect-ratio:16/11;border-radius:var(--r-lg);position:relative;overflow:hidden;background:url(${C.storyImage || "floral-bg.jpg"}) center/cover;`)}>
            <div style={css("position:absolute;inset:0;background:radial-gradient(circle at 75% 80%,rgba(255,255,255,.4),transparent 40%);")} />
          </div>
          <div>
            <FlowerMark width={130} height={48} style={{ marginBottom: 22 }} />
            <h2 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);line-height:1.1;margin-bottom:var(--sp-4);")}>{C.aboutTitle}</h2>
            <p style={css("font-size:16.5px;color:var(--c-ink-soft);margin-bottom:var(--sp-4);")}>{C.aboutText}</p>
            <button onClick={() => go("catalog")} className="btn btn-primary" style={css("margin-top:10px;")}>גלו את הקולקציה</button>
          </div>
        </div>
      </section>
    </div>
  );
}
