import React, { useState } from "react";
import { css } from "../../lib/css.js";
import { useStore } from "../../context/StoreContext.jsx";
import { HIDEABLE_PAGES } from "../../lib/routes.js";

// Hide/show whole storefront pages. A hidden page loses its links (header,
// footer, home) and its URL falls back to home — see pageHidden in routes.js.
export function PagesTab() {
  const { content, saveContentPatch } = useStore();
  const hidden = content.hiddenPages || [];
  const [busy, setBusy] = useState(null);

  const toggle = async (key) => {
    setBusy(key);
    const next = hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key];
    try { await saveContentPatch({ hiddenPages: next }); } catch (e) { alert("עדכון נכשל: " + e.message); }
    setBusy(null);
  };

  return (
    <div>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;margin-bottom:8px;")}>עמודים באתר</h2>
      <p style={css("font-size:14px;color:var(--c-ink-mute);margin-bottom:18px;")}>עמוד מוסתר לא מופיע בתפריטים ובקישורים באתר, ומי שנכנס לכתובת שלו מועבר לעמוד הבית. עמודי הקנייה והעמודים המשפטיים (פרטיות, תנאי שימוש, נגישות) תמיד מוצגים.</p>
      {HIDEABLE_PAGES.map((p) => {
        const isHidden = hidden.includes(p.key);
        return (
          <div key={p.key} className="r-admin-row" style={css("display:flex;align-items:center;gap:18px;background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:14px 18px;margin-bottom:10px;")}>
            <div style={css("flex:1;")}>
              <div style={css("font-family:var(--font-serif);font-size:17px;")}>
                {p.label}
                {isHidden && <span style={css("margin-inline-start:10px;font-family:var(--font-sans);font-size:12px;font-weight:600;padding:3px 10px;border-radius:var(--r-pill);background:var(--c-line-soft);color:var(--c-ink-mute);vertical-align:middle;")}>מוסתר מהאתר</span>}
              </div>
              <div style={css("font-size:13px;color:var(--c-ink-mute);")}>{p.path}</div>
            </div>
            <button onClick={() => toggle(p.key)} disabled={busy === p.key} style={css(`padding:8px 16px;border-radius:9px;font-size:13.5px;font-weight:600;cursor:pointer;${isHidden ? "background:var(--c-accent-fill);color:#fff;border:none;" : "background:none;color:var(--c-ink);border:1px solid var(--c-line-strong);"}`)}>
              {isHidden ? "הצגה באתר" : "הסתרה"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
