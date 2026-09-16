import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { Disc } from "../components/Ornaments.jsx";
import { HeroSlider } from "../components/HeroSlider.jsx";
import { CardSlider } from "../components/CardSlider.jsx";
import { ProductCard } from "../components/ProductCard.jsx";
import { useStore } from "../context/StoreContext.jsx";

const BASE_CATS = ["טבעות", "שרשראות", "עגילים", "צמידים", "אקססוריז"];
const TRUST_ITEMS = ["✓ כסף סטרלינג 925 אמיתי", "✓ עבודת יד באולפן שלנו", "✓ אריזת מתנה בכל הזמנה"];

export function Home() {
  const { content: C, products, go, setCatFilter } = useStore();
  const [openFaq, setOpenFaq] = React.useState(null);

  const cats = BASE_CATS.filter((c) => products.some((p) => p.category === c)).length
    ? BASE_CATS
    : Array.from(new Set(products.map((p) => p.category)));

  const featuredList = products.filter((p) => p.featured);
  const featured = (featuredList.length ? featuredList : products).slice(0, 8);
  const freeShipFrom = Number(C.freeShipFrom || 500);
  const heroImages = (C.heroImages && C.heroImages.length ? C.heroImages : (C.heroImage ? [C.heroImage] : []));

  const goCat = (c) => { setCatFilter(c); go("catalog"); };

  const FAQ_ITEMS = [
    { q: "מה זה כסף 925?", a: "כסף סטרלינג 925 הוא כסף טהור בשילוב סגסוגת עדינה שמעניקה לו חוזק — כל תכשיט נוצר ומלוטש ביד באולפן שלנו." },
    { q: "איך בוחרים מידה?", a: "בעמוד כל מוצר אפשר לבחור מידה מתוך האפשרויות הזמינות. לא בטוחים באיזו מידה מתאימה? אפשר לפנות אלינו ונשמח לעזור." },
    { q: "איך שומרים על התכשיט?", a: "יש להימנע ממגע עם מים, בשמים וכימיקלים, ולאחסן בנפרד בשקית סגורה הרחק מאור שמש ישיר." },
    { q: "מה מדיניות ההחזרות?", a: `ניתן להחזיר תוך 14 יום מקבלת המשלוח, באריזה המקורית. משלוח חינם בהזמנה מעל ${fmt(freeShipFrom)}.` },
  ];

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
      <section style={css("background:var(--c-line-soft);border-bottom:1px solid var(--c-line);")}>
        <div className="container" style={css("padding:var(--sp-3) var(--sp-4);display:flex;flex-wrap:wrap;justify-content:center;gap:10px var(--sp-6);text-align:center;")}>
          {TRUST_ITEMS.map((t) => (
            <span key={t} style={css("font-size:13px;font-weight:600;color:var(--c-accent-dark);white-space:nowrap;")}>{t}</span>
          ))}
          <span style={css("font-size:13px;font-weight:600;color:var(--c-accent-dark);white-space:nowrap;")}>✓ משלוח חינם מעל {fmt(freeShipFrom)}</span>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container" style={css("padding-block:var(--sp-6);")}>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--sp-4);")}>
          {cats.map((c) => (
            <div key={c} onClick={() => goCat(c)} className="tap-target hover-lift" style={css("cursor:pointer;text-align:center;")}>
              <div style={thumb(null, GRAD_CARD, "aspect-ratio:4/5;margin-bottom:13px;box-shadow:var(--shadow-sm);")}>
                <Disc style="width:44%;aspect-ratio:1;" />
              </div>
              <div style={css("font-size:15.5px;font-weight:700;")}>{c}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container" style={css("padding-block:var(--sp-6);")}>
        <div style={css("display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:var(--sp-6);flex-wrap:wrap;gap:12px;")}>
          <div>
            <div className="eyebrow" style={css("margin-bottom:8px;")}>{C.featuredKicker}</div>
            <h2 className="title-h2" style={css("font-size:var(--fs-h1);")}>{C.featuredTitle}</h2>
          </div>
          <span onClick={() => go("catalog")} style={css("cursor:pointer;font-size:15px;color:var(--c-ink-mute);border-bottom:1px solid var(--c-accent);padding-bottom:2px;")}>לכל המוצרים ←</span>
        </div>
        <CardSlider>
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} width="clamp(155px,40vw,230px)" />
          ))}
        </CardSlider>
      </section>

      {/* FAQ */}
      <section style={css("background:var(--c-line-soft);margin-top:var(--sp-5);")}>
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
