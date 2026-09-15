import React from "react";
import { css } from "../../lib/css.js";
import { fmt, fmtDate, fmtDateTime } from "../../lib/format.js";
import { useStore } from "../../context/StoreContext.jsx";
import { store } from "../../lib/store.js";
import { Overlay, OverlayHeader, Pager, lbl, inp, STATUS_OPTS } from "./shared.jsx";

const PAGE_SIZE = 20;

export function OrdersTab() {
  const { setOrderStatus } = useStore();

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [paymentStatus, setPaymentStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState([]);
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [orderView, setOrderView] = React.useState(null);
  const [history, setHistory] = React.useState([]);

  const reload = React.useCallback(() => {
    setLoading(true);
    store.orders
      .listAll({ search: search.trim() || undefined, status: status || undefined, paymentStatus: paymentStatus || undefined, page, pageSize: PAGE_SIZE })
      .then((r) => { setRows(r.rows); setCount(r.count); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, status, paymentStatus, page]);

  React.useEffect(() => { setPage(1); }, [search, status, paymentStatus]);
  React.useEffect(() => { const t = setTimeout(reload, 250); return () => clearTimeout(t); }, [reload]);

  React.useEffect(() => {
    if (!orderView) { setHistory([]); return; }
    store.orders.history(orderView.id).then(setHistory).catch(() => setHistory([]));
  }, [orderView]);

  const changeStatus = async (id, s) => {
    await setOrderStatus(id, s);
    reload();
    if (orderView?.id === id) {
      store.orders.history(id).then(setHistory).catch(() => {});
      setOrderView((o) => (o ? { ...o, status: s } : o));
    }
  };

  return (
    <div>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;margin-bottom:18px;")}>הזמנות ({count})</h2>

      <div style={css("display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;")}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי מספר הזמנה…" style={css(inp + "max-width:220px;")} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={css(inp + "max-width:150px;cursor:pointer;")}>
          <option value="">כל הסטטוסים</option>
          {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={css(inp + "max-width:150px;cursor:pointer;")}>
          <option value="">כל סטטוסי התשלום</option>
          <option value="paid">שולם</option>
          <option value="pending">טרם שולם</option>
        </select>
      </div>

      {loading ? (
        <div style={css("text-align:center;padding:40px;color:var(--c-ink-mute);")}>טוען…</div>
      ) : rows.length === 0 ? (
        <div style={css("background:#fff;border:1px dashed var(--c-line-strong);border-radius:14px;padding:40px;text-align:center;color:var(--c-ink-mute);")}>לא נמצאו הזמנות.</div>
      ) : rows.map((o) => {
        const qty = (o.items || []).reduce((a, it) => a + (it.qty || 0), 0);
        const cust = (o.shipping_address && ((o.shipping_address.first || "") + " " + (o.shipping_address.last || "")).trim()) || "אורח";
        return (
          <div key={o.id} className="r-admin-row" style={css(`background:#fff;border:1px solid ${o.is_test ? "var(--c-line-strong)" : "var(--c-line)"};border-radius:14px;padding:18px 20px;margin-bottom:10px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;${o.is_test ? "opacity:.7;" : ""}`)}>
            {o.is_test && <span style={css("font-size:11px;font-weight:700;padding:4px 9px;border-radius:100px;background:var(--c-line-soft);color:var(--c-ink-mute);white-space:nowrap;")}>TEST</span>}
            <div style={css("flex:1;min-width:140px;")}><div style={css("font-weight:600;font-size:15.5px;")}>{o.number}</div><div style={css("font-size:13px;color:var(--c-ink-mute);")}>{fmtDate(o.created_at)} · {cust}</div></div>
            <div style={css("font-size:14px;color:var(--c-ink-soft);")}>{qty} פריטים</div>
            <span style={css(`font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:100px;white-space:nowrap;background:${o.payment_status === "paid" ? "var(--c-success-bg)" : "var(--c-danger-bg)"};color:${o.payment_status === "paid" ? "var(--c-success)" : "var(--c-danger)"};`)}>
              {o.payment_status === "paid" ? "שולם" : "טרם שולם"}
            </span>
            <div style={css("font-size:16px;font-weight:600;width:90px;")}>{fmt(o.total)}</div>
            <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} style={css("padding:8px 12px;border:1px solid var(--c-line-strong);border-radius:9px;font-size:13.5px;background:#fff;cursor:pointer;color:var(--c-ink);")}>
              {STATUS_OPTS.map((sname) => <option key={sname} value={sname}>{sname}</option>)}
            </select>
            <button onClick={() => setOrderView(o)} style={css("padding:8px 14px;background:var(--c-line-soft);border:none;border-radius:9px;font-size:13.5px;color:var(--c-accent);font-weight:600;cursor:pointer;white-space:nowrap;")}>פרטים</button>
          </div>
        );
      })}

      <Pager page={page} pageSize={PAGE_SIZE} count={count} onPage={setPage} />

      {orderView && (() => {
        const o = rows.find((x) => x.id === orderView.id) || orderView;
        const addr = o.shipping_address || {};
        const fullName = [addr.first, addr.last].filter(Boolean).join(" ") || "אורח";
        return (
          <Overlay onClose={() => setOrderView(null)}>
            <OverlayHeader title={o.number} onClose={() => setOrderView(null)} />
            <div style={css("display:flex;flex-direction:column;gap:18px;")}>
              <div>
                <label style={css(lbl)}>סטטוס הזמנה</label>
                <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} style={css(inp + "cursor:pointer;")}>
                  {STATUS_OPTS.map((sname) => <option key={sname} value={sname}>{sname}</option>)}
                </select>
              </div>
              <div style={css("background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:18px;")}>
                <div style={css("font-size:13px;font-weight:700;color:var(--c-ink-mute);margin-bottom:10px;")}>פרטי לקוח</div>
                <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:14px;")}>
                  <div><div style={css("color:var(--c-ink-mute);font-size:12px;")}>שם</div><div>{fullName}</div></div>
                  <div><div style={css("color:var(--c-ink-mute);font-size:12px;")}>אימייל</div><div>{addr.email || "—"}</div></div>
                  <div><div style={css("color:var(--c-ink-mute);font-size:12px;")}>טלפון</div><div>{addr.phone || "—"}</div></div>
                  <div><div style={css("color:var(--c-ink-mute);font-size:12px;")}>תשלום</div><div>{o.payment_status === "paid" ? "שולם" : "טרם שולם"}</div></div>
                  <div style={css("grid-column:1/3;")}><div style={css("color:var(--c-ink-mute);font-size:12px;")}>כתובת</div><div>{[addr.address, addr.city, addr.zip].filter(Boolean).join(", ") || "—"}</div></div>
                </div>
              </div>
              <div style={css("background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:18px;")}>
                <div style={css("font-size:13px;font-weight:700;color:var(--c-ink-mute);margin-bottom:10px;")}>פריטים</div>
                {(o.items || []).map((it, i) => (
                  <div key={i} style={css("display:flex;justify-content:space-between;font-size:14px;margin-bottom:8px;")}>
                    <span>{it.name}{it.size ? ` (${it.size})` : ""} × {it.qty}</span>
                    <span style={css("font-weight:600;")}>{fmt(it.price * it.qty)}</span>
                  </div>
                ))}
                <div style={css("height:1px;background:var(--c-line);margin:10px 0;")} />
                <div style={css("display:flex;justify-content:space-between;font-size:13.5px;color:var(--c-ink-mute);margin-bottom:4px;")}><span>משלוח</span><span>{o.shipping ? fmt(o.shipping) : "חינם"}</span></div>
                <div style={css("display:flex;justify-content:space-between;font-size:16px;font-weight:700;")}><span>סה״כ</span><span>{fmt(o.total)}</span></div>
              </div>
              {history.length > 0 && (
                <div style={css("background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:18px;")}>
                  <div style={css("font-size:13px;font-weight:700;color:var(--c-ink-mute);margin-bottom:10px;")}>ציר זמן סטטוס</div>
                  {history.map((h, i) => (
                    <div key={i} style={css("display:flex;justify-content:space-between;font-size:13.5px;padding:6px 0;border-top:1px solid var(--c-line-soft);")}>
                      <span>{h.status}</span>
                      <span style={css("color:var(--c-ink-mute);")}>{fmtDateTime(h.changed_at)}{h.notified ? " · נשלח מייל" : ""}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setOrderView(null)} style={css("padding:13px;background:#fff;color:var(--c-ink);border:1px solid var(--c-line-strong);border-radius:11px;font-size:15px;cursor:pointer;")}>סגירה</button>
            </div>
          </Overlay>
        );
      })()}
    </div>
  );
}
