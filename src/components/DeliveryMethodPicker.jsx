import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { pickupAddressOf } from "../lib/delivery.js";

/**
 * DeliveryMethodPicker — home delivery vs. self pickup, chosen in the cart
 * (the choice lives in the store as `deliveryMethod`, so checkout and the
 * order use it). `deliveryFee` is what home delivery costs for this cart.
 */
export function DeliveryMethodPicker({ value, onChange, deliveryFee, content }) {
  const options = [
    { key: "delivery", label: "משלוח עד הבית", price: deliveryFee ? fmt(deliveryFee) : "חינם" },
    { key: "pickup", label: "איסוף עצמי", price: "חינם" },
  ];
  return (
    <div role="radiogroup" aria-label="אופן קבלת ההזמנה" style={css("display:flex;flex-direction:column;gap:8px;margin-bottom:16px;")}>
      <div style={css("font-size:13px;font-weight:700;letter-spacing:.04em;color:var(--c-ink-mute);margin-bottom:2px;")}>אופן קבלת ההזמנה</div>
      {options.map((o) => {
        const on = value === o.key;
        return (
          <label key={o.key} style={css(`display:flex;align-items:center;gap:10px;padding:11px 12px;border:1.5px solid ${on ? "var(--c-accent)" : "var(--c-line-strong)"};border-radius:var(--r-md);cursor:pointer;background:${on ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.35)"};`)}>
            <input type="radio" name="delivery-method" value={o.key} checked={on} onChange={() => onChange(o.key)} style={css("width:18px;height:18px;margin:0;accent-color:var(--c-accent);flex:none;")} />
            <span style={css("flex:1;font-size:14.5px;color:var(--c-ink);")}>{o.label}</span>
            <span style={css("font-size:14px;font-weight:600;color:var(--c-ink);")}>{o.price}</span>
          </label>
        );
      })}
      {value === "pickup" && (
        <div aria-live="polite" style={css("padding:10px 12px;border-radius:var(--r-md);background:rgba(255,255,255,.6);font-size:14px;line-height:1.5;color:var(--c-ink-soft);")}>
          <div style={css("font-size:12px;color:var(--c-ink-mute);")}>כתובת לאיסוף</div>
          <div style={css("color:var(--c-ink);font-weight:600;")}>{pickupAddressOf(content)}</div>
        </div>
      )}
    </div>
  );
}
