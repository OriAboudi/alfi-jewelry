import React, { useState } from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { Disc } from "./Ornaments.jsx";
import { useStore } from "../context/StoreContext.jsx";

/**
 * ProductCard — shared card used on Home (featured slider), Catalog (grid)
 * and Product (related products): image with a hover-swap to a second
 * gallery photo when one exists, category/stock badges, name, price, and a
 * one-tap "add to cart" button (always visible — not hover-gated, since
 * most traffic here is mobile and hover never fires on touch).
 */
export function ProductCard({ product: p, width }) {
  const { openProduct, addToCart } = useStore();
  const [hover, setHover] = useState(false);
  const outOfStock = Number(p.stock) <= 0;
  const secondImage = p.images && p.images.length > 1 ? p.images[1] : null;
  const shownImage = (hover && secondImage) || p.image;

  const quickAdd = (e) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(p.id, 1, (p.sizes && p.sizes[0]) || "יחיד");
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={css(width ? `width:${width};` : "")}
    >
      <div onClick={() => openProduct(p.id)} style={thumb(shownImage, GRAD_CARD, "aspect-ratio:4/5;margin-bottom:0;box-shadow:var(--shadow-sm);cursor:pointer;")}>
        {!shownImage && <Disc style="width:48%;aspect-ratio:1;" />}
        <span style={css("position:absolute;top:10px;right:10px;background:#fff;font-size:11px;padding:4px 9px;border-radius:var(--r-pill);color:var(--c-ink-mute);letter-spacing:.03em;")}>{p.category}</span>
        {outOfStock && <span style={css("position:absolute;top:10px;left:10px;background:var(--c-danger-bg);color:var(--c-danger);font-size:10.5px;font-weight:700;padding:4px 9px;border-radius:var(--r-pill);")}>אזל במלאי</span>}
      </div>
      <div onClick={() => openProduct(p.id)} style={css("cursor:pointer;margin-top:12px;")}>
        <div style={css("font-family:var(--font-serif);font-size:17px;margin-bottom:4px;")}>{p.name}</div>
        <div style={css("font-size:15px;color:var(--c-accent);font-weight:600;")}>{fmt(p.price)}</div>
      </div>
      <button
        onClick={quickAdd}
        disabled={outOfStock}
        className="tap-target"
        style={css(`width:100%;margin-top:8px;padding:9px;background:${outOfStock ? "var(--c-line-soft)" : "var(--c-accent)"};color:${outOfStock ? "var(--c-ink-mute)" : "#fff"};border:none;border-radius:var(--r-sm);font-size:12.5px;font-weight:600;cursor:${outOfStock ? "default" : "pointer"};`)}
      >
        {outOfStock ? "אזל במלאי" : "הוספה לסל"}
      </button>
    </div>
  );
}
