import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { FlowerMark, Disc } from "../components/Ornaments.jsx";
import { useStore } from "../context/StoreContext.jsx";

const BASE_CATS = ["טבעות", "שרשראות", "עגילים", "צמידים"];

export function Home() {
  const { content: C, products, go, openProduct, setCatFilter } = useStore();

  const cats = BASE_CATS.filter((c) => products.some((p) => p.category === c)).length
    ? BASE_CATS
    : Array.from(new Set(products.map((p) => p.category)));

  const featuredList = products.filter((p) => p.featured).slice(0, 4);
  const featured = featuredList.length ? featuredList : products.slice(0, 4);

  const goCat = (c) => { setCatFilter(c); go("catalog"); };

  return (
    <div>
      {/* HERO */}
      <section className="r-hero" style={css("position:relative;width:100%;margin-bottom:14px;height:580px;")}>
        {C.heroImage ? (
          <div style={css(`width:100%;height:100%;background:url("${C.heroImage}") center/cover;display:block;`)} />
        ) : (
          <div style={css("display:block;width:100%;height:100%;background:radial-gradient(120% 100% at 50% 25%,#f3e8dd,#ecd9c8);")} />
        )}
        <div className="r-hero-badge" style={css("position:absolute;top:26px;right:32px;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border-radius:100px;padding:10px 22px;font-size:14.5px;font-weight:600;color:#bd7355;letter-spacing:.05em;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.08);")}>{C.heroBadge}</div>
        <div className="r-hero-cta" style={css("position:absolute;bottom:32px;right:32px;")}>
          <button onClick={() => go("catalog")} style={css("padding:16px 38px;background:#bd7355;color:#fff;border:none;border-radius:12px;font-size:16.5px;font-weight:600;cursor:pointer;box-shadow:0 12px 34px rgba(0,0,0,.22);")}>{C.heroCtaLabel}</button>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="r-container r-grid4" style={css("max-width:1240px;margin:0 auto;padding:34px 32px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px;")}>
        {cats.map((c) => (
          <div key={c} onClick={() => goCat(c)} style={css("cursor:pointer;text-align:center;")}>
            <div style={css("aspect-ratio:1;background:radial-gradient(110% 100% at 50% 30%,#f3e8dd,#ecd9c8);border-radius:14px;margin-bottom:13px;display:flex;align-items:center;justify-content:center;")}>
              <div style={css("width:40%;aspect-ratio:1;border-radius:50%;background:conic-gradient(from 180deg,#f3ece4,#d8cabb,#f7f2ec,#ceccc8,#f3ece4);box-shadow:inset 0 2px 8px rgba(0,0,0,.14);")} />
            </div>
            <div style={css("font-size:16px;font-weight:600;")}>{c}</div>
          </div>
        ))}
      </section>

      {/* FEATURED */}
      <section className="r-container" style={css("max-width:1240px;margin:0 auto;padding:46px 32px;")}>
        <div style={css("display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:30px;flex-wrap:wrap;gap:12px;")}>
          <div>
            <div style={css("font-size:13px;letter-spacing:.2em;color:#bd7355;margin-bottom:8px;")}>{C.featuredKicker}</div>
            <h2 className="r-title-lg" style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:36px;")}>{C.featuredTitle}</h2>
          </div>
          <span onClick={() => go("catalog")} style={css("cursor:pointer;font-size:15px;color:#8a766a;border-bottom:1px solid #d6bda9;padding-bottom:2px;")}>לכל המוצרים ←</span>
        </div>
        <div className="r-grid4" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:24px;")}>
          {featured.map((p) => (
            <div key={p.id} onClick={() => openProduct(p.id)} style={css("cursor:pointer;")}>
              <div style={thumb(p.image, GRAD_CARD, "aspect-ratio:4/5;margin-bottom:0;box-shadow:0 12px 28px rgba(140,90,60,.08);")}>
                {!p.image && <Disc style="width:48%;aspect-ratio:1;box-shadow:0 10px 24px rgba(0,0,0,.14),inset 0 2px 8px rgba(0,0,0,.12);" />}
                <span style={css("position:absolute;top:12px;right:12px;background:#fff;font-size:11.5px;padding:5px 10px;border-radius:100px;color:#8a6a58;letter-spacing:.03em;")}>{p.category}</span>
              </div>
              <div style={css("font-family:'Frank Ruhl Libre',serif;font-size:18px;margin-bottom:4px;margin-top:14px;")}>{p.name}</div>
              <div style={css("font-size:15px;color:#8a766a;")}>{fmt(p.price)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* STORY TEASER */}
      <section style={css("background:#f3e8dd;margin-top:30px;position:relative;overflow:hidden;")}>
        <div className="r-container r-split" style={css("max-width:1240px;margin:0 auto;padding:70px 32px;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;")}>
          <div style={css(`aspect-ratio:16/11;border-radius:18px;position:relative;overflow:hidden;background:url(${C.storyImage || "floral-bg.jpg"}) center/cover;`)}>
            <div style={css("position:absolute;inset:0;background:radial-gradient(circle at 75% 80%,rgba(255,255,255,.4),transparent 40%);")} />
          </div>
          <div>
            <FlowerMark width={130} height={48} style={{ marginBottom: 22 }} />
            <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:300;font-size:42px;line-height:1.1;margin-bottom:20px;")}>{C.aboutTitle}</h2>
            <p style={css("font-size:16.5px;color:#6e5648;margin-bottom:16px;")}>{C.aboutText}</p>
            <button onClick={() => go("catalog")} style={css("margin-top:10px;padding:13px 28px;background:#bd7355;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;")}>גלו את הקולקציה</button>
          </div>
        </div>
      </section>
    </div>
  );
}
