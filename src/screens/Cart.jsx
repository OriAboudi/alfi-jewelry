import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { computeTotals } from "../lib/pricing.js";
import { CouponInput } from "../components/CouponInput.jsx";
import { useStore } from "../context/StoreContext.jsx";

export function Cart() {
  const { cart, products, content: C, changeQty, removeItem, go, goCheckout, couponCode, couponPercent, couponError, couponBusy, applyCoupon, removeCoupon } = useStore();

  const lines = cart.map((c) => {
    const p = products.find((x) => String(x.id) === String(c.id)) || { name: "", category: "", material: "", price: 0, image: "" };
    return { ...c, p };
  });
  const { subtotal, shipping, discount, total } = computeTotals(lines.map((l) => ({ price: l.p.price, qty: l.qty })), C, couponCode ? couponPercent : 0);
  const hasStockIssue = lines.some((l) => l.qty > Number(l.p.stock));

  return (
    <div className="r-container glass-card" style={css("max-width:1100px;margin:30px auto;padding:46px var(--sp-5) 64px;")}>
      <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:var(--sp-6);")}>עגלת הקניות</h1>

      {lines.length > 0 ? (
        <>
          <div className="r-cart-grid" style={css("display:grid;grid-template-columns:1fr 360px;gap:40px;align-items:start;")}>
            <div>
              {lines.map((l) => (
                <div key={l.id + l.size} style={css("display:flex;gap:16px;padding:22px 0;border-bottom:1px solid var(--c-line);")}>
                  <div className="r-cart-thumb" style={thumb(l.p.image, GRAD_CARD, "width:96px;height:114px;flex:none;border-radius:var(--r-md);")}>
                    {!l.p.image && <div style={css("width:50%;aspect-ratio:1;border-radius:50%;background:conic-gradient(from 200deg,#efe9f1,#cfc0d2,#f6f0eb,#c3b6c6,#efe9f1);box-shadow:inset 0 2px 8px rgba(0,0,0,.12);")} />}
                  </div>
                  <div style={css("flex:1;display:flex;flex-direction:column;min-width:0;")}>
                    <div style={css("display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;")}>
                      <div>
                        <div style={css("font-family:var(--font-serif);font-size:18px;margin-bottom:3px;")}>{l.p.name}</div>
                        <div style={css("font-size:13.5px;color:var(--c-ink-mute);")}>{l.p.category} · מידה {l.size} · {l.p.material}</div>
                        {Number(l.p.stock) <= 0 ? (
                          <div style={css("font-size:12.5px;color:var(--c-danger);font-weight:600;margin-top:4px;")}>אזל במלאי — יש להסיר מהעגלה</div>
                        ) : l.qty > Number(l.p.stock) && (
                          <div style={css("font-size:12.5px;color:var(--c-danger);font-weight:600;margin-top:4px;")}>נותרו {l.p.stock} יחידות בלבד במלאי</div>
                        )}
                      </div>
                      <div style={css("font-size:17px;font-weight:600;")}>{fmt(l.p.price * l.qty)}</div>
                    </div>
                    <div style={css("margin-top:auto;display:flex;justify-content:space-between;align-items:center;")}>
                      <div style={css("display:flex;align-items:center;border:1px solid var(--c-line-strong);border-radius:var(--r-sm);overflow:hidden;background:#fff;")}>
                        <button onClick={() => changeQty(l.id, l.size, -1)} className="tap-target" style={css("width:38px;border:none;background:#fff;font-size:18px;cursor:pointer;color:var(--c-ink-mute);")}>−</button>
                        <span style={css("width:38px;text-align:center;font-size:15px;font-weight:600;")}>{l.qty}</span>
                        <button onClick={() => changeQty(l.id, l.size, 1)} disabled={l.qty >= Number(l.p.stock)} className="tap-target" style={css(`width:38px;border:none;background:#fff;font-size:18px;cursor:pointer;color:var(--c-ink-mute);opacity:${l.qty >= Number(l.p.stock) ? .4 : 1};`)}>+</button>
                      </div>
                      <button onClick={() => removeItem(l.id, l.size)} className="tap-target" style={css("background:none;border:none;cursor:pointer;font-size:13.5px;color:var(--c-danger);")}>הסרה</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="r-sticky" style={css("background:var(--c-line-soft);border-radius:var(--r-lg);padding:28px;position:sticky;top:100px;")}>
              <h3 style={css("font-family:var(--font-serif);font-size:21px;margin-bottom:20px;")}>סיכום הזמנה</h3>
              <div style={css("display:flex;justify-content:space-between;font-size:15px;margin-bottom:12px;color:var(--c-ink-soft);")}><span>סכום ביניים</span><span>{fmt(subtotal)}</span></div>
              <div style={css("display:flex;justify-content:space-between;font-size:15px;margin-bottom:12px;color:var(--c-ink-soft);")}><span>משלוח</span><span>{shipping ? fmt(shipping) : "חינם"}</span></div>
              {couponCode && discount > 0 && (
                <div style={css("display:flex;justify-content:space-between;font-size:15px;margin-bottom:12px;color:var(--c-success);")}><span>הנחת קופון ({couponPercent}%)</span><span>-{fmt(discount)}</span></div>
              )}

              {couponCode ? (
                <div style={css("display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--c-success-bg);border-radius:var(--r-sm);padding:9px 12px;margin-bottom:14px;font-size:13px;color:var(--c-success);")}>
                  <span>קוד {couponCode} מופעל</span>
                  <span onClick={removeCoupon} className="tap-target" style={css("cursor:pointer;font-weight:700;")}>✕</span>
                </div>
              ) : (
                <CouponInput applyCoupon={applyCoupon} couponBusy={couponBusy} couponError={couponError} />
              )}

              <div style={css("height:1px;background:var(--c-line-strong);margin:16px 0;")} />
              <div style={css("display:flex;justify-content:space-between;font-size:20px;font-weight:700;margin-bottom:22px;")}><span>סה״כ</span><span>{fmt(total)}</span></div>
              <button onClick={goCheckout} disabled={hasStockIssue} className="btn btn-primary btn-block" style={css("margin-bottom:12px;font-size:16px;")}>למעבר לתשלום</button>
              {hasStockIssue && <div style={css("color:var(--c-danger);font-size:12.5px;text-align:center;margin-bottom:12px;")}>יש לעדכן את הכמות בפריטים שאזלו במלאי</div>}
              <button onClick={() => go("catalog")} className="tap-target" style={css("width:100%;background:transparent;border:none;font-size:14.5px;color:var(--c-ink-mute);cursor:pointer;")}>המשך בקניות</button>
            </div>
          </div>
        </>
      ) : (
        <div style={css("text-align:center;padding:80px 0;")}>
          <div style={css("font-size:40px;margin-bottom:16px;color:#c9b3ce;")}>❀</div>
          <p style={css("font-size:18px;color:var(--c-ink-mute);margin-bottom:24px;")}>העגלה ריקה עדיין.</p>
          <button onClick={() => go("catalog")} className="btn btn-primary" style={css("font-size:15.5px;")}>לקטלוג</button>
        </div>
      )}
    </div>
  );
}
