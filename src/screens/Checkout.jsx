import React, { useState } from "react";
import { css } from "../lib/css.js";
import { fmt, isValidEmail, isValidIsraeliPhone, formatIsraeliPhone } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { useStore } from "../context/StoreContext.jsx";

const fieldStyle = "width:100%;padding:13px 15px;border:1px solid var(--c-line-strong);border-radius:var(--r-md);font-size:15px;background:#fff;";
const fieldErrStyle = "width:100%;padding:13px 15px;border:1px solid #d98a72;border-radius:var(--r-md);font-size:15px;background:#fff;";
const labelStyle = "display:block;font-size:13px;color:var(--c-ink-mute);margin-bottom:7px;";
const errMsgStyle = "color:var(--c-danger);font-size:12px;margin-top:5px;";

const REQUIRED_FIELDS = ["first", "last", "email", "phone", "address", "city"];

export function Checkout() {
  const { cart, products, content: C, go, startCheckout, checkoutBusy, BACKEND } = useStore();

  const [form, setForm] = useState({
    first: "", last: "", email: "", address: "", city: "", zip: "", phone: "",
  });
  const [touched, setTouched] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPhone = (e) => setForm((f) => ({ ...f, phone: formatIsraeliPhone(e.target.value) }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const lines = cart.map((c) => {
    const p = products.find((x) => String(x.id) === String(c.id)) || { name: "", price: 0, image: "" };
    return { ...c, p };
  });
  const subtotal = lines.reduce((a, l) => a + l.p.price * l.qty, 0);
  const shipping = subtotal >= Number(C.freeShipFrom || 500) ? 0 : Number(C.shipFee || 39);

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
    if (!formValid) { setTouched(Object.fromEntries(REQUIRED_FIELDS.map((k) => [k, true]))); return; }
    startCheckout({ ...form });
  };

  const field = (k, label, opts = {}) => (
    <div className={opts.span2 ? "r-field-span2" : undefined} style={opts.span2 ? css("grid-column:1/3;") : undefined}>
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
    <div className="r-container glass-card" style={css("max-width:1100px;margin:30px auto;padding:46px var(--sp-5) 64px;")}>
      <div style={css("display:flex;align-items:center;gap:12px;margin-bottom:var(--sp-6);font-size:14px;color:var(--c-ink-faint);")}>
        <span onClick={() => go("cart")} style={css("cursor:pointer;")}>עגלה</span> ← <span style={css("color:var(--c-accent);font-weight:600;")}>תשלום</span> ← <span>אישור</span>
      </div>
      <div className="r-checkout-grid" style={css("display:grid;grid-template-columns:1fr 380px;gap:44px;align-items:start;")}>
        <div>
          <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:var(--fs-h2);margin-bottom:20px;")}>פרטי משלוח</h2>
          <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:var(--sp-6);")}>
            {field("first", "שם פרטי")}
            {field("last", "שם משפחה")}
            {field("email", "אימייל", { type: "email", placeholder: "לשליחת אישור ומעקב הזמנה", span2: true })}
            {field("phone", "טלפון", { onChange: setPhone, placeholder: "050-1234567" })}
            {field("address", "כתובת", { placeholder: "רחוב ומספר" })}
            {field("city", "עיר")}
            <div><label style={css(labelStyle)}>מיקוד</label><input value={form.zip} onChange={set("zip")} style={css(fieldStyle)} /></div>
          </div>
          <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:var(--fs-h2);margin-bottom:20px;")}>אופן תשלום</h2>
          <div className="card" style={css("padding:18px 20px;font-size:14.5px;color:var(--c-ink-soft);line-height:1.7;display:flex;align-items:center;gap:10px;background:var(--c-line-soft);border-color:transparent;")}>
            {BACKEND === "supabase" ? (
              <>🔒 לאחר שליחת ההזמנה תועברי לדף תשלום מאובטח של Takbull. פרטי האשראי אינם נשמרים באתר.</>
            ) : (
              <>לאחר שליחת ההזמנה ניצור איתך קשר לתיאום התשלום. עדיין אין חיבור לסליקת אשראי מקוונת באתר.</>
            )}
          </div>
        </div>
        <div className="r-sticky" style={css("background:var(--c-line-soft);border-radius:var(--r-lg);padding:28px;position:sticky;top:100px;")}>
          <h3 style={css("font-family:var(--font-serif);font-size:21px;margin-bottom:18px;")}>ההזמנה שלך</h3>
          {lines.map((l) => (
            <div key={l.id + l.size} style={css("display:flex;gap:12px;align-items:center;margin-bottom:14px;")}>
              <div style={thumb(l.p.image, GRAD_CARD, "width:48px;height:56px;flex:none;border-radius:var(--r-sm);")}>
                {!l.p.image && <div style={css("width:50%;aspect-ratio:1;border-radius:50%;background:conic-gradient(from 200deg,#f3ece4,#d6c8b6,#f7f2ec,#cabfae,#f3ece4);")} />}
              </div>
              <div style={css("flex:1;font-size:14px;min-width:0;")}><div style={css("font-weight:600;")}>{l.p.name}</div><div style={css("color:var(--c-ink-mute);font-size:12.5px;")}>כמות: {l.qty}</div></div>
              <div style={css("font-size:14.5px;font-weight:600;")}>{fmt(l.p.price * l.qty)}</div>
            </div>
          ))}
          <div style={css("height:1px;background:var(--c-line-strong);margin:16px 0;")} />
          <div style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:10px;color:var(--c-ink-soft);")}><span>סכום ביניים</span><span>{fmt(subtotal)}</span></div>
          <div style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:10px;color:var(--c-ink-soft);")}><span>משלוח</span><span>{shipping ? fmt(shipping) : "חינם"}</span></div>
          <div style={css("height:1px;background:var(--c-line-strong);margin:16px 0;")} />
          <div style={css("display:flex;justify-content:space-between;font-size:19px;font-weight:700;margin-bottom:22px;")}><span>סה״כ</span><span>{fmt(subtotal + shipping)}</span></div>
          <button onClick={submit} disabled={disabled} className="btn btn-primary btn-block" style={css("font-size:16px;")}>
            {checkoutBusy ? "רגע…" : "שליחת ההזמנה"}
          </button>
          <div style={css("text-align:center;font-size:12px;color:var(--c-ink-faint);margin-top:12px;")}>🔒 תשלום מאובטח</div>
        </div>
      </div>

      <div className="sticky-mobile-spacer" />
      <div className="sticky-mobile-bar" style={css("display:flex;gap:12px;align-items:center;")}>
        <div style={css("flex:1;")}>
          <div style={css("font-size:12px;color:var(--c-ink-mute);")}>סה״כ לתשלום</div>
          <div style={css("font-size:17px;font-weight:700;")}>{fmt(subtotal + shipping)}</div>
        </div>
        <button onClick={submit} disabled={disabled} className="btn btn-primary" style={css("flex:none;padding:13px 26px;")}>
          {checkoutBusy ? "רגע…" : "שליחת ההזמנה"}
        </button>
      </div>
    </div>
  );
}
