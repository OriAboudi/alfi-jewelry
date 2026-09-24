import React from "react";
import { css } from "../../lib/css.js";
import { thumb, GRAD_CARD } from "../../lib/ui.js";
import { Disc } from "../../components/Ornaments.jsx";
import { AdminImageField } from "../../components/AdminImageField.jsx";
import { useStore } from "../../context/StoreContext.jsx";
import { Field, Area, Overlay, OverlayHeader, lbl, inp, CAT_NAMES } from "./shared.jsx";

export function CollectionsTab() {
  const {
    collections, draftCol, newCollection, editCollection, deleteCollection, setDraftCol, saveCol, cancelCol,
  } = useStore();

  return (
    <div>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;")}>
        <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;")}>קולקציות ({collections.length})</h2>
        <button onClick={newCollection} style={css("padding:11px 22px;background:var(--c-accent-fill);color:#fff;border:none;border-radius:10px;font-size:14.5px;font-weight:600;cursor:pointer;")}>+ קולקציה חדשה</button>
      </div>
      {collections.map((c) => (
        <div key={c.id} className="r-admin-row" style={css("display:flex;align-items:center;gap:18px;background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:14px 18px;margin-bottom:10px;")}>
          <div style={thumb(c.image, GRAD_CARD, "width:60px;height:48px;flex:none;border-radius:10px;")}>
            {!c.image && <Disc style="width:50%;aspect-ratio:1;" />}
          </div>
          <div style={css("flex:1;")}><div style={css("font-family:var(--font-serif);font-size:17px;")}>{c.title}</div><div style={css("font-size:13px;color:var(--c-ink-mute);")}>{c.subtitle}{c.category_filter ? ` · מסונן: ${c.category_filter}` : ""}</div></div>
          <button onClick={() => editCollection(c)} style={css("padding:8px 16px;background:var(--c-line-soft);color:var(--c-ink);border:none;border-radius:9px;font-size:13.5px;font-weight:600;cursor:pointer;")}>עריכה</button>
          <button onClick={() => deleteCollection(c.id)} style={css("padding:8px 14px;background:none;color:var(--c-danger);border:1px solid var(--c-line-strong);border-radius:9px;font-size:13.5px;cursor:pointer;")}>מחיקה</button>
        </div>
      ))}

      {draftCol && (
        <Overlay onClose={cancelCol}>
          <OverlayHeader title={draftCol._new ? "קולקציה חדשה" : "עריכת קולקציה"} onClose={cancelCol} />
          <div style={css("display:flex;flex-direction:column;gap:16px;")}>
            <div style={css("display:flex;gap:16px;align-items:flex-start;")}>
              <div style={thumb(draftCol.image, GRAD_CARD, "width:80px;height:80px;flex:none;border-radius:14px;")}>
                {!draftCol.image && <Disc style="width:54%;aspect-ratio:1;" />}
              </div>
              <div style={css("flex:1;")}><label style={css(lbl)}>תמונת קולקציה</label><AdminImageField value={draftCol.image} onChange={(v) => setDraftCol("image", v)} placeholder="קישור לתמונה או העלאה ←" /></div>
            </div>
            <Field label="שם הקולקציה" value={draftCol.title} onChange={(v) => setDraftCol("title", v)} />
            <Field label="תווית (subtitle)" value={draftCol.subtitle} onChange={(v) => setDraftCol("subtitle", v)} placeholder="הקולקציה החדשה" />
            <div>
              <label style={css(lbl)}>קטגוריה מסוננת בקטלוג (אופציונלי)</label>
              <select value={draftCol.category_filter || ""} onChange={(e) => setDraftCol("category_filter", e.target.value)} style={css(inp + "cursor:pointer;")}>
                <option value="">ללא סינון (מציג את כל הקטלוג)</option>
                {CAT_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Area label="תיאור" value={draftCol.description} onChange={(v) => setDraftCol("description", v)} />
            <div style={css("display:flex;gap:12px;margin-top:8px;")}>
              <button onClick={saveCol} style={css("flex:1;padding:14px;background:var(--c-accent-fill);color:#fff;border:none;border-radius:11px;font-size:15.5px;font-weight:600;cursor:pointer;")}>שמירה</button>
              <button onClick={cancelCol} style={css("padding:14px 24px;background:#fff;color:var(--c-ink);border:1px solid var(--c-line-strong);border-radius:11px;font-size:15px;cursor:pointer;")}>ביטול</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
