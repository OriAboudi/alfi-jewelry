import React from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";

export function PaymentFailed() {
  const { go, paymentError } = useStore();

  return (
    <div className="r-container" style={css("max-width:680px;margin:30px auto;padding:64px 40px;text-align:center;background:rgba(250,245,239,.74);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);border-radius:22px;box-shadow:0 24px 70px rgba(70,50,40,.12);")}>
      <div style={css("width:84px;height:84px;border-radius:50%;background:#a85a44;display:flex;align-items:center;justify-content:center;margin:0 auto 28px;font-size:40px;color:#fff;")}>✕</div>
      <h1 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:300;font-size:36px;margin-bottom:14px;")}>התשלום לא הושלם</h1>
      <p style={css("font-size:16px;color:#6e5648;margin-bottom:8px;")}>
        {paymentError || "אירעה בעיה בתהליך התשלום, וההזמנה לא הושלמה. לא בוצע חיוב."}
      </p>
      <div style={css("display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:28px;")}>
        <button onClick={() => go("checkout")} style={css("padding:15px 30px;background:#bd7355;color:#fff;border:none;border-radius:12px;font-size:15.5px;font-weight:600;cursor:pointer;")}>ניסיון תשלום נוסף</button>
        <button onClick={() => go("cart")} style={css("padding:15px 30px;background:#fff;color:#3a2c25;border:1px solid #e0cdbd;border-radius:12px;font-size:15.5px;font-weight:500;cursor:pointer;")}>חזרה לעגלה</button>
      </div>
    </div>
  );
}
