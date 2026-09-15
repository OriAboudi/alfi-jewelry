import React from "react";
import { css } from "../lib/css.js";
import { thumb, GRAD_COVER } from "../lib/ui.js";
import { Disc } from "../components/Ornaments.jsx";
import { useStore } from "../context/StoreContext.jsx";

export function Collections() {
  const { collections, go, setCatFilter } = useStore();

  const openCollection = (col) => {
    setCatFilter(col.category_filter || "הכל");
    go("catalog");
  };

  return (
    <div className="r-container" style={css("max-width:1240px;margin:30px auto;padding:46px 40px 64px;background:rgba(250,245,239,.74);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);border-radius:22px;box-shadow:0 24px 70px rgba(70,50,40,.12);")}>
      <div style={css("text-align:center;margin-bottom:42px;")}>
        <div style={css("font-size:13.5px;letter-spacing:.22em;color:#bd7355;margin-bottom:12px;")}>❀ קולקציות</div>
        <h1 className="r-title-lg" style={css("font-family:'Frank Ruhl Libre',serif;font-weight:300;font-size:46px;margin-bottom:14px;")}>העולמות של ALFI</h1>
        <p style={css("font-size:16.5px;color:#6e5648;max-width:560px;margin:0 auto;")}>כל קולקציה היא סיפור — אוסף תכשיטים שנולדו מאותה השראה.</p>
      </div>
      <div className="r-grid3" style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:28px;")}>
        {collections.map((col) => (
          <div key={col.id} onClick={() => openCollection(col)} style={css("cursor:pointer;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 14px 36px rgba(140,90,60,.1);transition:.2s;")}>
            <div style={thumb(col.image, GRAD_COVER, "aspect-ratio:4/3;position:relative;")}>
              {!col.image && <Disc style="width:40%;aspect-ratio:1;box-shadow:0 10px 24px rgba(0,0,0,.14),inset 0 2px 8px rgba(0,0,0,.12);" />}
              <span style={css("position:absolute;bottom:14px;right:16px;background:rgba(255,255,255,.92);font-size:12px;font-weight:600;padding:5px 12px;border-radius:100px;color:#bd7355;")}>{col.subtitle}</span>
            </div>
            <div style={css("padding:22px 22px 26px;")}>
              <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-size:24px;margin-bottom:8px;")}>{col.title}</h2>
              <p style={css("font-size:14.5px;color:#6e5648;margin-bottom:16px;line-height:1.6;")}>{col.description}</p>
              <span style={css("font-size:14px;color:#bd7355;font-weight:600;")}>לצפייה בקולקציה ←</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
