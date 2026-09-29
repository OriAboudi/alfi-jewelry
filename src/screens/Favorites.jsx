import React from "react";
import { css } from "../lib/css.js";
import { RedesignProductCard } from "../components/RedesignProductCard.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useSeoTags } from "../hooks/useSeoTags.js";
import { SkeletonCard, LoadingLabel } from "../components/Skeleton.jsx";

export function Favorites() {
  const { products, favorites, go, loaded, customer, authReady, openAuth } = useStore();
  useSeoTags({ title: "המועדפים שלי · ALFI", noindex: true });
  const list = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="r-container glass-card" style={css("max-width:1240px;margin:30px auto;padding:30px var(--sp-5) 64px;")}>
      <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:var(--sp-5);")}>המועדפים שלי</h1>
      {authReady && !customer && favorites.length > 0 && (
        <p style={css("font-size:14px;color:var(--c-ink-mute);margin:-8px 0 var(--sp-5);")}>
          המועדפים שמורים במכשיר הזה.{" "}
          <button type="button" onClick={() => openAuth()} style={css("background:none;border:0;padding:0;font:inherit;color:var(--c-accent-dark);text-decoration:underline;cursor:pointer;min-height:var(--tap);")}>התחברי</button>
          {" "}כדי לראות אותם בכל מכשיר.
        </p>
      )}
      {!loaded && favorites.length > 0 ? (
        <div className="grid-4"><LoadingLabel />{favorites.slice(0, 4).map((id) => <SkeletonCard key={id} />)}</div>
      ) : list.length === 0 ? (
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
