import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { Disc } from "../components/Ornaments.jsx";
import { useStore } from "../context/StoreContext.jsx";

const BASE_CATS = ["טבעות", "שרשראות", "עגילים", "צמידים"];

export function Catalog() {
  const { products, catFilter, setCatFilter, openProduct } = useStore();

  const cats = BASE_CATS.filter((c) => products.some((p) => p.category === c)).length
    ? BASE_CATS
    : Array.from(new Set(products.map((p) => p.category)));

  const list = catFilter === "הכל" ? products : products.filter((p) => p.category === catFilter);

  return (
    <div className="r-container" style={css("max-width:1240px;margin:30px auto;padding:46px 40px 64px;background:rgba(250,245,239,.74);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);border-radius:22px;box-shadow:0 24px 70px rgba(70,50,40,.12);")}>
      <div style={css("text-align:center;margin-bottom:40px;")}>
        <div style={css("font-size:13.5px;letter-spacing:.22em;color:#bd7355;margin-bottom:12px;")}>❀ קטלוג</div>
        <h1 className="r-title-lg" style={css("font-family:'Frank Ruhl Libre',serif;font-weight:300;font-size:46px;")}>כל התכשיטים</h1>
      </div>
      <div className="r-sidebar-grid" style={css("display:grid;grid-template-columns:230px 1fr;gap:46px;align-items:start;")}>
        <aside className="r-sticky" style={css("position:sticky;top:100px;")}>
          <div style={css("font-size:13px;font-weight:700;letter-spacing:.06em;color:#8a766a;margin-bottom:14px;")}>קטגוריות</div>
          <div style={css("display:flex;flex-direction:column;gap:11px;margin-bottom:30px;font-size:15px;")}>
            <span onClick={() => setCatFilter("הכל")} style={css(`cursor:pointer;font-weight:${catFilter === "הכל" ? 700 : 600};color:${catFilter === "הכל" ? "#bd7355" : "#6e5648"};`)}>הכל</span>
            {cats.map((c) => (
              <span key={c} onClick={() => setCatFilter(c)} style={css(`cursor:pointer;font-weight:${catFilter === c ? 700 : 400};color:${catFilter === c ? "#bd7355" : "#6e5648"};`)}>{c}</span>
            ))}
          </div>
          <div style={css("font-size:13px;font-weight:700;letter-spacing:.06em;color:#8a766a;margin-bottom:14px;")}>חומר</div>
          <div style={css("display:flex;flex-direction:column;gap:11px;font-size:15px;color:#6e5648;")}>
            <span style={css("cursor:pointer;")}>כסף 925</span>
            <span style={css("cursor:pointer;")}>כסף + זירקון</span>
            <span style={css("cursor:pointer;")}>כסף מוזהב</span>
          </div>
        </aside>
        <div>
          <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #ecdccd;")}>
            <span style={css("font-size:14.5px;color:#8a766a;")}>{products.length} מוצרים</span>
            <span style={css("font-size:14.5px;color:#6e5648;cursor:pointer;")}>מיון: מומלצים ▾</span>
          </div>
          <div className="r-grid3" style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:24px;")}>
            {list.map((p) => (
              <div key={p.id} onClick={() => openProduct(p.id)} style={css("cursor:pointer;")}>
                <div style={thumb(p.image, GRAD_CARD, "aspect-ratio:4/5;margin-bottom:0;box-shadow:0 12px 28px rgba(140,90,60,.08);")}>
                  {!p.image && <Disc style="width:48%;aspect-ratio:1;box-shadow:0 10px 24px rgba(0,0,0,.14),inset 0 2px 8px rgba(0,0,0,.12);" />}
                  <span style={css("position:absolute;top:12px;right:12px;background:#fff;font-size:11.5px;padding:5px 10px;border-radius:100px;color:#8a6a58;")}>{p.category}</span>
                </div>
                <div style={css("display:flex;justify-content:space-between;align-items:baseline;margin-top:14px;")}>
                  <div style={css("font-family:'Frank Ruhl Libre',serif;font-size:18px;")}>{p.name}</div>
                  <div style={css("font-size:15px;color:#8a766a;")}>{fmt(p.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
