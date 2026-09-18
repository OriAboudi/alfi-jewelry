import React from "react";
import { css } from "../lib/css.js";

// Real order-driven progress — no hardcoded/fake steps. Maps the DB's
// payment_status + status (set by the admin in the Orders tab) onto four
// customer-facing stages.
export function computeOrderStages(order) {
  const status = order?.status || "התקבלה";
  const paid = order?.payment_status === "paid";
  const cancelled = status === "בוטלה";
  const packaged = ["בהכנה", "נשלחה", "בדרך", "נמסר"].includes(status);
  const shipped = ["נשלחה", "בדרך", "נמסר"].includes(status);

  const stages = [
    { title: "ההזמנה התקבלה", done: true },
    { title: "אישור הזמנה", done: paid },
    { title: "אריזה", done: packaged },
    { title: "משלוח", done: shipped },
  ];
  let currentSet = false;
  for (const s of stages) {
    if (!s.done && !currentSet) { s.current = true; currentSet = true; }
  }
  return { stages, cancelled };
}

export function OrderProgress({ order }) {
  const { stages, cancelled } = computeOrderStages(order);

  if (cancelled) {
    return (
      <div style={css("background:var(--c-danger-bg);border-radius:14px;padding:18px 20px;color:var(--c-danger);font-weight:600;text-align:center;")}>
        ההזמנה בוטלה
      </div>
    );
  }

  return (
    <div style={css("display:flex;justify-content:space-between;position:relative;")}>
      <div style={css("position:absolute;top:12px;right:5%;left:5%;height:2px;background:var(--c-line-strong);z-index:0;")} />
      {stages.map((s, i) => (
        <div key={i} style={css("position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;flex:1;")}>
          <div style={css(`width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;background:${s.done ? "var(--c-accent)" : s.current ? "#fff" : "var(--c-line-soft)"};border:2px solid ${s.done || s.current ? "var(--c-accent)" : "var(--c-line-strong)"};`)}>
            {s.done ? "✓" : ""}
          </div>
          <div style={css(`margin-top:8px;font-size:12.5px;text-align:center;font-weight:${s.done || s.current ? 700 : 500};color:${s.done || s.current ? "var(--c-ink)" : "var(--c-ink-faint)"};`)}>{s.title}</div>
        </div>
      ))}
    </div>
  );
}
