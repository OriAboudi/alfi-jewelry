import React, { useState } from "react";
import { css } from "../lib/css.js";

// Small "apply a coupon code" input, shared by Cart and Checkout for
// shoppers who land there without ever seeing the sign-up pop-up or the
// product-page coupon field.
export function CouponInput({ applyCoupon, couponBusy, couponError }) {
  const [value, setValue] = useState("");
  return (
    <div style={css("margin-bottom:14px;")}>
      <div style={css("display:flex;gap:8px;")}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="קוד קופון"
          style={css("flex:1;min-width:0;padding:10px 12px;border:1px solid var(--c-line-strong);border-radius:var(--r-sm);font-size:13.5px;background:#fff;")}
        />
        <button
          onClick={() => applyCoupon(value)}
          disabled={couponBusy || !value.trim()}
          className="tap-target"
          style={css("padding:0 16px;background:var(--c-accent-fill);color:#fff;border:none;border-radius:var(--r-sm);font-size:13px;font-weight:600;cursor:pointer;flex:none;")}
        >
          {couponBusy ? "בודק…" : "החלה"}
        </button>
      </div>
      {couponError && <div style={css("color:var(--c-danger);font-size:12px;margin-top:6px;")}>{couponError}</div>}
    </div>
  );
}
