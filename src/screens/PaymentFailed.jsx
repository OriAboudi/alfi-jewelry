import React from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";
import { useSeoTags } from "../hooks/useSeoTags.js";

export function PaymentFailed() {
  const { go, paymentError } = useStore();
  useSeoTags({ noindex: true });

  return (
    <div className="r-container glass-card" style={css("max-width:680px;margin:30px auto;padding:64px var(--sp-5);text-align:center;")}>
      <div style={css("width:84px;height:84px;border-radius:50%;background:var(--c-danger);display:flex;align-items:center;justify-content:center;margin:0 auto 28px;font-size:40px;color:#fff;")}>✕</div>
      <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:14px;")}>התשלום לא הושלם</h1>
      <p style={css("font-size:16px;color:var(--c-ink-soft);margin-bottom:8px;")}>
        {paymentError || "אירעה בעיה בתהליך התשלום, וההזמנה לא הושלמה. לא בוצע חיוב."}
      </p>
      <div style={css("display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:28px;")}>
        <button onClick={() => go("checkout")} className="btn btn-primary" style={css("font-size:15.5px;")}>ניסיון תשלום נוסף</button>
        <button onClick={() => go("cart")} className="btn btn-secondary" style={css("font-size:15.5px;")}>חזרה לעגלה</button>
      </div>
    </div>
  );
}
