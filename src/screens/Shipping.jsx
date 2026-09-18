import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";

// Unlike Privacy/Terms, the free-shipping threshold, shipping fee, and
// 14-day return window are already real, admin-configured facts used
// elsewhere on the site (Product.jsx's "משלוח והחזרות" accordion, Home.jsx's
// FAQ) — so this page states those directly instead of a TODO placeholder.
// Anything not already tracked by the site (carrier, delivery time,
// exchanges, international shipping) stays a clearly marked TODO.
const TODO_SECTIONS = ["זמן אספקה משוער", "משלוחים לחו\"ל", "מדיניות החלפות"];

export function Shipping() {
  const { content: C, go } = useStore();
  const freeShipFrom = Number(C.freeShipFrom || 500);
  const shipFee = Number(C.shipFee || 39);

  return (
    <div className="r-container glass-card" style={css("max-width:720px;margin:30px auto;padding:56px var(--sp-5) 70px;")}>
      <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:22px;text-align:center;")}>משלוח והחזרות</h1>

      <div style={css("background:var(--c-success-bg);color:var(--c-success);border-radius:var(--r-md);padding:16px 18px;font-size:15px;line-height:1.8;margin-bottom:24px;")}>
        משלוח חינם בהזמנה מעל {fmt(freeShipFrom)} (אחרת {fmt(shipFee)}). ניתן להחזיר תוך 14 יום מקבלת המשלוח, באריזה המקורית.
      </div>

      <div style={css("background:var(--c-accent-soft);color:var(--c-accent-dark);border-radius:var(--r-md);padding:16px 18px;font-size:14px;line-height:1.7;margin-bottom:36px;")}>
        ⚠️ שאר הסעיפים בעמוד זה טרם הושלמו ומהווים שלד ארגוני בלבד — יש להשלים אותם בתוכן הרשמי והמדויק של העסק לפני פרסום.
      </div>

      {TODO_SECTIONS.map((s) => (
        <div key={s} style={css("margin-bottom:24px;")}>
          <h2 style={css("font-family:var(--font-serif);font-size:18px;margin-bottom:6px;")}>{s}</h2>
          <p style={css("font-size:14.5px;color:var(--c-ink-mute);")}>[TODO — להשלמה על ידי בעל/ת העסק]</p>
        </div>
      ))}

      <button onClick={() => go("home")} className="btn btn-secondary" style={css("margin-top:12px;")}>חזרה לדף הבית</button>
    </div>
  );
}
