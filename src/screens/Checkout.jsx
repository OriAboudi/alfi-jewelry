import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { fmt, isValidEmail, isValidIsraeliPhone, formatIsraeliPhone } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { computeTotals, saleInfo, buildSets } from "../lib/pricing.js";
import { PriceTag } from "../components/PriceTag.jsx";
import { CouponInput } from "../components/CouponInput.jsx";
import { PrivacyConsent } from "../components/PrivacyConsent.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useSeoTags } from "../hooks/useSeoTags.js";
import { SkeletonText, SkeletonBlock, LoadingLabel } from "../components/Skeleton.jsx";
import { pickupAddressOf } from "../lib/delivery.js";

const fieldStyle = "width:100%;padding:12px 13px;border:1px solid var(--c-line-strong);border-radius:var(--r-md);font-size:14.5px;background:#fff;";
const fieldErrStyle = "width:100%;padding:12px 13px;border:1px solid #d98a72;border-radius:var(--r-md);font-size:14.5px;background:#fff;";
const labelStyle = "display:block;font-size:12.5px;color:var(--c-ink-mute);margin-bottom:5px;";
const errMsgStyle = "color:var(--c-danger);font-size:12px;margin-top:5px;";

// Address fields are only required for home delivery, not self pickup.
const CONTACT_FIELDS = ["first", "last", "email", "phone"];
const ADDRESS_FIELDS = ["address", "city"];

