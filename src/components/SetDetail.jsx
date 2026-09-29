import React, { useState } from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";

/**
 * SetDetail — a product set "opened": each piece on its own (photo, name,
 * its own price, and a size picker where the piece comes in sizes), then the
 * set price vs. the separate total and one button that adds the whole set
 * with the chosen sizes. Used under the home sets slider (opens in place)
 * and on the /סטים page.
 */
export function SetDetail({ set, onClose, headingId }) {
  const { addToCart, openProduct } = useStore();
  const [sizes, setSizes] = useState(() => Object.fromEntries(set.members.map((m) => [m.id, (m.sizes && m.sizes[0]) || "יחיד"])));
  const [added, setAdded] = useState(false);
  const inStock = set.members.every((m) => Number(m.stock) > 0);
  const save = set.regular - set.price;

  const addAll = () => {
    if (!inStock) return;
    for (const m of set.members) addToCart(m.id, 1, sizes[m.id] || "יחיד");
    setAdded(true);
    setTimeout(() => setAdded(false), 2400);
  };

  return (
    <div className="rd-set-detail glass-strong">
      <div className="rd-set-detail-head">
        <div>
          <h3 id={headingId} className="serif" style={css("margin:0;font-weight:300;font-size:30px;line-height:1.1;")}>סט {set.name}</h3>
          <div style={css("margin-top:6px;font-size:14px;color:var(--text-body);")}>{set.members.length} פריטים שנבחרו להיענד יחד</div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="סגירת הסט" className="rd-set-close">×</button>
        )}
      </div>

      <ul className="rd-set-pieces">
        {set.members.map((m) => {
          const out = Number(m.stock) <= 0;
          const hasSizes = (m.sizes || []).length > 1;
          return (
            <li key={m.id} className="rd-set-piece">
              <button type="button" onClick={() => openProduct(m.id)} className="rd-set-piece-img" aria-label={`לעמוד המוצר ${m.name}`}>
                {m.image ? <img src={m.image} alt={m.name} loading="lazy" decoding="async" /> : null}
              </button>
              <div className="serif" style={css("font-size:17px;line-height:1.25;")}>{m.name}</div>
              <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px;")}>
                <span style={css("font-size:14px;color:var(--c-ink-mute);")}>{out ? "אזל במלאי" : `בנפרד ${fmt(m.price)}`}</span>
                {hasSizes && (
                  <label style={css("display:flex;align-items:center;gap:6px;font-size:13px;color:var(--c-ink-mute);")}>
                    מידה
                    <select value={sizes[m.id]} onChange={(e) => setSizes((s) => ({ ...s, [m.id]: e.target.value }))} style={css("font:inherit;font-size:14px;padding:4px 6px;border:1px solid var(--c-line-strong);background:#fff;color:var(--ink);")}>
                      {m.sizes.map((z) => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </label>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="rd-set-buy">
        <div style={css("display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;")}>
          <span style={css("font-size:13px;letter-spacing:.08em;color:var(--c-ink-mute);")}>מחיר הסט</span>
          <span style={css("font-size:26px;font-weight:700;color:var(--c-accent);")}>{fmt(set.price)}</span>
          {save > 0 && <s style={css("font-size:16px;color:var(--c-ink-mute);")}>{fmt(set.regular)}</s>}
          {save > 0 && <span style={css("font-size:13px;font-weight:600;color:var(--c-success);background:var(--c-success-bg);padding:3px 10px;border-radius:100px;")}>חיסכון {fmt(save)}</span>}
        </div>
        <button type="button" onClick={addAll} disabled={!inStock} className="rd-set-add">
          {!inStock ? "אחד הפריטים אזל" : added ? "✓ הסט נוסף לסל" : "הוספת הסט לסל"}
        </button>
      </div>
      <div aria-live="polite" style={css("position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);")}>{added ? "הסט נוסף לסל" : ""}</div>
    </div>
  );
}
