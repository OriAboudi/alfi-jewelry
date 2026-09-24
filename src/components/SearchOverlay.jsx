import React, { useEffect, useMemo, useRef, useState } from "react";
import { css } from "../lib/css.js";
import { PriceTag } from "./PriceTag.jsx";
import { useStore } from "../context/StoreContext.jsx";

/**
 * SearchOverlay — instant client-side search over the already-loaded
 * product list (no new API call/backend logic — StoreContext's `products`
 * is already fetched for the whole site). Opened from the header's search
 * button on both desktop and mobile.
 */
export function SearchOverlay({ onClose }) {
  const { products, openProduct } = useStore();
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const term = q.trim();
    if (!term) return [];
    return products.filter((p) => (p.name || "").includes(term)).slice(0, 8);
  }, [q, products]);

  const pick = (id) => {
    openProduct(id);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={css("position:fixed;inset:0;z-index:95;background:rgba(46,34,49,.5);display:flex;align-items:flex-start;justify-content:center;padding:80px 16px 16px;")}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="glass-strong"
        style={css("width:100%;max-width:560px;padding:18px;box-sizing:border-box;")}
      >
        <div style={css("display:flex;align-items:center;gap:10px;")}>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש תכשיטים…"
            style={css("flex:1;padding:14px 16px;border:1px solid var(--ink);background:var(--cream);font:inherit;font-size:16px;color:var(--ink);box-sizing:border-box;outline:none;")}
          />
          <button onClick={onClose} aria-label="סגירת חיפוש" className="tap-target" style={css("width:44px;height:44px;flex:none;border:0;background:transparent;cursor:pointer;color:var(--ink);font-size:22px;line-height:1;")}>×</button>
        </div>

        {q.trim() && (
          <div style={css("margin-top:14px;display:flex;flex-direction:column;max-height:60vh;overflow-y:auto;")}>
            {results.length === 0 ? (
              <div style={css("padding:16px 4px;color:var(--text-muted);font-size:14px;")}>לא נמצאו תוצאות עבור "{q}"</div>
            ) : (
              results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pick(p.id)}
                  style={css("display:flex;align-items:center;gap:12px;padding:10px 4px;border:0;border-bottom:1px solid rgba(58,45,61,.1);background:none;cursor:pointer;text-align:right;font:inherit;width:100%;")}
                >
                  <span style={css(`width:44px;height:44px;flex:none;background:${p.image ? `url("${p.image}") center/cover` : "var(--c-line-soft)"};`)} />
                  <span style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;")}>
                    <span className="serif" style={css("font-size:15px;color:var(--ink);")}>{p.name}</span>
                    <span style={css("font-size:12.5px;color:var(--text-muted);")}>{p.category}</span>
                  </span>
                  <PriceTag product={p} size={14} showPercent={false} style="color:var(--ink);" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
