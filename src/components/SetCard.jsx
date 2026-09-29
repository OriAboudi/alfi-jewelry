import React, { useState } from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";

/**
 * SetCard — a product set in the home "סטים" slider: the members' photos
 * stacked like a fanned set, the set name and piece count, the set price
 * with the separate total struck through, and one button that puts every
 * piece in the cart (the set price then applies automatically).
 */
export function SetCard({ set }) {
  const { addToCart, openProduct } = useStore();
  const [added, setAdded] = useState(false);
  const stack = set.members.slice(0, 3);
  const inStock = set.members.every((m) => Number(m.stock) > 0);
  const save = set.regular - set.price;

  const addAll = () => {
    if (!inStock) return;
    for (const m of set.members) addToCart(m.id, 1, (m.sizes && m.sizes[0]) || "יחיד");
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  // Back-to-front: slight fan so every piece shows.
  const pose = [
    "transform:translate(-18%, 4%) rotate(-8deg);z-index:1;",
    "transform:translate(18%, 4%) rotate(7deg);z-index:2;",
    "transform:translate(0, -2%) rotate(0deg);z-index:3;",
  ].slice(-stack.length);

  return (
    <div className="rd-card glass-strong rd-set-card" style={css("display:flex;flex-direction:column;")}>
      <div className="rd-set-stack" aria-hidden="true">
        {stack.map((m, i) => (
          <button key={m.id} type="button" tabIndex={-1} onClick={() => openProduct(m.id)} className="rd-set-photo" style={css(pose[i])}>
            {m.image ? <img src={m.image} alt="" loading="lazy" decoding="async" /> : null}
          </button>
        ))}
        <span className="rd-set-count">{set.members.length} פריטים</span>
      </div>
      <div style={css("padding:0 8px;display:flex;flex-direction:column;gap:6px;margin-top:14px;")}>
        <span className="serif rd-card-name" style={css("line-height:1.25;")}>סט {set.name}</span>
        <span className="rd-card-meta" style={css("color:var(--text-muted);line-height:1.5;")}>
          {set.members.map((m, i) => (
            <React.Fragment key={m.id}>
              {i > 0 && " · "}
              <a href={`/מוצר/${m.id}`} onClick={(e) => { e.preventDefault(); openProduct(m.id); }} style={css("color:inherit;text-decoration:underline;text-decoration-color:rgba(58,45,61,.25);text-underline-offset:3px;")}>{m.name}</a>
            </React.Fragment>
          ))}
        </span>
        <span style={css("display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;")}>
          <span style={css("font-weight:700;color:var(--c-accent);font-size:17px;")}>{fmt(set.price)}</span>
          {save > 0 && <s style={css("color:var(--c-ink-mute);font-size:14px;")}>{fmt(set.regular)}</s>}
          {save > 0 && <span style={css("font-size:12px;font-weight:600;color:var(--c-success);")}>חיסכון {fmt(save)}</span>}
        </span>
      </div>
      <button
        type="button"
        onClick={addAll}
        disabled={!inStock}
        className="tap-target rd-add-btn rd-outline"
        style={css(`margin:10px 8px 8px;font:inherit;letter-spacing:.06em;cursor:${inStock ? "pointer" : "default"};opacity:${inStock ? 1 : .55};`)}
      >
        {!inStock ? "אזל במלאי" : added ? "✓ הסט נוסף לסל" : "הוספת הסט לסל"}
      </button>
    </div>
  );
}