export function Checkout() {
  const { cart, products, loaded, customer, content: C, go, startCheckout, checkoutBusy, BACKEND, couponCode, couponPercent, couponError, couponBusy, applyCoupon, removeCoupon, offerSignupBeforePayment, deliveryMethod } = useStore();
  useSeoTags({ noindex: true });

  const [form, setForm] = useState({
    first: "", last: "", email: "", address: "", city: "", zip: "", phone: "",
  });
  // Signed-in customer: start from the account details (only fills fields
  // that are still empty, never overwrites what was typed).
  useEffect(() => {
    if (!customer) return;
    const [first = "", ...rest] = String(customer.name || "").trim().split(/\s+/);
    setForm((f) => ({
      ...f,
      first: f.first || first,
      last: f.last || rest.join(" "),
      email: f.email || customer.email || "",
      phone: f.phone || customer.phone || "",
    }));
  }, [customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [touched, setTouched] = useState({});
  // Chosen in the cart (store.deliveryMethod); shown here, changed in the cart.
  const isPickup = deliveryMethod === "pickup";
  const pickupAddress = pickupAddressOf(C);
  const requiredFields = isPickup ? CONTACT_FIELDS : [...CONTACT_FIELDS, ...ADDRESS_FIELDS];
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPhone = (e) => setForm((f) => ({ ...f, phone: formatIsraeliPhone(e.target.value) }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const lines = cart.map((c) => {
    const p = products.find((x) => String(x.id) === String(c.id)) || { name: "", price: 0, image: "" };
    return { ...c, p };
  });
  const productSets = buildSets(products, C);
  const { subtotal, regularSubtotal, saleSavings, shipping, discount, total, totalSaved, bundleDiscount, bundleSize, bundlePrice, setsApplied } = computeTotals(lines.map((l) => ({ id: l.id, price: l.p.price, regular: saleInfo(l.p).regular, qty: l.qty, bundle: !!l.p.in_bundle })), C, couponCode ? couponPercent : 0, deliveryMethod, productSets);
  // What home delivery would cost for this cart — shown on its option.
  const deliveryFee = subtotal >= Number(C.freeShipFrom || 500) ? 0 : Number(C.shipFee || 39);

  const errors = {
    first: form.first.trim() ? "" : "שדה חובה",
    last: form.last.trim() ? "" : "שדה חובה",
    email: form.email.trim() ? (isValidEmail(form.email) ? "" : "כתובת אימייל לא תקינה") : "שדה חובה",
    phone: form.phone.trim() ? (isValidIsraeliPhone(form.phone) ? "" : "מספר טלפון לא תקין") : "שדה חובה",
    address: form.address.trim() ? "" : "שדה חובה",
    city: form.city.trim() ? "" : "שדה חובה",
  };
  const formValid = requiredFields.every((k) => !errors[k]);

  const submit = () => {
    if (!agreed) setAgreeError("יש לאשר את מדיניות הפרטיות כדי להמשיך");
    if (!formValid) { setTouched(Object.fromEntries(requiredFields.map((k) => [k, true]))); return; }
    if (!agreed) return;
    // Pickup orders carry no delivery address; the server records the
    // pickup address from the admin setting itself.
    const pay = () => startCheckout(isPickup ? { ...form, address: "", city: "", zip: "" } : { ...form });
    // A guest who can still get the sign-up coupon is offered it here, right
    // before leaving for the payment page (pre-filled from this form);
    // payment then continues from the pop-up. Everyone else pays now.
    if (!offerSignupBeforePayment(pay, { name: `${form.first} ${form.last}`, email: form.email, phone: form.phone })) pay();
  };

  const field = (k, label, opts = {}) => (
    <div style={opts.span2 ? css("grid-column:1/-1;") : undefined}>
      <label htmlFor={`co-${k}`} style={css(labelStyle)}>{label}{opts.optional ? "" : <span aria-hidden="true"> *</span>}</label>
      <input
        id={`co-${k}`}
        required={!opts.optional}
        aria-required={!opts.optional}
        aria-invalid={!!(touched[k] && errors[k])}
        aria-describedby={touched[k] && errors[k] ? `co-${k}-err` : undefined}
        autoComplete={opts.autoComplete}
        value={form[k]}
        onChange={opts.onChange || set(k)}
        onBlur={blur(k)}
        type={opts.type || "text"}
        placeholder={opts.placeholder}
        style={css(touched[k] && errors[k] ? fieldErrStyle : fieldStyle)}
      />
      {touched[k] && errors[k] && <div id={`co-${k}-err`} role="alert" style={css(errMsgStyle)}>{errors[k]}</div>}
    </div>
  );

  const disabled = checkoutBusy || lines.length === 0;

  // Cart lines need the live catalog (names, prices, stock): until it
  // arrives, show the page's shape — never lines with no name and ₪0.
  if (!loaded && cart.length > 0) {
    return (
      <div className="r-container glass-card" style={css("max-width:1100px;margin:30px auto 64px;padding:40px var(--sp-5) 36px;")}>
        <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:var(--sp-6);")}>פרטי ההזמנה</h1>
        <LoadingLabel />
        {cart.slice(0, 3).map((c) => (
          <div key={c.id + c.size} style={css("display:flex;gap:16px;padding:22px 0;border-bottom:1px solid var(--c-line);")}>
            <SkeletonBlock style="width:96px;height:114px;flex:none;border-radius:var(--r-md);" />
            <div style={css("flex:1;")}><SkeletonText lines={3} width={["60%", "30%", "20%"]} height={14} /></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    // Only the form column sits on the cream glass panel; the order summary
    // sits straight on the site's floral background (light frosted layer
    // just for legibility).
    <div className="r-container" style={css("max-width:1100px;margin:30px auto 64px;")}>
      <div className="r-checkout-grid" style={css("display:grid;grid-template-columns:1fr 380px;gap:28px;align-items:start;")}>
        <div className="glass-card" style={css("padding:40px var(--sp-5) 48px;")}>
          <div style={css("display:flex;align-items:center;gap:12px;margin-bottom:var(--sp-6);font-size:14px;color:var(--c-ink-faint);")}>
            <nav aria-label="שלבי ההזמנה" style={css("display:contents;")}><button type="button" onClick={() => go("cart")} style={css("background:none;border:0;padding:0;font:inherit;text-align:right;color:inherit;cursor:pointer;")}>עגלה</button> <span aria-hidden="true">←</span> <span aria-current="step" style={css("color:var(--c-accent);font-weight:600;")}>תשלום</span> <span aria-hidden="true">←</span> <span>אישור</span></nav>
          </div>
          <div style={css("display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 16px;border:1px solid var(--c-line-strong);border-radius:var(--r-md);margin-bottom:var(--sp-6);")}>
            <div style={css("font-size:14.5px;line-height:1.6;")}>
              <div style={css("font-size:12.5px;color:var(--c-ink-mute);")}>אופן קבלת ההזמנה</div>
              <div style={css("font-weight:600;color:var(--c-ink);")}>{isPickup ? "איסוף עצמי – חינם" : `משלוח עד הבית – ${deliveryFee ? fmt(deliveryFee) : "חינם"}`}</div>
              {isPickup && <div style={css("color:var(--c-ink-soft);")}>{pickupAddress}</div>}
            </div>
            <button type="button" onClick={() => go("cart")} style={css("background:none;border:0;padding:0;font:inherit;font-size:13.5px;color:var(--c-accent-dark);text-decoration:underline;text-underline-offset:3px;cursor:pointer;flex:none;")}>שינוי בעגלה</button>
          </div>
          <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:var(--fs-h2);margin-bottom:20px;")}>{isPickup ? "פרטי התקשרות" : "פרטי משלוח"}</h2>
          <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:12px 14px;margin-bottom:var(--sp-6);")}>
            {field("first", "שם פרטי", { autoComplete: "given-name" })}
            {field("last", "שם משפחה", { autoComplete: "family-name" })}
            {field("email", "אימייל", { type: "email", placeholder: "לשליחת אישור ומעקב הזמנה", span2: true, autoComplete: "email" })}
            {field("phone", "טלפון", { type: "tel", onChange: setPhone, placeholder: "050-1234567", autoComplete: "tel" })}
            {!isPickup && field("address", "כתובת", { placeholder: "רחוב ומספר", autoComplete: "street-address" })}
            {!isPickup && field("city", "עיר", { autoComplete: "address-level2" })}
            {!isPickup && <div><label htmlFor="co-zip" style={css(labelStyle)}>מיקוד</label><input id="co-zip" autoComplete="postal-code" inputMode="numeric" value={form.zip} onChange={set("zip")} style={css(fieldStyle)} /></div>}
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
              <PriceTag product={l.p} qty={l.qty} size={14.5} showPercent={false} style="flex-direction:column;align-items:flex-end;gap:0;" />
            </div>
          ))}
          <div style={css("height:1px;background:var(--c-line-strong);margin:16px 0;")} />
          <div style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:10px;color:var(--c-ink-soft);")}><span>סכום ביניים</span><span>{fmt(regularSubtotal)}</span></div>
              {saleSavings > 0 && (
                <div style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:10px;color:var(--c-accent);")}><span>הנחת מבצע</span><span>-{fmt(saleSavings)}</span></div>
              )}
          {setsApplied.map((sa) => (
                <div key={sa.name} style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:10px;color:var(--c-accent);")}><span>סט {sa.name}{sa.count > 1 ? ` ×${sa.count}` : ""}</span><span>-{fmt(sa.discount)}</span></div>
              ))}
              {bundleDiscount > 0 && (
                <div style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:10px;color:var(--c-accent);")}><span>מבצע {bundleSize} ב־{fmt(bundlePrice)}</span><span>-{fmt(bundleDiscount)}</span></div>
              )}
              <div style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:10px;color:var(--c-ink-soft);")}><span>{isPickup ? "איסוף עצמי" : "משלוח"}</span><span>{shipping ? fmt(shipping) : "חינם"}</span></div>
          {couponCode && discount > 0 && (
            <div style={css("display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:10px;color:var(--c-success);")}><span>הנחת קופון ({couponPercent}%)</span><span>-{fmt(discount)}</span></div>
          )}

          {couponCode ? (
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--c-success-bg);border-radius:var(--r-sm);padding:9px 12px;margin-bottom:12px;font-size:13px;color:var(--c-success);")}>
              <span>קוד {couponCode} מופעל</span>
              <button type="button" onClick={removeCoupon} aria-label="הסרת הקופון" className="tap-target" style={css("background:none;border:0;padding:0;font:inherit;text-align:right;color:inherit;cursor:pointer;font-weight:700;")}>✕</button>
            </div>
          ) : (
            <CouponInput applyCoupon={applyCoupon} couponBusy={couponBusy} couponError={couponError} />
          )}

          <div style={css("height:1px;background:var(--c-line-strong);margin:16px 0;")} />
          <div style={css("display:flex;justify-content:space-between;font-size:19px;font-weight:700;margin-bottom:22px;")}><span>סה״כ</span><span>{fmt(total)}</span></div>
              {totalSaved > 0 && (
                <div style={css("text-align:center;font-size:13.5px;font-weight:600;color:var(--c-success);background:var(--c-success-bg);border-radius:var(--r-sm);padding:8px 12px;margin:-8px 0 16px;")}>חסכת {fmt(totalSaved)} בהזמנה הזו</div>
              )}
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
