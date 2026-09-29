import React from "react";
import { css } from "../lib/css.js";
import { buildSets } from "../lib/pricing.js";
import { useStore } from "../context/StoreContext.jsx";
import { useSeoTags } from "../hooks/useSeoTags.js";
import { SetCard } from "../components/SetCard.jsx";
import { SkeletonBlock, LoadingLabel } from "../components/Skeleton.jsx";

// /סטים — every product set as a stacked card; each opens its own page.
export function Sets() {
  const { products, content: C, go, loaded } = useStore();
  const sets = Object.values(buildSets(products, C));

  useSeoTags({
    title: "סטים של תכשיטי כסף · ALFI",
    description: "סטים של תכשיטי כסף סטרלינג 925 שנבחרו להיענד יחד, במחיר מיוחד לסט.",
    canonical: "/סטים",
  });

  return (
    <div className="r-container glass-card" style={css("max-width:1240px;margin:30px auto;padding:36px var(--sp-5) 56px;")}>
      <div style={css("text-align:center;margin-bottom:32px;")}>
        <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-display);margin:0;")}>סטים במחיר מיוחד</h1>
        <p style={css("margin:12px auto 0;max-width:520px;font-size:16px;line-height:1.7;color:var(--c-ink-soft);")}>
          תכשיטים שנבחרו להיענד יחד. כשכל פריטי הסט בעגלה, מחיר הסט מחושב אוטומטית.
        </p>
      </div>
      {!loaded ? (
        <div><LoadingLabel /><SkeletonBlock style="height:320px;border-radius:var(--r-lg);" /></div>
      ) : sets.length === 0 ? (
        <div style={css("text-align:center;padding:40px 0;color:var(--c-ink-mute);")}>
          עדיין אין סטים זמינים.{" "}
          <button type="button" onClick={() => go("catalog")} style={css("background:none;border:0;padding:0;font:inherit;color:var(--c-accent-dark);text-decoration:underline;cursor:pointer;")}>לכל התכשיטים</button>
        </div>
      ) : (
        <div className="rd-sets-grid">
          {sets.map((s) => <SetCard key={s.name} set={s} />)}
        </div>
      )}
    </div>
  );
}
