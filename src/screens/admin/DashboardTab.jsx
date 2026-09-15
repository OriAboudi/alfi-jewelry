import React from "react";
import { css } from "../../lib/css.js";
import { fmt } from "../../lib/format.js";
import { store } from "../../lib/store.js";
import { useStore } from "../../context/StoreContext.jsx";

// Fetches its own data directly from `store` (revenue/order aggregates,
// low-stock list) rather than the global context state — this is a
// server-computed summary, not something to keep duplicating client-side.
export function DashboardTab() {
  const { content, setTab } = useStore();
  const threshold = Number(content.lowStockThreshold ?? 5);

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
      store.products.lowStock(threshold),
    ]).then(([s, b, l]) => {
      if (!alive) return;
      setSummary(s); setBestSellers(b); setLowStock(l);
    }).catch(() => {}).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [threshold]);

  const card = "background:#fff;border:1px solid #ecdccd;border-radius:16px;padding:22px;";
  const statNum = "font-family:'Frank Ruhl Libre',serif;font-size:30px;font-weight:400;color:#3a2c25;";
  const statLbl = "font-size:13px;color:#8a766a;margin-top:4px;";

  if (loading) return <div style={css("text-align:center;padding:60px;color:#8a766a;")}>טוען נתונים…</div>;

  const statuses = summary?.status_counts || {};

  return (
    <div>
      <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:24px;margin-bottom:20px;")}>סקירה כללית</h2>

      <div className="r-grid4" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;")}>
        <div style={css(card)}><div style={css(statNum)}>{fmt(summary?.revenue || 0)}</div><div style={css(statLbl)}>הכנסות (הזמנות ששולמו)</div></div>
        <div style={css(card)}><div style={css(statNum)}>{summary?.order_count || 0}</div><div style={css(statLbl)}>הזמנות בסה״כ</div></div>
        <div style={css(card)}><div style={css(statNum)}>{summary?.paid_order_count || 0}</div><div style={css(statLbl)}>הזמנות ששולמו</div></div>
        <div style={css(card + (lowStock.length ? "border-color:#e7b7a0;" : ""))}>
          <div style={css(statNum + (lowStock.length ? "color:#a85a44;" : ""))}>{lowStock.length}</div>
          <div style={css(statLbl)}>מוצרים במלאי נמוך</div>
        </div>
      </div>

      <div className="r-grid2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
        <div style={css(card)}>
          <div style={css("font-size:15px;font-weight:700;color:#bd7355;margin-bottom:14px;")}>מוצרים לפי סטטוס הזמנה</div>
          {Object.keys(statuses).length === 0 && <div style={css("color:#8a766a;font-size:14px;")}>אין הזמנות עדיין.</div>}
          {Object.entries(statuses).map(([status, count]) => (
            <div key={status} style={css("display:flex;justify-content:space-between;font-size:14px;padding:7px 0;border-top:1px solid #f3e8dd;")}>
              <span>{status}</span><span style={css("font-weight:600;")}>{count}</span>
            </div>
          ))}
        </div>

        <div style={css(card)}>
          <div style={css("font-size:15px;font-weight:700;color:#bd7355;margin-bottom:14px;")}>הנמכרים ביותר</div>
          {bestSellers.length === 0 && <div style={css("color:#8a766a;font-size:14px;")}>אין עדיין נתוני מכירות.</div>}
          {bestSellers.map((p) => (
            <div key={p.product_id} style={css("display:flex;justify-content:space-between;font-size:14px;padding:7px 0;border-top:1px solid #f3e8dd;")}>
              <span>{p.name}</span><span style={css("color:#8a766a;")}>{p.qty_sold} יח׳ · {fmt(p.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div style={css(card + "margin-top:16px;")}>
          <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;")}>
            <div style={css("font-size:15px;font-weight:700;color:#a85a44;")}>⚠ מלאי נמוך (סף: {threshold} יח׳)</div>
            <span onClick={() => setTab("products")} style={css("font-size:13px;color:#bd7355;cursor:pointer;font-weight:600;")}>מעבר למוצרים ←</span>
          </div>
          {lowStock.map((p) => (
            <div key={p.id} style={css("display:flex;justify-content:space-between;font-size:14px;padding:7px 0;border-top:1px solid #f3e8dd;")}>
              <span>{p.name}</span>
              <span style={css(`font-weight:700;${p.stock === 0 ? "color:#a85a44;" : "color:#bd7355;"}`)}>{p.stock === 0 ? "אזל במלאי" : `${p.stock} יח׳ נותרו`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
