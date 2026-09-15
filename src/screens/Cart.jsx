import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { useStore } from "../context/StoreContext.jsx";

export function Cart() {
  const { cart, products, content: C, changeQty, removeItem, go, goCheckout } = useStore();

  const lines = cart.map((c) => {
    const p = products.find((x) => String(x.id) === String(c.id)) || { name: "", category: "", material: "", price: 0, image: "" };
    return { ...c, p };
  });
  const subtotal = lines.reduce((a, l) => a + l.p.price * l.qty, 0);
  const shipping = subtotal >= Number(C.freeShipFrom || 500) ? 0 : Number(C.shipFee || 39);
  const hasStockIssue = lines.some((l) => l.qty > Number(l.p.stock));

  return (
    <div className="r-container" style={css("max-width:1100px;margin:30px auto;padding:46px 40px 64px;background:rgba(250,245,239,.74);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);border-radius:22px;box-shadow:0 24px 70px rgba(70,50,40,.12);")}>
      <h1 className="r-title-lg" style={css("font-family:'Frank Ruhl Libre',serif;font-weight:300;font-size:44px;margin-bottom:32px;")}>עגלת הקניות</h1>

      {lines.length > 0 ? (
        <div className="r-cart-grid" style={css("display:grid;grid-template-columns:1fr 360px;gap:40px;align-items:start;")}>
          <div>
            {lines.map((l) => (
              <div key={l.id + l.size} style={css("display:flex;gap:16px;padding:22px 0;border-bottom:1px solid #ecdccd;")}>
                <div className="r-cart-thumb" style={thumb(l.p.image, GRAD_CARD, "width:104px;height:124px;flex:none;border-radius:12px;")}>
                  {!l.p.image && <div style={css("width:50%;aspect-ratio:1;border-radius:50%;background:conic-gradient(from 200deg,#f3ece4,#d6c8b6,#f7f2ec,#cabfae,#f3ece4);box-shadow:inset 0 2px 8px rgba(0,0,0,.12);")} />}
                </div>
                <div style={css("flex:1;display:flex;flex-direction:column;")}>
                  <div style={css("display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;")}>
                    <div>
                      <div style={css("font-family:'Frank Ruhl Libre',serif;font-size:19px;margin-bottom:3px;")}>{l.p.name}</div>
                      <div style={css("font-size:13.5px;color:#8a766a;")}>{l.p.category} · מידה {l.size} · {l.p.material}</div>
                      {Number(l.p.stock) <= 0 ? (
                        <div style={css("font-size:12.5px;color:#a85a44;font-weight:600;margin-top:4px;")}>אזל במלאי — יש להסיר מהעגלה</div>
                      ) : l.qty > Number(l.p.stock) && (
                        <div style={css("font-size:12.5px;color:#a85a44;font-weight:600;margin-top:4px;")}>נותרו {l.p.stock} יחידות בלבד במלאי</div>
                      )}
                    </div>
                    <div style={css("font-size:17px;font-weight:600;")}>{fmt(l.p.price * l.qty)}</div>
                  </div>
                  <div style={css("margin-top:auto;display:flex;justify-content:space-between;align-items:center;")}>
                    <div style={css("display:flex;align-items:center;border:1px solid #e0cdbd;border-radius:10px;overflow:hidden;background:#fff;")}>
                      <button onClick={() => changeQty(l.id, l.size, -1)} style={css("width:38px;height:40px;border:none;background:#fff;font-size:18px;cursor:pointer;color:#8a766a;")}>−</button>
                      <span style={css("width:38px;text-align:center;font-size:15px;font-weight:600;")}>{l.qty}</span>
                      <button onClick={() => changeQty(l.id, l.size, 1)} disabled={l.qty >= Number(l.p.stock)} style={css(`width:38px;height:40px;border:none;background:#fff;font-size:18px;cursor:pointer;color:#8a766a;opacity:${l.qty >= Number(l.p.stock) ? .4 : 1};`)}>+</button>
                    </div>
                    <button onClick={() => removeItem(l.id, l.size)} style={css("background:none;border:none;cursor:pointer;font-size:13.5px;color:#a85a44;")}>הסרה</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="r-sticky" style={css("background:#f3e8dd;border-radius:18px;padding:28px;position:sticky;top:100px;")}>
            <h3 style={css("font-family:'Frank Ruhl Libre',serif;font-size:22px;margin-bottom:20px;")}>סיכום הזמנה</h3>
            <div style={css("display:flex;justify-content:space-between;font-size:15px;margin-bottom:12px;color:#6e5648;")}><span>סכום ביניים</span><span>{fmt(subtotal)}</span></div>
            <div style={css("display:flex;justify-content:space-between;font-size:15px;margin-bottom:12px;color:#6e5648;")}><span>משלוח</span><span>{shipping ? fmt(shipping) : "חינם"}</span></div>
            <div style={css("height:1px;background:#dcc6b4;margin:16px 0;")} />
            <div style={css("display:flex;justify-content:space-between;font-size:20px;font-weight:700;margin-bottom:22px;")}><span>סה״כ</span><span>{fmt(subtotal + shipping)}</span></div>
            <button onClick={goCheckout} disabled={hasStockIssue} style={css(`width:100%;padding:15px;background:#bd7355;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:12px;opacity:${hasStockIssue ? .5 : 1};`)}>למעבר לתשלום</button>
            {hasStockIssue && <div style={css("color:#a85a44;font-size:12.5px;text-align:center;margin-bottom:12px;")}>יש לעדכן את הכמות בפריטים שאזלו במלאי</div>}
            <button onClick={() => go("catalog")} style={css("width:100%;padding:13px;background:transparent;border:none;font-size:14.5px;color:#8a766a;cursor:pointer;")}>המשך בקניות</button>
          </div>
        </div>
      ) : (
        <div style={css("text-align:center;padding:80px 0;")}>
          <div style={css("font-size:40px;margin-bottom:16px;color:#d6bda9;")}>❀</div>
          <p style={css("font-size:18px;color:#8a766a;margin-bottom:24px;")}>העגלה ריקה עדיין.</p>
          <button onClick={() => go("catalog")} style={css("padding:14px 30px;background:#bd7355;color:#fff;border:none;border-radius:12px;font-size:15.5px;font-weight:600;cursor:pointer;")}>לקטלוג</button>
        </div>
      )}
    </div>
  );
}
