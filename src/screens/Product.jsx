import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { useStore } from "../context/StoreContext.jsx";
import { ZoomImage } from "../components/ZoomImage.jsx";
import { ProductCard } from "../components/ProductCard.jsx";

export function Product() {
  const { products, content: C, pid, qty, size, setQty, setSize, addCurrent, go } = useStore();

  const sel = products.find((p) => String(p.id) === String(pid)) || products[0] || {};
  const related = products.filter((p) => p.id !== sel.id).slice(0, 4);
  const sizes = sel.sizes || [];
  const images = sel.images && sel.images.length ? sel.images : (sel.image ? [sel.image] : []);
  const outOfStock = Number(sel.stock) <= 0;
  const freeShipFrom = Number(C.freeShipFrom || 500);
  const shipFee = Number(C.shipFee || 39);

  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => { setActiveIdx(0); }, [sel.id]);

  const [openInfo, setOpenInfo] = useState(null);
  const INFO_SECTIONS = [
    { key: "details", title: "פרטי המוצר", body: `${sel.material || "כסף 925"} · עבודת יד באולפן שלנו. כל תכשיט עשוי להיות שונה במעט מהתמונה — ייחודיות היא חלק מהקסם של עבודת יד.` },
    { key: "shipping", title: "משלוח והחזרות", body: `משלוח חינם בהזמנה מעל ${fmt(freeShipFrom)} (אחרת ${fmt(shipFee)}). ניתן להחזיר תוך 14 יום מקבלת המשלוח, באריזה המקורית.` },
    { key: "care", title: "טיפוח התכשיט", body: "יש להימנע ממגע עם מים, בשמים וכימיקלים. לאחסן בנפרד, בשקית סגורה, הרחק מאור שמש ישיר." },
  ];

  const addToCartLabel = outOfStock ? "אזל במלאי" : "הוספה לעגלה";

  return (
    <div className="r-container glass-card" style={css("max-width:1240px;margin:30px auto;padding:30px var(--sp-5) 64px;")}>
      <div style={css("font-size:13.5px;color:var(--c-ink-faint);margin-bottom:var(--sp-5);")}>
        <span onClick={() => go("catalog")} style={css("cursor:pointer;")}>קטלוג</span> &nbsp;/&nbsp; {sel.category} &nbsp;/&nbsp; {sel.name}
      </div>
      <div className="r-product-grid" style={css("display:grid;grid-template-columns:1.1fr .9fr;gap:54px;align-items:start;")}>
        <div>
          <div style={css("position:relative;aspect-ratio:1;border-radius:var(--r-lg);margin-bottom:14px;box-shadow:0 24px 50px rgba(140,90,60,.1);overflow:hidden;")}>
            {images[activeIdx] ? (
              <ZoomImage src={images[activeIdx]} radius={18} zoomScale={3} cursor="zoom-in" />
            ) : (
              <div style={css("width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:radial-gradient(120% 100% at 60% 25%,#f7e4d8,#ecd0bc);")}>
                <div style={css("width:44%;aspect-ratio:1;border-radius:50%;background:conic-gradient(from 210deg,#f3ece4,#d6c8b6,#f7f2ec,#cabfae,#e8e0d4,#f3ece4);box-shadow:0 24px 50px rgba(0,0,0,.16),inset 0 3px 12px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center;")}>
                  <div style={css("width:52%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 60% 30%,var(--c-bg),#e3c2a8);box-shadow:inset 0 2px 8px rgba(0,0,0,.12);")} />
                </div>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="no-scrollbar" style={css("display:flex;gap:10px;overflow-x:auto;padding-bottom:2px;")}>
              {images.map((url, i) => (
                <div
                  key={url + i}
                  onClick={() => setActiveIdx(i)}
                  className="tap-target"
                  style={css(`width:64px;height:64px;border-radius:var(--r-sm);overflow:hidden;cursor:pointer;flex:none;border:2px solid ${i === activeIdx ? "var(--c-accent)" : "transparent"};background:url("${url}") center/cover;opacity:${i === activeIdx ? 1 : .75};transition:opacity var(--dur) var(--ease);`)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="r-sticky" style={css("position:sticky;top:100px;")}>
          <div className="eyebrow" style={css("margin-bottom:12px;")}>{sel.category} · {sel.material}</div>
          <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:14px;")}>{sel.name}</h1>
          <div style={css("font-size:25px;margin-bottom:var(--sp-5);color:var(--c-ink);")}>{fmt(sel.price)}</div>
          {outOfStock && <div className="badge badge-danger" style={css("margin-bottom:var(--sp-4);font-size:13px;padding:6px 14px;")}>אזל במלאי</div>}
          {!outOfStock && Number(sel.stock) <= 5 && <div className="badge badge-accent" style={css("margin-bottom:var(--sp-4);font-size:13px;padding:6px 14px;")}>נותרו {sel.stock} יחידות בלבד</div>}
          <p style={css("font-size:16px;color:var(--c-ink-soft);margin-bottom:var(--sp-6);")}>{sel.description}</p>

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
            <button onClick={addCurrent} disabled={outOfStock} className="btn btn-primary" style={css("flex:1;font-size:16px;")}>{addToCartLabel}</button>
          </div>

          <div style={css("display:flex;flex-wrap:wrap;gap:14px;margin-bottom:8px;")}>
            <span style={css("font-size:12.5px;color:var(--c-ink-mute);display:flex;align-items:center;gap:5px;")}>🔒 תשלום מאובטח</span>
            <span style={css("font-size:12.5px;color:var(--c-ink-mute);display:flex;align-items:center;gap:5px;")}>↩ 14 יום החזרות</span>
            <span style={css("font-size:12.5px;color:var(--c-ink-mute);display:flex;align-items:center;gap:5px;")}>✋ עבודת יד באולפן שלנו</span>
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
          <div className="grid-4" style={css("gap:2px;")}>
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
