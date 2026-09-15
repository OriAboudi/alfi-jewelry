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
    <div className="r-container glass-card" style={css("max-width:1240px;margin:30px auto;padding:46px var(--sp-5) 64px;")}>
      <div style={css("text-align:center;margin-bottom:var(--sp-6);")}>
        <div className="eyebrow" style={css("margin-bottom:12px;")}>❀ קולקציות</div>
        <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-display);margin-bottom:14px;")}>העולמות של ALFI</h1>
        <p style={css("font-size:16.5px;color:var(--c-ink-soft);max-width:560px;margin:0 auto;")}>כל קולקציה היא סיפור — אוסף תכשיטים שנולדו מאותה השראה.</p>
      </div>
      <div className="grid-3">
        {collections.map((col) => (
          <div key={col.id} onClick={() => openCollection(col)} className="card" style={css("cursor:pointer;overflow:hidden;background:#fff;border:none;box-shadow:var(--shadow-md);transition:transform var(--dur) var(--ease);")}>
            <div style={thumb(col.image, GRAD_COVER, "aspect-ratio:4/3;position:relative;")}>
              {!col.image && <Disc style="width:40%;aspect-ratio:1;" />}
              <span style={css("position:absolute;bottom:14px;right:16px;background:rgba(255,255,255,.92);font-size:12px;font-weight:600;padding:5px 12px;border-radius:var(--r-pill);color:var(--c-accent);")}>{col.subtitle}</span>
            </div>
            <div style={css("padding:22px 22px 26px;")}>
              <h2 style={css("font-family:var(--font-serif);font-size:22px;margin-bottom:8px;")}>{col.title}</h2>
              <p style={css("font-size:14.5px;color:var(--c-ink-soft);margin-bottom:16px;line-height:1.6;")}>{col.description}</p>
              <span style={css("font-size:14px;color:var(--c-accent);font-weight:700;")}>לצפייה בקולקציה ←</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
