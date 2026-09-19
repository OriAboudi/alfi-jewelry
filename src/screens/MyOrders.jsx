import React from "react";
import { css } from "../lib/css.js";
import { fmtDate } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";
import { useSeoTags } from "../hooks/useSeoTags.js";

// No customer accounts on this site (guest checkout only) — "my orders" is
// simply the list of orders this browser has actually placed or opened via
// its own tracking link, remembered in localStorage (see loadMyOrders in
// StoreContext.jsx). Same trust model as the emailed "?order=<uuid>" link,
// just remembered across visits instead of re-typed from the email each time.
export function MyOrders() {
  const { myOrders, customerName, viewOrder, go, customerLogout } = useStore();
  useSeoTags({ noindex: true });

  return (
    <div className="r-container glass-card" style={css("max-width:720px;margin:30px auto;padding:46px var(--sp-5) 64px;")}>
      <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:8px;")}>ההזמנות שלי</h1>
      {customerName && (
        <p style={css("font-size:14.5px;color:var(--c-ink-mute);margin-bottom:var(--sp-6);")}>
          שלום, {customerName} · <span onClick={customerLogout} className="tap-target" style={css("cursor:pointer;color:var(--c-accent);")}>יציאה</span>
        </p>
      )}

      {myOrders.length === 0 ? (
        <div style={css("text-align:center;padding:60px 0;")}>
          <div style={css("font-size:40px;margin-bottom:16px;color:#c9b3ce;")}>❀</div>
          <p style={css("font-size:16px;color:var(--c-ink-mute);margin-bottom:24px;")}>עדיין אין הזמנות במכשיר הזה.</p>
          <button onClick={() => go("catalog")} className="btn btn-primary" style={css("font-size:15.5px;")}>לקטלוג</button>
        </div>
      ) : (
        <div style={css("display:flex;flex-direction:column;gap:12px;")}>
          {myOrders.map((o) => (
            <div
              key={o.id}
              onClick={() => viewOrder(o.id)}
              className="tap-target"
              style={css("cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid var(--c-line);border-radius:var(--r-md);padding:18px 20px;transition:border-color .2s;")}
            >
              <div>
                <div style={css("font-weight:600;font-size:15.5px;margin-bottom:3px;")}>{o.number}</div>
                <div style={css("font-size:13px;color:var(--c-ink-mute);")}>{fmtDate(o.created_at)}</div>
              </div>
              <span style={css("color:var(--c-accent);font-size:14px;font-weight:600;")}>לפרטים ←</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
