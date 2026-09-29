import React, { useEffect } from "react";
import { css } from "../lib/css.js";
import { fmt, fmtDate } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";
import { useSeoTags } from "../hooks/useSeoTags.js";
import { SkeletonText, LoadingLabel } from "../components/Skeleton.jsx";

const rowStyle = "width:100%;font:inherit;text-align:right;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px;background:#fff;border:1px solid var(--c-line);border-radius:var(--r-md);padding:16px 18px;min-height:64px;color:var(--c-ink);";

function OrderRow({ o, onOpen }) {
  const unpaid = o.payment_status && o.payment_status !== "paid";
  return (
    <button type="button" onClick={() => onOpen(o.id)} className="tap-target" style={css(rowStyle)}>
      <span>
        <span style={css("display:block;font-weight:600;font-size:15.5px;margin-bottom:3px;")}>{o.number}</span>
        <span style={css("display:block;font-size:13px;color:var(--c-ink-mute);")}>
          {fmtDate(o.created_at)}
          {o.total != null && <> · {fmt(o.total)}</>}
          {o.status && <> · {unpaid ? "ממתינה לתשלום" : o.status}</>}
        </span>
      </span>
      <span aria-hidden="true" style={css("color:var(--c-accent);font-size:14px;font-weight:600;white-space:nowrap;")}>לפרטים ←</span>
    </button>
  );
}

/**
 * "החשבון שלי" (/החשבון-שלי).
 *  • Signed in: account details + the account's orders from the server —
 *    the same list on every device — plus favorites and logout.
 *  • Signed out: login / register, and the orders placed on THIS device as
 *    a guest (remembered locally; they join the account on sign-in).
 */
export function MyOrders() {
  const { customer, authReady, accountOrders, accountOrdersError, refreshAccountOrders, myOrders, viewOrder, go, openAuth, customerLogout, favoritesCount } = useStore();
  useSeoTags({ title: "החשבון שלי · ALFI", noindex: true });

  // Fresh list every visit (an order placed on another device shows up).
  useEffect(() => { if (customer) refreshAccountOrders(); }, [customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const shell = (children) => (
    <div className="r-container glass-card" style={css("max-width:720px;margin:30px auto;padding:40px var(--sp-5) 64px;")}>
      <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:8px;")}>החשבון שלי</h1>
      {children}
    </div>
  );

  if (!authReady) {
    return shell(<div style={css("margin-top:24px;")}><LoadingLabel /><SkeletonText lines={3} height={18} gap={14} /></div>);
  }

  if (!customer) {
    return shell(
      <>
        <p style={css("font-size:15.5px;color:var(--c-ink-soft);margin-bottom:20px;line-height:1.7;")}>
          עם חשבון, ההזמנות והמועדפים שלך זמינים בכל מכשיר: בטלפון, במחשב ובכל מקום אחר. בלי סיסמה: נכנסים עם אימייל ונייד, ומקבלים קוד למייל.
        </p>
        <div style={css("display:flex;gap:10px;flex-wrap:wrap;margin-bottom:var(--sp-6);")}>
          <button type="button" onClick={() => openAuth()} className="btn btn-primary" style={css("min-height:48px;padding:0 28px;")}>כניסה עם קוד במייל</button>
        </div>
        {myOrders.length > 0 && (
          <section aria-labelledby="device-orders">
            <h2 id="device-orders" style={css("font-family:var(--font-serif);font-weight:400;font-size:20px;margin-bottom:6px;")}>הזמנות מהמכשיר הזה</h2>
            <p style={css("font-size:13.5px;color:var(--c-ink-mute);margin-bottom:14px;")}>אחרי ההתחברות הן יצורפו לחשבון שלך.</p>
            <div style={css("display:flex;flex-direction:column;gap:10px;")}>
              {myOrders.map((o) => <OrderRow key={o.id} o={o} onOpen={viewOrder} />)}
            </div>
          </section>
        )}
      </>
    );
  }

  return shell(
    <>
      <div style={css("display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:var(--sp-6);")}>
        <div>
          {customer.name && <div style={css("font-size:16px;font-weight:600;")}>{customer.name}</div>}
          <div style={css("font-size:14px;color:var(--c-ink-mute);direction:ltr;text-align:right;")}>{customer.email}</div>
          {customer.phone && <div style={css("font-size:14px;color:var(--c-ink-mute);direction:ltr;text-align:right;")}>{customer.phone}</div>}
        </div>
        <button type="button" onClick={customerLogout} className="tap-target" style={css("background:none;border:1px solid var(--c-line-strong);border-radius:var(--r-pill);padding:0 18px;min-height:44px;font:inherit;font-size:14px;cursor:pointer;color:var(--c-ink);")}>התנתקות</button>
      </div>

      <button type="button" onClick={() => go("favorites")} className="tap-target" style={css(rowStyle + "margin-bottom:var(--sp-6);")}>
        <span style={css("font-size:15.5px;")}>המועדפים שלי{favoritesCount ? ` (${favoritesCount})` : ""}</span>
        <span aria-hidden="true" style={css("color:var(--c-accent);")}>←</span>
      </button>

      <section aria-labelledby="account-orders">
        <h2 id="account-orders" style={css("font-family:var(--font-serif);font-weight:400;font-size:22px;margin-bottom:14px;")}>ההזמנות שלי</h2>
        {accountOrdersError ? (
          <div role="alert" style={css("padding:18px;border-radius:var(--r-md);background:var(--c-danger-bg);color:var(--c-danger);font-size:14.5px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;")}>
            לא הצלחנו לטעון את ההזמנות כרגע.
            <button type="button" onClick={refreshAccountOrders} className="tap-target" style={css("background:none;border:0;padding:0 4px;font:inherit;font-weight:600;color:inherit;text-decoration:underline;cursor:pointer;")}>לנסות שוב</button>
          </div>
        ) : accountOrders === null ? (
          <div><LoadingLabel text="טוען הזמנות…" /><SkeletonText lines={3} height={52} gap={10} width="100%" /></div>
        ) : accountOrders.length === 0 ? (
          <div style={css("text-align:center;padding:40px 0;")}>
            <p style={css("font-size:15.5px;color:var(--c-ink-mute);margin-bottom:20px;")}>עדיין אין הזמנות בחשבון.</p>
            <button onClick={() => go("catalog")} className="btn btn-primary">לכל התכשיטים</button>
          </div>
        ) : (
          <div style={css("display:flex;flex-direction:column;gap:10px;")}>
            {accountOrders.map((o) => <OrderRow key={o.id} o={o} onOpen={viewOrder} />)}
          </div>
        )}
      </section>
    </>
  );
}
