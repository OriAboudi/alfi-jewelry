import React, { useEffect, useState } from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { useStore } from "../context/StoreContext.jsx";
import { ZoomImage } from "../components/ZoomImage.jsx";

export function Product() {
  const { products, pid, qty, size, setQty, setSize, addCurrent, openProduct, go } = useStore();

  const sel = products.find((p) => String(p.id) === String(pid)) || products[0] || {};
  const related = products.filter((p) => p.id !== sel.id).slice(0, 4);
  const sizes = sel.sizes || [];
  const images = sel.images && sel.images.length ? sel.images : (sel.image ? [sel.image] : []);

  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => { setActiveIdx(0); }, [sel.id]);

  return (
    <div className="r-container" style={css("max-width:1240px;margin:30px auto;padding:30px 40px 64px;background:rgba(250,245,239,.74);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);border-radius:22px;box-shadow:0 24px 70px rgba(70,50,40,.12);")}>
      <div style={css("font-size:13.5px;color:#a89486;margin-bottom:26px;")}>
        <span onClick={() => go("catalog")} style={css("cursor:pointer;")}>קטלוג</span> &nbsp;/&nbsp; {sel.category} &nbsp;/&nbsp; {sel.name}
      </div>
      <div className="r-product-grid" style={css("display:grid;grid-template-columns:1.1fr .9fr;gap:54px;align-items:start;")}>
        <div>
          <div
            style={css("position:relative;aspect-ratio:1;border-radius:18px;margin-bottom:14px;box-shadow:0 24px 50px rgba(140,90,60,.1);overflow:hidden;")}
          >
            {images[activeIdx] ? (
              <ZoomImage src={images[activeIdx]} radius={18} zoomScale={3} cursor="zoom-in" />
            ) : (
              <div style={css("width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:radial-gradient(120% 100% at 60% 25%,#f7e4d8,#ecd0bc);")}>
                <div style={css("width:44%;aspect-ratio:1;border-radius:50%;background:conic-gradient(from 210deg,#f3ece4,#d6c8b6,#f7f2ec,#cabfae,#e8e0d4,#f3ece4);box-shadow:0 24px 50px rgba(0,0,0,.16),inset 0 3px 12px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center;")}>
                  <div style={css("width:52%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 60% 30%,#faf5ef,#e3c2a8);box-shadow:inset 0 2px 8px rgba(0,0,0,.12);")} />
                </div>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div style={css("display:flex;gap:10px;")}>
              {images.map((url, i) => (
                <div
                  key={url + i}
                  onClick={() => setActiveIdx(i)}
                  style={css(`width:72px;height:72px;border-radius:10px;overflow:hidden;cursor:pointer;flex:none;border:2px solid ${i === activeIdx ? "#bd7355" : "transparent"};background:url("${url}") center/cover;opacity:${i === activeIdx ? 1 : .75};transition:.2s;`)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="r-sticky" style={css("position:sticky;top:100px;")}>
          <div style={css("font-size:13px;letter-spacing:.2em;color:#bd7355;margin-bottom:12px;")}>{sel.category} · {sel.material}</div>
          <h1 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:300;font-size:42px;margin-bottom:14px;")}>{sel.name}</h1>
          <div style={css("font-size:25px;margin-bottom:22px;color:#3a2c25;")}>{fmt(sel.price)}</div>
          {Number(sel.stock) <= 0 && (
            <div style={css("display:inline-block;background:#fbeae4;color:#a85a44;font-size:13px;font-weight:700;padding:6px 14px;border-radius:100px;margin-bottom:18px;")}>אזל במלאי</div>
          )}
          <p style={css("font-size:16px;color:#6e5648;margin-bottom:28px;")}>{sel.description}</p>
          <div style={css("font-size:13px;font-weight:700;color:#8a766a;margin-bottom:12px;letter-spacing:.04em;")}>מידה</div>
          <div style={css("display:flex;gap:10px;margin-bottom:26px;flex-wrap:wrap;")}>
            {sizes.map((l) => {
              const on = l === size;
              return (
                <button key={l} onClick={() => setSize(l)} style={css(`min-width:50px;height:50px;padding:0 14px;border-radius:12px;border:1px solid ${on ? "#bd7355" : "#e0cdbd"};background:${on ? "#bd7355" : "#fff"};color:${on ? "#fff" : "#3a2c25"};font-size:15px;font-weight:600;cursor:pointer;transition:.2s;`)}>{l}</button>
              );
            })}
          </div>
          <div style={css("display:flex;gap:12px;margin-bottom:18px;")}>
            <div style={css("display:flex;align-items:center;border:1px solid #e0cdbd;border-radius:12px;overflow:hidden;background:#fff;")}>
              <button onClick={() => setQty(qty - 1)} disabled={qty <= 1} style={css(`width:46px;height:54px;border:none;background:#fff;font-size:20px;cursor:pointer;color:#8a766a;opacity:${qty <= 1 ? .4 : 1};`)}>−</button>
              <span style={css("width:44px;text-align:center;font-size:16px;font-weight:600;")}>{qty}</span>
              <button onClick={() => setQty(Math.min(qty + 1, Number(sel.stock) || 0))} disabled={qty >= Number(sel.stock)} style={css(`width:46px;height:54px;border:none;background:#fff;font-size:20px;cursor:pointer;color:#8a766a;opacity:${qty >= Number(sel.stock) ? .4 : 1};`)}>+</button>
            </div>
            <button onClick={addCurrent} disabled={Number(sel.stock) <= 0} style={css(`flex:1;background:#bd7355;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;opacity:${Number(sel.stock) <= 0 ? .5 : 1};`)}>{Number(sel.stock) <= 0 ? "אזל במלאי" : "הוספה לעגלה"}</button>
          </div>
          <div style={css("border-top:1px solid #ecdccd;margin-top:18px;")}>
            <div style={css("padding:18px 0;border-bottom:1px solid #ecdccd;display:flex;justify-content:space-between;font-size:15px;font-weight:500;")}>פרטי המוצר<span style={css("color:#bd7355;")}>+</span></div>
            <div style={css("padding:18px 0;border-bottom:1px solid #ecdccd;display:flex;justify-content:space-between;font-size:15px;font-weight:500;")}>משלוח והחזרות<span style={css("color:#bd7355;")}>+</span></div>
            <div style={css("padding:18px 0;border-bottom:1px solid #ecdccd;display:flex;justify-content:space-between;font-size:15px;font-weight:500;")}>טיפוח התכשיט<span style={css("color:#bd7355;")}>+</span></div>
          </div>
        </div>
      </div>
      <div style={css("margin-top:70px;")}>
        <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:30px;margin-bottom:26px;")}>אולי יתאים גם</h2>
        <div className="r-grid4" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:24px;")}>
          {related.map((p) => (
            <div key={p.id} onClick={() => openProduct(p.id)} style={css("cursor:pointer;")}>
              <div style={thumb(p.image, GRAD_CARD, "aspect-ratio:4/5;box-shadow:0 12px 28px rgba(140,90,60,.08);")}>
                {!p.image && <div style={css("width:46%;aspect-ratio:1;border-radius:50%;background:conic-gradient(from 200deg,#f3ece4,#d6c8b6,#f7f2ec,#cabfae,#e8e0d4,#f3ece4);box-shadow:0 8px 20px rgba(0,0,0,.12),inset 0 2px 8px rgba(0,0,0,.12);")} />}
              </div>
              <div style={css("font-family:'Frank Ruhl Libre',serif;font-size:16px;margin-top:12px;")}>{p.name}</div>
              <div style={css("font-size:14px;color:#8a766a;")}>{fmt(p.price)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
