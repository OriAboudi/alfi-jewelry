import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { FlowerMark, Disc } from "../components/Ornaments.jsx";
import { useStore } from "../context/StoreContext.jsx";

const BASE_CATS = ["טבעות", "שרשראות", "עגילים", "צמידים"];
const TRUST_ITEMS = ["✓ כסף סטרלינג 925 אמיתי", "✓ עבודת יד באולפן שלנו", "✓ אריזת מתנה בכל הזמנה"];

export function Home() {
  const { content: C, products, go, openProduct, setCatFilter } = useStore();

  const cats = BASE_CATS.filter((c) => products.some((p) => p.category === c)).length
    ? BASE_CATS
    : Array.from(new Set(products.map((p) => p.category)));

  const featuredList = products.filter((p) => p.featured).slice(0, 4);
  const featured = featuredList.length ? featuredList : products.slice(0, 4);
  const freeShipFrom = Number(C.freeShipFrom || 500);

  const goCat = (c) => { setCatFilter(c); go("catalog"); };

  return (
    <div>
      {/* HERO */}
      <section className="r-hero" style={css("position:relative;width:100%;margin-bottom:0;min-height:clamp(340px,62vw,580px);max-height:580px;")}>
        {C.heroImage ? (
          <div style={css(`width:100%;height:100%;position:absolute;inset:0;background:url("${C.heroImage}") center/cover;`)} />
        ) : (
          <div style={css("position:absolute;inset:0;background:radial-gradient(120% 100% at 50% 25%,#f3e8dd,#ecd9c8);")} />
        )}
        <div className="r-hero-badge" style={css("position:absolute;top:var(--sp-5);right:var(--sp-5);background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border-radius:var(--r-pill);padding:10px 22px;font-size:14.5px;font-weight:600;color:var(--c-accent);letter-spacing:.05em;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.08);")}>{C.heroBadge}</div>
        <div className="r-hero-cta" style={css("position:absolute;bottom:var(--sp-5);right:var(--sp-5);")}>
          <button onClick={() => go("catalog")} className="btn btn-primary" style={css("padding:16px 38px;font-size:16.5px;box-shadow:0 12px 34px rgba(0,0,0,.22);")}>{C.heroCtaLabel}</button>
        </div>
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
            <div style={css("aspect-ratio:1;background:radial-gradient(110% 100% at 50% 30%,#f3e8dd,#ecd9c8);border-radius:var(--r-lg);margin-bottom:13px;display:flex;align-items:center;justify-content:center;transition:box-shadow var(--dur) var(--ease);")}>
              <div style={css("width:40%;aspect-ratio:1;border-radius:50%;background:conic-gradient(from 180deg,#f3ece4,#d8cabb,#f7f2ec,#ceccc8,#f3ece4);box-shadow:inset 0 2px 8px rgba(0,0,0,.14);")} />
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
          <span onClick={() => go("catalog")} style={css("cursor:pointer;font-size:15px;color:var(--c-ink-mute);border-bottom:1px solid #d6bda9;padding-bottom:2px;")}>לכל המוצרים ←</span>
        </div>
        <div className="grid-4">
          {featured.map((p) => (
            <div key={p.id} onClick={() => openProduct(p.id)} style={css("cursor:pointer;")}>
              <div style={thumb(p.image, GRAD_CARD, "aspect-ratio:4/5;margin-bottom:0;box-shadow:var(--shadow-sm);")}>
                {!p.image && <Disc style="width:48%;aspect-ratio:1;box-shadow:0 10px 24px rgba(0,0,0,.14),inset 0 2px 8px rgba(0,0,0,.12);" />}
                <span style={css("position:absolute;top:12px;right:12px;background:#fff;font-size:11.5px;padding:5px 10px;border-radius:var(--r-pill);color:#8a6a58;letter-spacing:.03em;")}>{p.category}</span>
                {Number(p.stock) === 0 && <span style={css("position:absolute;top:12px;left:12px;background:var(--c-danger-bg);color:var(--c-danger);font-size:11px;font-weight:700;padding:5px 10px;border-radius:var(--r-pill);")}>אזל במלאי</span>}
              </div>
              <div style={css("font-family:var(--font-serif);font-size:18px;margin-bottom:4px;margin-top:14px;")}>{p.name}</div>
              <div style={css("font-size:15px;color:var(--c-ink-mute);")}>{fmt(p.price)}</div>
            </div>
          ))}
        </div>
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
