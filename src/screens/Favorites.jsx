import React from "react";
import { css } from "../lib/css.js";
import { RedesignProductCard } from "../components/RedesignProductCard.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useSeoTags } from "../hooks/useSeoTags.js";

export function Favorites() {
  const { products, favorites, go } = useStore();
  useSeoTags({ noindex: true });
  const list = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="r-container glass-card" style={css("max-width:1240px;margin:30px auto;padding:30px var(--sp-5) 64px;")}>
      <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:var(--sp-5);")}>המועדפים שלי</h1>
      {list.length === 0 ? (
        <div className="card" style={css("padding:60px 20px;text-align:center;color:var(--c-ink-mute);")}>
          <p style={css("margin-bottom:18px;")}>עדיין לא סימנת תכשיטים כמועדפים — לחצו על סמל הלב בכרטיס המוצר כדי להוסיף.</p>
          <button onClick={() => go("catalog")} className="btn btn-primary">לקטלוג</button>
        </div>
      ) : (
        <div className="grid-4">
          {list.map((p, i) => <RedesignProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
