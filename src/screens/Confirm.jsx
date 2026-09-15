import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { FlowerMark } from "../components/Ornaments.jsx";
import { OrderProgress } from "../components/OrderProgress.jsx";
import { useStore } from "../context/StoreContext.jsx";

const POLL_ATTEMPTS = 6;
const POLL_DELAY_MS = 2000;

export function Confirm() {
  const { lastOrder: lo, go, refreshOrder } = useStore();
  const [loading, setLoading] = useState(!!lo?.id);
  const [stillVerifying, setStillVerifying] = useState(false);

  // Right after redirect, the row we have locally predates the actual
  // payment result (the webhook/IPN hasn't necessarily landed yet). Poll the
  // real order a few times so "paid" reliably shows once it's true, instead
  // of forever showing the pre-payment "pending" snapshot.
  useEffect(() => {
    if (!lo?.id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
        let fresh;
        try { fresh = await refreshOrder(lo.id); } catch { break; }
        if (cancelled) return;
        if (fresh?.payment_status === "paid" || attempt === POLL_ATTEMPTS - 1) {
          if (attempt > 0 && fresh?.payment_status !== "paid") setStillVerifying(true);
          break;
        }
        await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lo?.id]);

  const number = lo ? lo.number : "#ALF‑2418";
  const total = lo ? fmt(lo.total) : fmt(0);
  const addr = lo?.shipping_address || {};
  const fullName = [addr.first, addr.last].filter(Boolean).join(" ") || "—";

  if (loading) {
    return (
      <div className="r-container" style={css("max-width:680px;margin:30px auto;padding:80px 40px;text-align:center;background:rgba(250,245,239,.74);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);border-radius:22px;box-shadow:0 24px 70px rgba(70,50,40,.12);")}>
        <div style={css("width:44px;height:44px;border-radius:50%;border:3px solid #e7d8cb;border-top-color:#bd7355;margin:0 auto 22px;animation:r-spin 0.8s linear infinite;")} />
        <style>{"@keyframes r-spin{to{transform:rotate(360deg)}}"}</style>
        <p style={css("font-size:16px;color:#6e5648;")}>מאמתים את פרטי התשלום…</p>
      </div>
    );
  }

  return (
    <div className="r-container" style={css("max-width:680px;margin:30px auto;padding:64px 40px;text-align:center;background:rgba(250,245,239,.74);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);border-radius:22px;box-shadow:0 24px 70px rgba(70,50,40,.12);")}>
      <div style={css("width:84px;height:84px;border-radius:50%;background:#bd7355;display:flex;align-items:center;justify-content:center;margin:0 auto 28px;font-size:40px;color:#fff;")}>✓</div>
      <FlowerMark width={150} height={50} style={{ margin: "0 auto 18px", display: "block" }} />
      <h1 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:300;font-size:42px;margin-bottom:14px;")}>תודה על ההזמנה!</h1>
      <p style={css("font-size:17px;color:#6e5648;margin-bottom:8px;")}>ההזמנה שלך התקבלה.{addr.email ? ` אישור נשלח אל ${addr.email}.` : ""}</p>
      <div style={css("display:inline-block;background:#f3e8dd;border-radius:100px;padding:9px 22px;font-size:15px;font-weight:600;margin:20px 0 8px;")}>מספר הזמנה: <span style={css("color:#bd7355;")}>{number}</span></div>

      {stillVerifying && (
        <div style={css("background:#fbf1e9;border-radius:12px;padding:12px 18px;font-size:13.5px;color:#8a766a;margin:14px 0;")}>
          עדיין מאמתים מול חברת הסליקה — נעדכן אותך במייל כשהתשלום יאושר סופית.
        </div>
      )}

      <div style={css("background:#fff;border:1px solid #ecdccd;border-radius:18px;padding:26px 28px;margin:24px 0;")}>
        <OrderProgress order={lo} />
      </div>

      <div style={css("background:#fff;border:1px solid #ecdccd;border-radius:18px;padding:26px;text-align:right;margin-bottom:20px;")}>
        <h3 style={css("font-family:'Frank Ruhl Libre',serif;font-size:19px;margin-bottom:16px;")}>פרטי הלקוח</h3>
        <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;")}>
          <div><div style={css("color:#8a766a;font-size:12.5px;margin-bottom:2px;")}>שם מלא</div><div>{fullName}</div></div>
          <div><div style={css("color:#8a766a;font-size:12.5px;margin-bottom:2px;")}>אימייל</div><div>{addr.email || "—"}</div></div>
          <div><div style={css("color:#8a766a;font-size:12.5px;margin-bottom:2px;")}>טלפון</div><div>{addr.phone || "—"}</div></div>
          <div><div style={css("color:#8a766a;font-size:12.5px;margin-bottom:2px;")}>תשלום</div><div>{lo?.payment_status === "paid" ? "שולם" : "ממתין לאישור"} · Takbull</div></div>
          <div className="r-field-span2" style={css("grid-column:1/3;")}><div style={css("color:#8a766a;font-size:12.5px;margin-bottom:2px;")}>כתובת למשלוח</div><div>{[addr.address, addr.city, addr.zip].filter(Boolean).join(", ") || "—"}</div></div>
        </div>
      </div>

      <div style={css("background:#fff;border:1px solid #ecdccd;border-radius:18px;padding:26px;text-align:right;margin-bottom:28px;")}>
        <div style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:14px;")}><span style={css("color:#8a766a;")}>סה״כ לתשלום</span><span style={css("font-weight:700;")}>{total}</span></div>
        <div style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:14px;")}><span style={css("color:#8a766a;")}>משלוח אל</span><span>{addr.city || "תל אביב, ישראל"}</span></div>
        <div style={css("display:flex;justify-content:space-between;font-size:14.5px;")}><span style={css("color:#8a766a;")}>הגעה משוערת</span><span>3–5 ימי עסקים</span></div>
      </div>
      <div style={css("display:flex;gap:14px;justify-content:center;flex-wrap:wrap;")}>
        <button onClick={() => go("status")} style={css("padding:15px 30px;background:#bd7355;color:#fff;border:none;border-radius:12px;font-size:15.5px;font-weight:600;cursor:pointer;")}>מעקב אחר ההזמנה</button>
        <button onClick={() => go("home")} style={css("padding:15px 30px;background:#fff;color:#3a2c25;border:1px solid #e0cdbd;border-radius:12px;font-size:15.5px;font-weight:500;cursor:pointer;")}>חזרה לחנות</button>
      </div>
    </div>
  );
}
