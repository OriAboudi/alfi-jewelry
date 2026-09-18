import React from "react";
import { css } from "../lib/css.js";

const MAX_ITEMS = 8;

/**
 * AdminListField — admin control for a short list of free-text lines (e.g.
 * the home page's rotating promo strip). Add/edit/remove, no reordering
 * beyond delete-and-retype since lists here are short.
 */
export function AdminListField({ items, onChange, placeholder }) {
  const list = items && items.length ? items : [];

  const setAt = (i, v) => onChange(list.map((x, idx) => (idx === i ? v : x)));
  const removeAt = (i) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, ""]);

  return (
    <div>
      <div style={css("display:flex;flex-direction:column;gap:8px;")}>
        {list.map((v, i) => (
          <div key={i} style={css("display:flex;gap:8px;")}>
            <input
              value={v}
              onChange={(e) => setAt(i, e.target.value)}
              placeholder={placeholder}
              style={css("flex:1;padding:11px 13px;border:1px solid var(--c-line-strong);border-radius:11px;font-size:14.5px;background:#fff;")}
            />
            <button type="button" onClick={() => removeAt(i)} title="הסרה" style={css("width:38px;flex:none;border:none;border-radius:10px;background:var(--c-danger-bg);color:var(--c-danger);cursor:pointer;font-size:14px;")}>✕</button>
          </div>
        ))}
      </div>
      {list.length < MAX_ITEMS && (
        <button type="button" onClick={add} style={css("margin-top:8px;padding:9px 16px;background:var(--c-line-soft);border:none;border-radius:10px;font-size:13.5px;font-weight:600;cursor:pointer;color:var(--c-ink);")}>+ הוספת שורה</button>
      )}
      <div style={css("font-size:12px;color:var(--c-ink-faint);margin-top:6px;")}>{list.length}/{MAX_ITEMS} שורות</div>
    </div>
  );
}
