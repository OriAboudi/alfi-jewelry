import React, { useState } from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";
import { ImageLightbox } from "./ImageLightbox.jsx";

const MAX_IMAGES = 5;

/**
 * AdminGalleryField — admin-only control for a product's image gallery.
 * Up to MAX_IMAGES images; the first one is used as the product's cover
 * photo everywhere else in the app (catalog cards, cart, checkout).
 */
export function AdminGalleryField({ images, onChange }) {
  const { uploadImage } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [viewIdx, setViewIdx] = useState(null);
  const list = images || [];

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const url = await uploadImage(file);
      onChange([...list, url].slice(0, MAX_IMAGES));
    } catch (ex) {
      setErr(ex.message || "העלאה נכשלה");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  const removeAt = (i) => onChange(list.filter((_, idx) => idx !== i));
  const moveToFront = (i) => {
    if (i === 0) return;
    const next = list.slice();
    const [item] = next.splice(i, 1);
    next.unshift(item);
    onChange(next);
  };

  return (
    <div>
      <div style={css("display:grid;grid-template-columns:repeat(auto-fill, minmax(150px, 1fr));gap:12px;margin-bottom:10px;")}>
        {list.map((url, i) => (
          <div key={url + i} style={css("position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#fff;border:2px solid " + (i === 0 ? "var(--c-accent)" : "var(--c-line-strong)") + ";")}>
            <img src={url} alt={`תמונה ${i + 1}`} onClick={() => setViewIdx(i)} title="לחיצה להגדלה" style={css("width:100%;height:100%;object-fit:contain;display:block;cursor:zoom-in;")} />
            {i === 0 && (
              <div style={css("position:absolute;bottom:0;right:0;left:0;background:rgba(122,92,134,.9);color:#fff;font-size:12px;text-align:center;padding:4px 0;pointer-events:none;")}>תמונה ראשית</div>
            )}
            <div style={css("position:absolute;top:6px;left:6px;display:flex;gap:5px;")}>
              {i !== 0 && (
                <button type="button" onClick={() => moveToFront(i)} title="הפוך לתמונה ראשית" aria-label="הפוך לתמונה ראשית" style={css("width:30px;height:30px;border:none;border-radius:8px;background:rgba(255,255,255,.92);box-shadow:0 1px 4px rgba(0,0,0,.15);cursor:pointer;font-size:14px;line-height:1;")}>★</button>
              )}
              <button type="button" onClick={() => removeAt(i)} title="הסרה" aria-label="הסרת תמונה" style={css("width:30px;height:30px;border:none;border-radius:8px;background:rgba(255,255,255,.92);box-shadow:0 1px 4px rgba(0,0,0,.15);cursor:pointer;font-size:14px;line-height:1;color:var(--c-danger);")}>✕</button>
            </div>
          </div>
        ))}
        {list.length < MAX_IMAGES && (
          <label style={css("aspect-ratio:1;border-radius:10px;border:1.5px dashed var(--c-line-strong);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--c-ink-mute);font-size:14px;text-align:center;")}>
            {busy ? "מעלה…" : "+ הוספה"}
            <input type="file" accept="image/*" onChange={handleFile} disabled={busy} style={{ display: "none" }} />
          </label>
        )}
      </div>
      <div style={css("font-size:12px;color:var(--c-ink-faint);")}>{list.length}/{MAX_IMAGES} תמונות · הראשונה משמשת כתמונת השער בקטלוג ובעגלה · לחיצה על תמונה מגדילה אותה</div>
      {viewIdx !== null && <ImageLightbox images={list} startIndex={viewIdx} onClose={() => setViewIdx(null)} />}
      {err && <div style={css("color:var(--c-danger);font-size:12.5px;margin-top:6px;")}>{err}</div>}
    </div>
  );
}
