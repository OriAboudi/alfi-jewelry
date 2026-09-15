import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { Disc } from "../components/Ornaments.jsx";
import { useStore } from "../context/StoreContext.jsx";

const BASE_CATS = ["טבעות", "שרשראות", "עגילים", "צמידים"];
const BASE_MATERIALS = ["כסף 925", "כסף + זירקון", "כסף מוזהב"];
const SORTS = [
  ["featured", "מומלצים"],
  ["price-asc", "מחיר: נמוך לגבוה"],
  ["price-desc", "מחיר: גבוה לנמוך"],
  ["new", "חדש ביותר"],
];

export function Catalog() {
  const { products, catFilter, setCatFilter, openProduct } = useStore();
  const [matFilter, setMatFilter] = React.useState("הכל");
  const [sortBy, setSortBy] = React.useState("featured");
  const [sortOpen, setSortOpen] = React.useState(false);

  const cats = BASE_CATS.filter((c) => products.some((p) => p.category === c)).length
    ? BASE_CATS
    : Array.from(new Set(products.map((p) => p.category)));
  const materials = BASE_MATERIALS.filter((m) => products.some((p) => p.material === m)).length
    ? BASE_MATERIALS
    : Array.from(new Set(products.map((p) => p.material))).filter(Boolean);

  let list = catFilter === "הכל" ? products : products.filter((p) => p.category === catFilter);
  if (matFilter !== "הכל") list = list.filter((p) => p.material === matFilter);
  list = list.slice().sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "new") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  const sortLabel = SORTS.find(([k]) => k === sortBy)[1];

  return (
    <div className="r-container container glass-card" style={css("max-width:1240px;margin:30px auto;padding:46px var(--sp-5) 64px;")}>
      <div style={css("text-align:center;margin-bottom:var(--sp-6);")}>
        <div className="eyebrow" style={css("margin-bottom:12px;")}>❀ קטלוג</div>
        <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-display);")}>כל התכשיטים</h1>
      </div>
      <div className="r-sidebar-grid" style={css("display:grid;grid-template-columns:230px 1fr;gap:46px;align-items:start;")}>
        <aside className="r-sticky" style={css("position:sticky;top:100px;")}>
          <div style={css("font-size:13px;font-weight:700;letter-spacing:.06em;color:var(--c-ink-mute);margin-bottom:14px;")}>קטגוריות</div>
          <div style={css("display:flex;flex-direction:column;gap:11px;margin-bottom:var(--sp-6);font-size:15px;")}>
            <span onClick={() => setCatFilter("הכל")} className="tap-target" style={css(`cursor:pointer;font-weight:${catFilter === "הכל" ? 700 : 600};color:${catFilter === "הכל" ? "var(--c-accent)" : "var(--c-ink-soft)"};`)}>הכל</span>
            {cats.map((c) => (
              <span key={c} onClick={() => setCatFilter(c)} className="tap-target" style={css(`cursor:pointer;font-weight:${catFilter === c ? 700 : 400};color:${catFilter === c ? "var(--c-accent)" : "var(--c-ink-soft)"};`)}>{c}</span>
            ))}
          </div>
          <div style={css("font-size:13px;font-weight:700;letter-spacing:.06em;color:var(--c-ink-mute);margin-bottom:14px;")}>חומר</div>
          <div style={css("display:flex;flex-direction:column;gap:11px;font-size:15px;")}>
            <span onClick={() => setMatFilter("הכל")} className="tap-target" style={css(`cursor:pointer;font-weight:${matFilter === "הכל" ? 700 : 400};color:${matFilter === "הכל" ? "var(--c-accent)" : "var(--c-ink-soft)"};`)}>הכל</span>
            {materials.map((m) => (
              <span key={m} onClick={() => setMatFilter(m)} className="tap-target" style={css(`cursor:pointer;font-weight:${matFilter === m ? 700 : 400};color:${matFilter === m ? "var(--c-accent)" : "var(--c-ink-soft)"};`)}>{m}</span>
            ))}
          </div>
        </aside>
        <div>
          <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-5);padding-bottom:16px;border-bottom:1px solid var(--c-line);position:relative;")}>
            <span style={css("font-size:14.5px;color:var(--c-ink-mute);")}>{list.length} מוצרים</span>
            <div style={css("position:relative;")}>
              <span onClick={() => setSortOpen((v) => !v)} className="tap-target" style={css("font-size:14.5px;color:var(--c-ink-soft);cursor:pointer;display:flex;align-items:center;gap:4px;")}>מיון: {sortLabel} ▾</span>
              {sortOpen && (
                <div onMouseLeave={() => setSortOpen(false)} style={css("position:absolute;left:0;top:100%;margin-top:6px;background:#fff;border:1px solid var(--c-line);border-radius:var(--r-md);box-shadow:var(--shadow-md);overflow:hidden;z-index:10;min-width:180px;")}>
                  {SORTS.map(([k, label]) => (
                    <div key={k} onClick={() => { setSortBy(k); setSortOpen(false); }} style={css(`padding:12px 16px;font-size:14px;cursor:pointer;color:${sortBy === k ? "var(--c-accent)" : "var(--c-ink)"};font-weight:${sortBy === k ? 700 : 400};`)}>{label}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {list.length === 0 ? (
            <div className="card" style={css("padding:60px 20px;text-align:center;color:var(--c-ink-mute);")}>לא נמצאו מוצרים בסינון הזה.</div>
          ) : (
            <div className="grid-3">
              {list.map((p) => (
                <div key={p.id} onClick={() => openProduct(p.id)} style={css("cursor:pointer;")}>
                  <div style={thumb(p.image, GRAD_CARD, "aspect-ratio:4/5;margin-bottom:0;box-shadow:var(--shadow-sm);")}>
                    {!p.image && <Disc style="width:48%;aspect-ratio:1;box-shadow:0 10px 24px rgba(0,0,0,.14),inset 0 2px 8px rgba(0,0,0,.12);" />}
                    <span style={css("position:absolute;top:12px;right:12px;background:#fff;font-size:11.5px;padding:5px 10px;border-radius:var(--r-pill);color:#8a6a58;")}>{p.category}</span>
                    {Number(p.stock) === 0 && <span style={css("position:absolute;top:12px;left:12px;background:var(--c-danger-bg);color:var(--c-danger);font-size:11px;font-weight:700;padding:5px 10px;border-radius:var(--r-pill);")}>אזל במלאי</span>}
                  </div>
                  <div style={css("display:flex;justify-content:space-between;align-items:baseline;margin-top:14px;")}>
                    <div style={css("font-family:var(--font-serif);font-size:18px;")}>{p.name}</div>
                    <div style={css("font-size:15px;color:var(--c-accent);font-weight:600;")}>{fmt(p.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
