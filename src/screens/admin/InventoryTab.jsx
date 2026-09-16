import React from "react";
import { css } from "../../lib/css.js";
import { useStore } from "../../context/StoreContext.jsx";
import { store } from "../../lib/store.js";
import { CORE_CAT_NAMES, stockTier, TIER_LABEL, TIER_COLOR } from "./shared.jsx";

const SEVERITY = { out: 0, critical: 1, warning: 2, ok: 3 };

export function InventoryTab() {
  const { products, content, refreshProducts } = useStore();
  const low = Number(content.lowStockThreshold ?? 5);
  const fine = Number(content.stockFineThreshold ?? 10);
  const [stockEdits, setStockEdits] = React.useState({});
  const [busyId, setBusyId] = React.useState(null);

  const withTier = products.map((p) => ({ ...p, tier: stockTier(p.stock, { fine, low }) }));

  const totalUnits = withTier.reduce((a, p) => a + (Number(p.stock) || 0), 0);
  const countByTier = { ok: 0, warning: 0, critical: 0, out: 0 };
  withTier.forEach((p) => { countByTier[p.tier]++; });

  const shortages = withTier
    .filter((p) => p.tier !== "ok")
    .slice()
    .sort((a, b) => SEVERITY[a.tier] - SEVERITY[b.tier] || Number(a.stock) - Number(b.stock));

  const byCategory = CORE_CAT_NAMES.map((cat) => {
    const items = withTier.filter((p) => p.category === cat);
    return {
      cat,
      units: items.reduce((a, p) => a + (Number(p.stock) || 0), 0),
      itemCount: items.length,
      shortageCount: items.filter((p) => p.tier !== "ok").length,
    };
  });

  const sortedAll = withTier.slice().sort((a, b) => (a.category || "").localeCompare(b.category || "", "he") || (a.name || "").localeCompare(b.name || "", "he"));

  const adjustStock = async (id, value) => {
    const stock = Math.max(0, Number(value) || 0);
    setBusyId(id);
    try {
      await store.products.update(id, { stock });
      setStockEdits((s) => { const n = { ...s }; delete n[id]; return n; });
      await refreshProducts();
    } catch { alert("עדכון המלאי נכשל"); }
    finally { setBusyId(null); }
  };

  const card = "background:#fff;border:1px solid var(--c-line);border-radius:16px;padding:22px;";
  const statNum = "font-family:var(--font-serif);font-size:30px;font-weight:400;color:var(--c-ink);";
  const statLbl = "font-size:13px;color:var(--c-ink-mute);margin-top:4px;";

  const stockInput = (p) => (
    <div style={css("display:flex;align-items:center;gap:6px;")}>
      <input
        type="number" min="0"
        value={stockEdits[p.id] ?? p.stock}
        onChange={(e) => setStockEdits((s) => ({ ...s, [p.id]: e.target.value }))}
        style={css(`width:64px;padding:7px 8px;border:1px solid ${p.tier === "ok" ? "var(--c-line-strong)" : TIER_COLOR[p.tier].fg};border-radius:8px;font-size:13.5px;text-align:center;color:${p.tier === "ok" ? "var(--c-ink)" : TIER_COLOR[p.tier].fg};`)}
      />
      {String(stockEdits[p.id] ?? "") !== "" && Number(stockEdits[p.id]) !== p.stock && (
        <button onClick={() => adjustStock(p.id, stockEdits[p.id])} disabled={busyId === p.id} style={css("padding:6px 10px;background:var(--c-line-soft);border:none;border-radius:8px;font-size:12px;color:var(--c-accent);font-weight:600;cursor:pointer;")}>עדכון</button>
      )}
    </div>
  );

  return (
    <div>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;margin-bottom:20px;")}>מלאי</h2>

      {/* TOP STATS */}
      <div className="r-grid4" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;")}>
        <div style={css(card)}><div style={css(statNum)}>{totalUnits}</div><div style={css(statLbl)}>סה״כ יחידות במלאי</div></div>
        <div style={css(card + (countByTier.warning ? `border-color:${TIER_COLOR.warning.fg};` : ""))}>
          <div style={css(statNum + (countByTier.warning ? `color:${TIER_COLOR.warning.fg};` : ""))}>{countByTier.warning}</div>
          <div style={css(statLbl)}>מוצרים במלאי כתום</div>
        </div>
        <div style={css(card + (countByTier.critical ? `border-color:${TIER_COLOR.critical.fg};` : ""))}>
          <div style={css(statNum + (countByTier.critical ? `color:${TIER_COLOR.critical.fg};` : ""))}>{countByTier.critical}</div>
          <div style={css(statLbl)}>מוצרים במלאי אדום</div>
        </div>
        <div style={css(card + (countByTier.out ? `border-color:${TIER_COLOR.out.fg};` : ""))}>
          <div style={css(statNum + (countByTier.out ? `color:${TIER_COLOR.out.fg};` : ""))}>{countByTier.out}</div>
          <div style={css(statLbl)}>מוצרים שאזלו</div>
        </div>
      </div>

      {/* PER-CATEGORY SUMMARY */}
      <div style={css("font-size:15px;font-weight:700;color:var(--c-accent);margin-bottom:12px;")}>מלאי לפי קטגוריה</div>
      <div className="r-grid4" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;")}>
        {byCategory.map((c) => (
          <div key={c.cat} style={css(card)}>
            <div style={css("font-size:14.5px;font-weight:700;margin-bottom:8px;")}>{c.cat}</div>
            <div style={css(statNum + "font-size:24px;")}>{c.units} <span style={css("font-size:13px;color:var(--c-ink-mute);font-weight:400;")}>יח׳</span></div>
            <div style={css(statLbl)}>{c.itemCount} מוצרים{c.shortageCount ? ` · ${c.shortageCount} בחוסר` : ""}</div>
          </div>
        ))}
      </div>

      {/* SHORTAGES */}
      {shortages.length > 0 && (
        <div style={css(card + "margin-bottom:28px;")}>
          <div style={css("font-size:15px;font-weight:700;color:var(--c-danger);margin-bottom:14px;")}>⚠ חוסרים הדורשים תשומת לב ({shortages.length})</div>
          {shortages.map((p) => (
            <div key={p.id} style={css("display:flex;align-items:center;gap:14px;justify-content:space-between;font-size:14px;padding:10px 0;border-top:1px solid var(--c-line-soft);flex-wrap:wrap;")}>
              <div style={css("flex:1;min-width:140px;")}>
                <div style={css("font-weight:600;")}>{p.name}</div>
                <div style={css("font-size:12.5px;color:var(--c-ink-mute);")}>{p.category}</div>
              </div>
              <span style={css(`font-size:12px;font-weight:600;padding:4px 10px;border-radius:100px;background:${TIER_COLOR[p.tier].bg};color:${TIER_COLOR[p.tier].fg};white-space:nowrap;`)}>{TIER_LABEL[p.tier]}</span>
              {stockInput(p)}
            </div>
          ))}
        </div>
      )}

      {/* FULL LIST */}
      <div style={css("font-size:15px;font-weight:700;color:var(--c-accent);margin-bottom:12px;")}>כל המוצרים ({sortedAll.length})</div>
      {sortedAll.map((p) => (
        <div key={p.id} className="r-admin-row" style={css("display:flex;align-items:center;gap:14px;background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:12px 16px;margin-bottom:8px;flex-wrap:wrap;")}>
          <div style={css("flex:1;min-width:140px;")}>
            <div style={css("font-size:15px;")}>{p.name}</div>
            <div style={css("font-size:12.5px;color:var(--c-ink-mute);")}>{p.category}</div>
          </div>
          {stockInput(p)}
          <span style={css(`font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:100px;background:${TIER_COLOR[p.tier].bg};color:${TIER_COLOR[p.tier].fg};white-space:nowrap;`)}>{p.tier === "ok" ? "תקין" : TIER_LABEL[p.tier]}</span>
        </div>
      ))}
    </div>
  );
}
