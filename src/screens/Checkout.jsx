import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { fmt, isValidEmail, isValidIsraeliPhone, formatIsraeliPhone } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { computeTotals } from "../lib/pricing.js";
import { CouponInput } from "../components/CouponInput.jsx";
import { PrivacyConsent } from "../components/PrivacyConsent.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useSeoTags } from "../hooks/useSeoTags.js";

const fieldStyle = "width:100%;padding:12px 13px;border:1px solid var(--c-line-strong);border-radius:var(--r-md);font-size:14.5px;background:#fff;";
const fieldErrStyle = "width:100%;padding:12px 13px;border:1px solid #d98a72;border-radius:var(--r-md);font-size:14.5px;background:#fff;";
const labelStyle = "display:block;font-size:12.5px;color:var(--c-ink-mute);margin-bottom:5px;";
const errMsgStyle = "color:var(--c-danger);font-size:12px;margin-top:5px;";

const REQUIRED_FIELDS = ["first", "last", "email", "phone", "address", "city"];

export function Checkout() {
  const { cart, products, content: C, go, startCheckout, checkoutBusy, BACKEND, couponCode, couponPercent, couponError, couponBusy, applyCoupon, removeCoupon, maybeOfferSignupPopup } = useStore();
  useSeoTags({ noindex: true });

  // "Before a purchase": offer the sign-up coupon while the shopper is
  // filling in their order details (name/address/email), not by blocking
  // navigation from the cart button.
  useEffect(() => { maybeOfferSignupPopup(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm] = useState({
    first: "", last: "", email: "", address: "", city: "", zip: "", phone: "",
  });
  const [touched, setTouched] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPhone = (e) => setForm((f) => ({ ...f, phone: formatIsraeliPhone(e.target.value) }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const lines = cart.map((c) => {
    const p = products.find((x) => String(x.id) === String(c.id)) || { name: "", price: 0, image: "" };
    return { ...c, p };
  });
  const { subtotal, shipping, discount, total } = computeTotals(lines.map((l) => ({ price: l.p.price, qty: l.qty })), C, couponCode ? couponPercent : 0);

  const errors = {
    first: form.first.trim() ? "" : "שדה חובה",
    last: form.last.trim() ? "" : "שדה חובה",
    email: form.email.trim() ? (isValidEmail(form.email) ? "" : "כתובת אימייל לא תקינה") : "שדה חובה",
    phone: form.phone.trim() ? (isValidIsraeliPhone(form.phone) ? "" : "מספר טלפון לא תקין") : "שדה חובה",
    address: form.address.trim() ? "" : "שדה חובה",
    city: form.city.trim() ? "" : "שדה חובה",
  };
  const formValid = REQUIRED_FIELDS.every((k) => !errors[k]);

  const submit = () => {
    if (!agreed) setAgreeError("יש לאשר את מדיניות הפרטיות כדי להמשיך");
    if (!formValid) { setTouched(Object.fromEntries(REQUIRED_FIELDS.map((k) => [k, true]))); return; }
    if (!agreed) return;
    startCheckout({ ...form });
  };

  const field = (k, label, opts = {}) => (
    <div style={opts.span2 ? css("grid-column:1/-1;") : undefined}>
      <label style={css(labelStyle)}>{label}{opts.optional ? "" : " *"}</label>
      <input
        value={form[k]}
        onChange={opts.onChange || set(k)}
        onBlur={blur(k)}
        type={opts.type || "text"}
        placeholder={opts.placeholder}
        style={css(touched[k] && errors[k] ? fieldErrStyle : fieldStyle)}
      />
      {touched[k] && errors[k] && <div style={css(errMsgStyle)}>{errors[k]}</div>}
    </div>
  );

  const disabled = checkoutBusy || lines.length === 0;

  return (
    // Only the form column sits on the cream glass panel; the order summary
    // sits straight on the site's floral background (light frosted layer
    // just for legibility).
    <div className="r-container" style={css("max-width:1100px;margin:30px auto 64px;")}>
      <div className="r-checkout-grid" style={css("display:grid;grid-template-columns:1fr 380px;gap:28px;align-items:start;")}>
        <div className="glass-card" style={css("padding:40px var(--sp-5) 48px;")}>
          <div style={css("display:flex;align-items:center;gap:12px;margin-bottom:var(--sp-6);font-size:14px;color:var(--c-ink-faint);")}>
            <span onClick={() => go("cart")} style={css("cursor:pointer;")}>עגלה</span> ← <span style={css("color:var(--c-accent);font-weight:600;")}>תשלום</span> ← <span>אישור</span>
          </div>
          <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:var(--fs-h2);margin-bottom:20px;")}>פרטי משלוח</h2>
          <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:12px 14px;margin-bottom:var(--sp-6);")}>
            {field("first", "שם פרטי")}
            {field("last", "שם משפחה")}
            {field("email", "אימייל", { type: "email", placeholder: "לשליחת אישור ומעקב הזמנה", span2: true })}
            {field("phone", "טלפון", { onChange: setPhone, placeholder: "050-1234567" })}
            {field("address", "כתובת", { placeholder: "רחוב ומספר" })}
            {field("city", "עיר")}
            <div><label style={css(labelStyle)}>מיקוד</label><input value={form.zip} onChange={set("zip")} style={css(fieldStyle)} /></div>
          </div>
          <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:var(--fs-h2);margin-bottom:20px;")}>אופן תשלום</h2>
          <div style={css("font-size:14.5px;color:var(--c-ink-soft);line-height:1.7;")}>
            {BACKEND === "supabase" ? (
              <>לאחר שליחת ההזמנה תועברי לדף תשלום מאובטח של Takbull. פרטי האשראי אינם נשמרים באתר.</>
            ) : (
              <>לאחר שליחת ההזמנה ניצור איתך קשר לתיאום התשלום. עדיין אין חיבור לסליקת אשראי מקוונת באתר.</>
            )}
          </div>
        </div>
        <div className="r-sticky" style={css("background:rgba(251,248,245,.42);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);border:1px solid rgba(255,255,255,.6);border-radius:var(--r-lg);padding:28px;position:sticky;top:100px;")}>
          <h3 style={css("font-family:var(--font-serif);font-size:21px;margin-bottom:18px;")}>ההזמנה שלך</h3>
          {lines.map((l) => (
            <div key={l.id + l.size} style={css("display:flex;gap:12px;align-items:center;margin-bottom:14px;")}>
              <div style={thumb(l.p.image, GRAD_CARD, "width:48px;height:56px;flex:none;border-radius:var(--r-sm);")}>
                {!l.p.image && <div style={css("width:50%;aspect-ratio:1;border-radius:50%;background:conic-gradient(from 200deg,#efe9f1,#cfc0d2,#f6f0eb,#c3b6c6,#efe9f1);")} />}
              </div>
              <div style={css("flex:1;font-size:14px;min-width:0;")}><div style={css("font-weight:600;")}>{l.p.name}</div><div style={css("color:var(--c-ink-mute);font-size:12.5px;")}>כמות: {l.qty}</div></div>
              <div style={css("font-size:14.5px;font-weight:600;")}>{fmt(l.p.price * l.qty)}</div>
            </div>
          ))}
          <div style={css("height:1px;background:var(--c-line-strong);margin:16px 0;")} />
          <div style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:10px;color:var(--c-ink-soft);")}><span>סכום ביניים</span><span>{fmt(subtotal)}</span></div>
          <div style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:10px;color:var(--c-ink-soft);")}><span>משלוח</span><span>{shipping ? fmt(shipping) : "חינם"}</span></div>
          {couponCode && discount > 0 && (
            <div style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:10px;color:var(--c-success);")}><span>הנחת קופון ({couponPercent}%)</span><span>-{fmt(discount)}</span></div>
          )}

          {couponCode ? (
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--c-success-bg);border-radius:var(--r-sm);padding:9px 12px;margin-bottom:12px;font-size:13px;color:var(--c-success);")}>
              <span>קוד {couponCode} מופעל</span>
              <span onClick={removeCoupon} className="tap-target" style={css("cursor:pointer;font-weight:700;")}>✕</span>
            </div>
          ) : (
            <CouponInput applyCoupon={applyCoupon} couponBusy={couponBusy} couponError={couponError} />
          )}

          <div style={css("height:1px;background:var(--c-line-strong);margin:16px 0;")} />
          <div style={css("display:flex;justify-content:space-between;font-size:19px;font-weight:700;margin-bottom:22px;")}><span>סה״כ</span><span>{fmt(total)}</span></div>
          <div style={css("margin-bottom:16px;")}>
            <PrivacyConsent checked={agreed} onChange={(v) => { setAgreed(v); if (v) setAgreeError(""); }} error={agreeError} />
          </div>
          <button onClick={submit} disabled={disabled} className="btn btn-primary btn-block" style={css("font-size:16px;")}>
            {checkoutBusy ? "רגע…" : "שליחת ההזמנה"}
          </button>
          <div style={css("text-align:center;font-size:12px;color:var(--c-ink-faint);margin-top:12px;")}>🔒 תשלום מאובטח</div>
        </div>
      </div>
    </div>
  );
}
