import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";
import { ZoomImage } from "../components/ZoomImage.jsx";
import { RedesignProductCard } from "../components/RedesignProductCard.jsx";
import { CardSlider } from "../components/CardSlider.jsx";
import { pathFor } from "../lib/routes.js";
import { useSeoTags } from "../hooks/useSeoTags.js";

export function Product() {
  const { products, content: C, pid, qty, size, setQty, setSize, addCurrent, go, setCatFilter, couponCode, couponPercent, couponError, couponBusy, applyCoupon, removeCoupon } = useStore();
  const [showCouponField, setShowCouponField] = useState(false);
  const [couponInput, setCouponInput] = useState("");

  const sel = products.find((p) => String(p.id) === String(pid)) || products[0] || {};
  const related = products.filter((p) => p.id !== sel.id).slice(0, 4);
  const moreProducts = products.filter((p) => p.id !== sel.id && !related.some((r) => r.id === p.id)).slice(0, 8);
  const sizes = sel.sizes || [];
  const images = sel.images && sel.images.length ? sel.images : (sel.image ? [sel.image] : []);
  const outOfStock = Number(sel.stock) <= 0;
  const freeShipFrom = Number(C.freeShipFrom || 500);
  const shipFee = Number(C.shipFee || 39);

  const canonicalPath = pathFor("product", { pid: sel.id, products });
  const canonicalUrl = `https://alfi-jewelry.com${canonicalPath}`;
  useSeoTags({
    title: sel.id ? `${sel.name} — ${sel.material || "כסף 925"} · ALFI` : undefined,
    description: sel.description ? sel.description.slice(0, 155) : undefined,
    canonical: sel.id ? canonicalPath : undefined,
    image: images[0],
    type: "product",
    jsonLd: sel.id ? [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: sel.name,
        description: sel.description,
        image: images,
        brand: { "@type": "Brand", name: "ALFI Jewelry" },
        offers: {
          "@type": "Offer",
          price: sel.price,
          priceCurrency: "ILS",
          availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          url: canonicalUrl,
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "בית", item: "https://alfi-jewelry.com/" },
          { "@type": "ListItem", position: 2, name: sel.category, item: `https://alfi-jewelry.com${pathFor("catalog", { catFilter: sel.category })}` },
          { "@type": "ListItem", position: 3, name: sel.name, item: canonicalUrl },
        ],
      },
    ] : undefined,
  });

  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => { setActiveIdx(0); }, [sel.id]);

  const [openInfo, setOpenInfo] = useState(null);
  const INFO_SECTIONS = [
    { key: "details", title: "פרטי המוצר", body: `${sel.material || "כסף 925"}. כל תכשיט עשוי להיות שונה במעט מהתמונה בשל תהליך הייצור.` },
    { key: "shipping", title: "משלוח והחזרות", body: `משלוח חינם בהזמנה מעל ${fmt(freeShipFrom)} (אחרת ${fmt(shipFee)}). ניתן להחזיר תוך 14 יום מקבלת המשלוח, באריזה המקורית.` },
    { key: "care", title: "טיפוח התכשיט", body: "יש להימנע ממגע עם מים, בשמים וכימיקלים. לאחסן בנפרד, בשקית סגורה, הרחק מאור שמש ישיר." },
  ];

  const addToCartLabel = outOfStock ? "אזל במלאי" : "הוספה לעגלה";

  return (
    <div className="r-container glass-card" style={css("max-width:1240px;margin:30px auto;padding:30px var(--sp-5) 64px;")}>
      <div style={css("font-size:13.5px;color:var(--c-ink-faint);margin-bottom:var(--sp-5);")}>
        <a href={pathFor("catalog", { catFilter: "הכל" })} onClick={(e) => { e.preventDefault(); setCatFilter("הכל"); go("catalog"); }} style={css("cursor:pointer;")}>קטלוג</a> &nbsp;/&nbsp; <a href={pathFor("catalog", { catFilter: sel.category })} onClick={(e) => { e.preventDefault(); setCatFilter(sel.category); go("catalog"); }} style={css("cursor:pointer;")}>{sel.category}</a> &nbsp;/&nbsp; {sel.name}
      </div>
      <div className="r-product-grid" style={css("display:grid;grid-template-columns:1.1fr .9fr;gap:54px;align-items:start;")}>
        <div>
          <div className="r-product-photo" style={css("position:relative;aspect-ratio:1;border-radius:var(--r-lg);margin-bottom:14px;box-shadow:0 24px 50px rgba(58,45,61,.1);overflow:hidden;")}>
            {images[activeIdx] ? (
              <ZoomImage src={images[activeIdx]} alt={`${sel.name} – תמונה ${activeIdx + 1}`} radius={18} zoomScale={3} cursor="zoom-in" />
            ) : (
              <div style={css("width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:radial-gradient(120% 100% at 60% 25%,#ede1ea,#ddc8dd);")}>
                <div style={css("width:44%;aspect-ratio:1;border-radius:50%;background:conic-gradient(from 210deg,#efe9f1,#cfc0d2,#f6f0eb,#c3b6c6,#ddd0e0,#efe9f1);box-shadow:0 24px 50px rgba(0,0,0,.16),inset 0 3px 12px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center;")}>
                  <div style={css("width:52%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 60% 30%,var(--c-bg),#d3b8d6);box-shadow:inset 0 2px 8px rgba(0,0,0,.12);")} />
                </div>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="no-scrollbar" style={css("display:flex;gap:10px;overflow-x:auto;overscroll-behavior-x:contain;padding-bottom:2px;")}>
              {images.map((url, i) => (
                <div
                  key={url + i}
                  onClick={() => setActiveIdx(i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`תמונה ${i + 1}`}
                  aria-current={i === activeIdx}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveIdx(i); } }}
                  className="tap-target"
                  style={css(`width:64px;height:64px;border-radius:var(--r-sm);overflow:hidden;cursor:pointer;flex:none;border:2px solid ${i === activeIdx ? "var(--c-accent)" : "transparent"};opacity:${i === activeIdx ? 1 : .75};transition:opacity var(--dur) var(--ease);`)}
                >
                  <img src={url} alt={`${sel.name} – תמונה ${i + 1}`} loading="lazy" decoding="async" style={css("width:100%;height:100%;object-fit:cover;object-position:center;")} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="r-sticky" style={css("position:sticky;top:100px;")}>
          <div className="eyebrow" style={css("margin-bottom:12px;")}>{sel.category} · {sel.material}</div>
          <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:14px;")}>{sel.name}</h1>
          <div style={css("display:flex;align-items:baseline;gap:10px;margin-bottom:var(--sp-4);")}>
            <div style={css(`font-size:25px;color:var(--c-ink);${couponCode ? "text-decoration:line-through;color:var(--c-ink-faint);font-size:18px;" : ""}`)}>{fmt(sel.price)}</div>
            {couponCode && <div style={css("font-size:25px;color:var(--c-accent);font-weight:700;")}>{fmt(sel.price - (sel.price * couponPercent) / 100)}</div>}
          </div>

          {couponCode ? (
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--c-success-bg);border-radius:var(--r-sm);padding:10px 14px;margin-bottom:var(--sp-5);font-size:13.5px;color:var(--c-success);")}>
              <span>קוד {couponCode} מופעל · {couponPercent}% הנחה (לאחר הנחה בקופה)</span>
              <span onClick={removeCoupon} className="tap-target" style={css("cursor:pointer;font-weight:700;")}>✕</span>
            </div>
          ) : showCouponField ? (
            <div style={css("margin-bottom:var(--sp-5);")}>
              <div style={css("display:flex;gap:8px;")}>
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="קוד קופון"
                  style={css("flex:1;padding:11px 13px;border:1px solid var(--c-line-strong);border-radius:var(--r-sm);font-size:14px;")}
                />
                <button
                  onClick={() => applyCoupon(couponInput)}
                  disabled={couponBusy || !couponInput.trim()}
                  className="tap-target"
                  style={css("padding:0 18px;background:var(--c-accent-fill);color:#fff;border:none;border-radius:var(--r-sm);font-size:13.5px;font-weight:600;cursor:pointer;")}
                >
                  {couponBusy ? "בודק…" : "החלה"}
                </button>
              </div>
              {couponError && <div style={css("color:var(--c-danger);font-size:12.5px;margin-top:6px;")}>{couponError}</div>}
            </div>
          ) : (
            <div onClick={() => setShowCouponField(true)} className="tap-target" style={css("cursor:pointer;font-size:13.5px;color:var(--c-accent);font-weight:600;margin-bottom:var(--sp-5);")}>יש לך קוד קופון?</div>
          )}

          {outOfStock && <div className="badge badge-danger" style={css("margin-bottom:var(--sp-4);font-size:13px;padding:6px 14px;")}>אזל במלאי</div>}
          {!outOfStock && Number(sel.stock) <= 5 && <div className="badge badge-accent" style={css("margin-bottom:var(--sp-4);font-size:13px;padding:6px 14px;")}>נותרו {sel.stock} יחידות בלבד</div>}
          <p style={css("font-family:var(--font-serif);font-weight:300;font-size:17px;line-height:1.75;letter-spacing:.01em;color:var(--c-ink-soft);margin-bottom:var(--sp-6);")}>{sel.description}</p>

          {sizes.length > 0 && (
            <>
              <div style={css("font-size:13px;font-weight:700;color:var(--c-ink-mute);margin-bottom:12px;letter-spacing:.04em;")}>מידה</div>
              <div style={css("display:flex;gap:10px;margin-bottom:var(--sp-5);flex-wrap:wrap;")}>
                {sizes.map((l) => {
                  const on = l === size;
                  return (
                    <button key={l} onClick={() => setSize(l)} className="tap-target" style={css(`min-width:50px;height:50px;padding:0 14px;border-radius:var(--r-md);border:1px solid ${on ? "var(--c-accent)" : "var(--c-line-strong)"};background:${on ? "var(--c-accent)" : "#fff"};color:${on ? "#fff" : "var(--c-ink)"};font-size:15px;font-weight:600;cursor:pointer;transition:.2s;`)}>{l}</button>
                  );
                })}
              </div>
            </>
          )}

          <div style={css("display:flex;gap:12px;margin-bottom:18px;")}>
            <div style={css("display:flex;align-items:center;border:1px solid var(--c-line-strong);border-radius:var(--r-md);overflow:hidden;background:#fff;")}>
              <button onClick={() => setQty(qty - 1)} disabled={qty <= 1} className="tap-target" style={css(`width:46px;border:none;background:#fff;font-size:20px;cursor:pointer;color:var(--c-ink-mute);opacity:${qty <= 1 ? .4 : 1};`)}>−</button>
              <span style={css("width:44px;text-align:center;font-size:16px;font-weight:600;")}>{qty}</span>
              <button onClick={() => setQty(Math.min(qty + 1, Number(sel.stock) || 0))} disabled={qty >= Number(sel.stock)} className="tap-target" style={css(`width:46px;border:none;background:#fff;font-size:20px;cursor:pointer;color:var(--c-ink-mute);opacity:${qty >= Number(sel.stock) ? .4 : 1};`)}>+</button>
            </div>
            <button onClick={addCurrent} disabled={outOfStock} className="btn btn-primary" style={css(`flex:1;font-size:16px;${outOfStock ? "background:var(--c-danger-bg);color:var(--c-danger);" : ""}`)}>{addToCartLabel}</button>
          </div>

          <div style={css("display:flex;flex-wrap:wrap;gap:14px;margin-bottom:8px;")}>
            <span style={css("font-size:12.5px;color:var(--c-ink-mute);display:flex;align-items:center;gap:5px;")}>🔒 תשלום מאובטח</span>
            <span style={css("font-size:12.5px;color:var(--c-ink-mute);display:flex;align-items:center;gap:5px;")}>↩ 14 יום החזרות</span>
            <span style={css("font-size:12.5px;color:var(--c-ink-mute);display:flex;align-items:center;gap:5px;")}>✨ כסף סטרלינג 925</span>
          </div>

          <div style={css("border-top:1px solid var(--c-line);margin-top:18px;")}>
            {INFO_SECTIONS.map((s) => {
              const open = openInfo === s.key;
              return (
                <div key={s.key} style={css("border-bottom:1px solid var(--c-line);")}>
                  <button
                    onClick={() => setOpenInfo(open ? null : s.key)}
                    aria-expanded={open}
                    className="tap-target"
                    style={css("width:100%;background:none;border:none;padding:18px 0;display:flex;justify-content:space-between;align-items:center;font-size:15px;font-weight:500;cursor:pointer;color:var(--c-ink);text-align:right;")}
                  >
                    {s.title}<span style={css(`color:var(--c-accent);font-size:20px;line-height:1;transition:transform var(--dur) var(--ease);transform:rotate(${open ? "45deg" : "0"});`)}>+</span>
                  </button>
                  {open && <p style={css("padding:0 0 18px;font-size:14.5px;color:var(--c-ink-soft);line-height:1.7;")}>{s.body}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div style={css("margin-top:70px;")}>
          <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:var(--fs-h1);margin-bottom:var(--sp-5);")}>אולי יתאים גם</h2>
          <div className="grid-4 r-related-grid">
            {related.map((p, i) => <RedesignProductCard key={p.id} product={p} index={i} />)}
          </div>
          <div className="r-related-slider">
            <CardSlider>
              {related.map((p, i) => <RedesignProductCard key={p.id} product={p} index={i} />)}
            </CardSlider>
          </div>
        </div>
      )}

      {moreProducts.length > 0 && (
        <div className="r-more-slider" style={css("margin-top:40px;")}>
          <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:var(--fs-h1);margin-bottom:var(--sp-5);")}>עוד תכשיטים שתאהבי</h2>
          <CardSlider>
            {moreProducts.map((p, i) => <RedesignProductCard key={p.id} product={p} index={i} />)}
          </CardSlider>
        </div>
      )}
    </div>
  );
}
