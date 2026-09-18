import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { fmt, fmtDateTime } from "../lib/format.js";
import { OrderProgress } from "../components/OrderProgress.jsx";
import { useStore } from "../context/StoreContext.jsx";

export function Status() {
  const { lastOrder: lo, go, refreshOrder } = useStore();
  const [loading, setLoading] = useState(!!lo?.id);

  useEffect(() => {
    if (!lo?.id) { setLoading(false); return; }
    let cancelled = false;
    refreshOrder(lo.id).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lo?.id]);

  const number = lo ? lo.number : "#ALF‑2418";
  const addr = lo?.shipping_address || {};
  const fullName = [addr.first, addr.last].filter(Boolean).join(" ") || "—";
  const items = Array.isArray(lo?.items) ? lo.items : [];

  return (
    <div className="r-container glass-card" style={css("max-width:820px;margin:30px auto;padding:46px var(--sp-5) 64px;")}>
      <div style={css("display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:8px;flex-wrap:wrap;gap:8px;")}>
        <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);")}>מעקב הזמנה</h1>
        <span style={css("font-size:15px;color:var(--c-ink-mute);")}>הזמנה {number}</span>
      </div>
      <p style={css("font-size:16px;color:var(--c-ink-soft);margin-bottom:var(--sp-6);")}>הנה היכן ההזמנה שלך נמצאת כרגע.</p>

      {loading ? (
        <div style={css("text-align:center;padding:40px;color:var(--c-ink-mute);")}>טוען…</div>
      ) : !lo ? (
        <div style={css("text-align:center;padding:40px;color:var(--c-ink-mute);")}>ההזמנה לא נמצאה.</div>
      ) : (
        <>
          <div className="card" style={css("padding:32px 28px;margin-bottom:24px;")}>
            <OrderProgress order={lo} />
          </div>

          {Array.isArray(lo.history) && lo.history.length > 0 && (
            <div className="card" style={css("padding:26px;text-align:right;margin-bottom:20px;")}>
              <h3 style={css("font-family:var(--font-serif);font-size:19px;margin-bottom:16px;")}>ציר זמן</h3>
              {lo.history.map((h, i) => (
                <div key={i} style={css("display:flex;justify-content:space-between;align-items:center;font-size:14px;padding:9px 0;border-top:1px solid var(--c-line-soft);")}>
                  <span style={css("font-weight:600;")}>{h.status}</span>
                  <span style={css("color:var(--c-ink-mute);font-size:13px;")}>{fmtDateTime(h.changed_at)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={css("padding:26px;text-align:right;margin-bottom:20px;")}>
            <h3 style={css("font-family:var(--font-serif);font-size:19px;margin-bottom:16px;")}>פרטי הלקוח</h3>
            <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;")}>
              <div><div style={css("color:var(--c-ink-mute);font-size:12.5px;margin-bottom:2px;")}>שם מלא</div><div>{fullName}</div></div>
              <div><div style={css("color:var(--c-ink-mute);font-size:12.5px;margin-bottom:2px;")}>אימייל</div><div>{addr.email || "—"}</div></div>
              <div><div style={css("color:var(--c-ink-mute);font-size:12.5px;margin-bottom:2px;")}>טלפון</div><div>{addr.phone || "—"}</div></div>
              <div><div style={css("color:var(--c-ink-mute);font-size:12.5px;margin-bottom:2px;")}>תשלום</div><div>{lo.payment_status === "paid" ? "שולם" : "ממתין לאישור"}</div></div>
              <div className="r-field-span2" style={css("grid-column:1/3;")}><div style={css("color:var(--c-ink-mute);font-size:12.5px;margin-bottom:2px;")}>כתובת למשלוח</div><div>{[addr.address, addr.city, addr.zip].filter(Boolean).join(", ") || "—"}</div></div>
            </div>
          </div>

          <div className="card" style={css("padding:26px;text-align:right;margin-bottom:var(--sp-7);")}>
            <h3 style={css("font-family:var(--font-serif);font-size:19px;margin-bottom:16px;")}>פריטים</h3>
            {items.map((it, i) => (
              <div key={i} style={css("display:flex;justify-content:space-between;font-size:14px;margin-bottom:10px;")}>
                <span>{it.name}{it.size ? ` (${it.size})` : ""} × {it.qty}</span>
                <span style={css("font-weight:600;")}>{fmt(it.price * it.qty)}</span>
              </div>
            ))}
            <div style={css("height:1px;background:var(--c-line);margin:14px 0;")} />
            <div style={css("display:flex;justify-content:space-between;font-size:14px;color:var(--c-ink-mute);margin-bottom:6px;")}><span>משלוח</span><span>{lo.shipping ? fmt(lo.shipping) : "חינם"}</span></div>
            {Number(lo.discount) > 0 && (
              <div style={css("display:flex;justify-content:space-between;font-size:14px;color:var(--c-success);margin-bottom:6px;")}><span>הנחת קופון{lo.coupon_code ? ` (${lo.coupon_code})` : ""}</span><span>-{fmt(lo.discount)}</span></div>
            )}
            <div style={css("display:flex;justify-content:space-between;font-size:17px;font-weight:700;")}><span>סה״כ</span><span>{fmt(lo.total)}</span></div>
          </div>
        </>
      )}

      <div style={css("margin-top:18px;display:flex;gap:14px;")}>
        <button onClick={() => go("home")} className="btn btn-primary">המשך בקניות</button>
      </div>
    </div>
  );
}
