import React from "react";
import { css } from "../../lib/css.js";
import { useStore } from "../../context/StoreContext.jsx";
import { lbl, inp } from "./shared.jsx";

export function PaymentTestsTab() {
  const { BACKEND, createTestPayment, testPaymentBusy } = useStore();
  const [testAmount, setTestAmount] = React.useState("5");

  return (
    <div>
      <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:24px;margin-bottom:12px;")}>בדיקות תשלום</h2>
      {BACKEND !== "supabase" ? (
        <div style={css("background:#fff;border:1px dashed #e0cdbd;border-radius:14px;padding:40px;text-align:center;color:#8a766a;")}>
          זמין רק כשה‑backend הוא Supabase (יש חיבור לשערי תשלום אמיתיים).
        </div>
      ) : (
        <div style={css("background:#fff;border:1px solid #ecdccd;border-radius:14px;padding:24px;max-width:420px;")}>
          <p style={css("font-size:13.5px;color:#8a766a;margin-bottom:18px;line-height:1.6;")}>
            יוצר הזמנת בדיקה אמיתית בסכום חופשי (לא לפי מחירי המוצרים) ופותח את דף
            התשלום בלשונית חדשה. שימושי כי מחירי המוצרים גבוהים ממגבלת ה‑₪5 של
            סביבת הבדיקות של Takbull. פעולה זו זמינה רק למנהל מחובר.
          </p>
          <div style={css("display:flex;flex-direction:column;gap:14px;")}>
            <div>
              <label style={css(lbl)}>סכום (₪)</label>
              <input type="number" min="0.01" step="0.01" value={testAmount} onChange={(e) => setTestAmount(e.target.value)} style={css(inp)} />
            </div>
            <button
              onClick={() => createTestPayment(Number(testAmount))}
              disabled={testPaymentBusy || !(Number(testAmount) > 0)}
              style={css(`padding:13px;background:#bd7355;color:#fff;border:none;border-radius:11px;font-size:15px;font-weight:600;cursor:pointer;opacity:${testPaymentBusy || !(Number(testAmount) > 0) ? 0.6 : 1};`)}
            >
              {testPaymentBusy ? "יוצר…" : "פתיחת דף תשלום בדיקה"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
