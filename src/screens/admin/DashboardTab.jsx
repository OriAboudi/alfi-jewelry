import React from "react";
import { css } from "../../lib/css.js";
import { fmt } from "../../lib/format.js";
import { store } from "../../lib/store.js";
import { useStore } from "../../context/StoreContext.jsx";
import { stockTier, TIER_LABEL, TIER_COLOR } from "./shared.jsx";

// Fetches its own data directly from `store` (revenue/order aggregates,
// low-stock list) rather than the global context state — this is a
// server-computed summary, not something to keep duplicating client-side.
export function DashboardTab() {
  const { content, setTab } = useStore();
  const low = Number(content.lowStockThreshold ?? 5);
  const fine = Number(content.stockFineThreshold ?? 10);

  const [summary, setSummary] = React.useState(null);
  const [bestSellers, setBestSellers] = React.useState([]);
  const [lowStock, setLowStock] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      store.stats.summary(),
      store.stats.bestSellers({ limit: 5 }),
      store.products.lowStock(fine),
    ]).then(([s, b, l]) => {
      if (!alive) return;
      setSummary(s); setBestSellers(b); setLowStock(l);
    }).catch(() => {}).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [fine]);

  const card = "background:#fff;border:1px solid var(--c-line);border-radius:16px;padding:22px;";
  const statNum = "font-family:var(--font-serif);font-size:30px;font-weight:400;color:var(--c-ink);";
  const statLbl = "font-size:13px;color:var(--c-ink-mute);margin-top:4px;";

  if (loading) return <div style={css("text-align:center;padding:60px;color:var(--c-ink-mute);")}>טוען נתונים…</div>;

  const statuses = summary?.status_counts || {};

  return (
    <div>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;margin-bottom:20px;")}>סקירה כללית</h2>

      <div className="r-grid4" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;")}>
        <div style={css(card)}><div style={css(statNum)}>{fmt(summary?.revenue || 0)}</div><div style={css(statLbl)}>הכנסות (הזמנות ששולמו)</div></div>
        <div style={css(card)}><div style={css(statNum)}>{summary?.order_count || 0}</div><div style={css(statLbl)}>הזמנות בסה״כ</div></div>
        <div style={css(card)}><div style={css(statNum)}>{summary?.paid_order_count || 0}</div><div style={css(statLbl)}>הזמנות ששולמו</div></div>
        <div style={css(card + (lowStock.length ? "border-color:var(--c-warning);" : ""))}>
          <div style={css(statNum + (lowStock.length ? "color:var(--c-danger);" : ""))}>{lowStock.length}</div>
          <div style={css(statLbl)}>מוצרים במלאי נמוך</div>
        </div>
      </div>

      <div className="r-grid2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
        <div style={css(card)}>
          <div style={css("font-size:15px;font-weight:700;color:var(--c-accent);margin-bottom:14px;")}>מוצרים לפי סטטוס הזמנה</div>
          {Object.keys(statuses).length === 0 && <div style={css("color:var(--c-ink-mute);font-size:14px;")}>אין הזמנות עדיין.</div>}
          {Object.entries(statuses).map(([status, count]) => (
            <div key={status} style={css("display:flex;justify-content:space-between;font-size:14px;padding:7px 0;border-top:1px solid var(--c-line-soft);")}>
              <span>{status}</span><span style={css("font-weight:600;")}>{count}</span>
            </div>
          ))}
        </div>

        <div style={css(card)}>
          <div style={css("font-size:15px;font-weight:700;color:var(--c-accent);margin-bottom:14px;")}>הנמכרים ביותר</div>
          {bestSellers.length === 0 && <div style={css("color:var(--c-ink-mute);font-size:14px;")}>אין עדיין נתוני מכירות.</div>}
          {bestSellers.map((p) => (
            <div key={p.product_id} style={css("display:flex;justify-content:space-between;font-size:14px;padding:7px 0;border-top:1px solid var(--c-line-soft);")}>
              <span>{p.name}</span><span style={css("color:var(--c-ink-mute);")}>{p.qty_sold} יח׳ · {fmt(p.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div style={css(card + "margin-top:16px;")}>
          <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;")}>
            <div style={css("font-size:15px;font-weight:700;color:var(--c-danger);")}>⚠ מוצרים במלאי נמוך</div>
            <span onClick={() => setTab("inventory")} style={css("font-size:13px;color:var(--c-accent);cursor:pointer;font-weight:600;")}>מעבר למלאי ←</span>
          </div>
          {lowStock.map((p) => {
            const tier = stockTier(p.stock, { fine, low });
            return (
              <div key={p.id} style={css("display:flex;justify-content:space-between;font-size:14px;padding:7px 0;border-top:1px solid var(--c-line-soft);")}>
                <span>{p.name}</span>
                <span style={css(`font-weight:700;color:${TIER_COLOR[tier].fg};`)}>{tier === "out" ? TIER_LABEL.out : `${p.stock} יח׳ נותרו`}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
