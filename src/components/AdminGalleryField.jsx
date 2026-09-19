import React, { useState } from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";

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
      <div style={css("display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px;")}>
        {list.map((url, i) => (
          <div key={url + i} style={css("position:relative;width:84px;height:84px;border-radius:10px;overflow:hidden;border:2px solid " + (i === 0 ? "var(--c-accent)" : "var(--c-line-strong)") + ";flex:none;")}>
            <img src={url} alt="" style={css("width:100%;height:100%;object-fit:cover;display:block;")} />
            {i === 0 && (
              <div style={css("position:absolute;bottom:0;right:0;left:0;background:rgba(122,92,134,.9);color:#fff;font-size:10px;text-align:center;padding:2px 0;")}>ראשית</div>
            )}
            <div style={css("position:absolute;top:2px;left:2px;display:flex;gap:3px;")}>
              {i !== 0 && (
                <button type="button" onClick={() => moveToFront(i)} title="הפוך לתמונה ראשית" aria-label="הפוך לתמונה ראשית" style={css("width:20px;height:20px;border:none;border-radius:6px;background:rgba(255,255,255,.92);cursor:pointer;font-size:11px;line-height:1;")}>★</button>
              )}
              <button type="button" onClick={() => removeAt(i)} title="הסרה" aria-label="הסרת תמונה" style={css("width:20px;height:20px;border:none;border-radius:6px;background:rgba(255,255,255,.92);cursor:pointer;font-size:12px;line-height:1;color:var(--c-danger);")}>✕</button>
            </div>
          </div>
        ))}
        {list.length < MAX_IMAGES && (
          <label style={css("width:84px;height:84px;border-radius:10px;border:1.5px dashed var(--c-line-strong);display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;color:var(--c-ink-mute);font-size:13px;text-align:center;")}>
            {busy ? "מעלה…" : "+ הוספה"}
            <input type="file" accept="image/*" onChange={handleFile} disabled={busy} style={{ display: "none" }} />
          </label>
        )}
      </div>
      <div style={css("font-size:12px;color:var(--c-ink-faint);")}>{list.length}/{MAX_IMAGES} תמונות · הראשונה משמשת כתמונת השער בקטלוג ובעגלה</div>
      {err && <div style={css("color:var(--c-danger);font-size:12.5px;margin-top:6px;")}>{err}</div>}
    </div>
  );
}
