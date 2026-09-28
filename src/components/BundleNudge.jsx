import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";

/**
 * BundleNudge — cart prompt for the "N for ₪X" deal. When the cart has some
 * deal items but not a full set, it says how many more are needed and
 * offers deal products to add in one tap. When a set is complete it
 * confirms the deal is applied.
 */
export function BundleNudge({ eligible, missing, sets, discount, size, price, products, cartIds, onAdd, onOpen }) {
  if (!eligible) return null;
  if (!missing) {
    if (!(discount > 0)) return null; // set complete but already cheaper than the deal price
    return (
      <div role="status" style={css("margin-top:18px;padding:14px 16px;border-radius:var(--r-md);background:var(--c-success-bg);color:var(--c-success);font-size:14.5px;font-weight:600;")}>
        מבצע {size} ב־{fmt(price)} הופעל{sets > 1 ? ` (×${sets})` : ""} ✓
      </div>
    );
  }
  // Suggest in-stock deal pieces, ones not already in the cart first.
  const inStock = products.filter((p) => p.in_bundle && Number(p.stock) > 0);
  const picks = [...inStock.filter((p) => !cartIds.has(String(p.id))), ...inStock.filter((p) => cartIds.has(String(p.id)))].slice(0, 8);
  return (
    <div role="status" style={css("margin-top:18px;padding:16px;border-radius:var(--r-md);border:1.5px dashed var(--c-accent);background:rgba(255,255,255,.55);")}>
      <div style={css("font-size:15px;color:var(--c-ink);line-height:1.5;")}>
        <strong>עוד {missing === 1 ? "תכשיט אחד" : `${missing} תכשיטים`}</strong> מהמבצע וההזמנה נכנסת ל־<strong>{size} ב־{fmt(price)}</strong>
      </div>
      {picks.length > 0 && (
        <ul className="no-scrollbar" style={css("list-style:none;margin:12px -16px 0;padding:0 16px 2px;display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;")}>
          {picks.map((p) => (
            <li key={p.id} style={css("flex:none;width:118px;scroll-snap-align:start;display:flex;flex-direction:column;gap:6px;")}>
              <button type="button" onClick={() => onOpen(p.id)} aria-label={p.name} style={css("padding:0;border:0;background:#fff;aspect-ratio:1/1;overflow:hidden;cursor:pointer;")}>
                {p.image && <img src={p.image} alt="" loading="lazy" style={css("width:100%;height:100%;object-fit:cover;display:block;")} />}
              </button>
              <div style={css("font-size:13px;line-height:1.25;color:var(--c-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;")}>{p.name}</div>
              <button type="button" onClick={() => onAdd(p)} className="tap-target" style={css("height:34px;border:1px solid var(--ink);background:transparent;font:inherit;font-size:13px;color:var(--ink);cursor:pointer;")}>הוספה · {fmt(p.price)}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
