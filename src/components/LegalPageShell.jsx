import React from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";

/**
 * LegalPageShell — shared scaffold for Privacy/Terms/Shipping pages.
 * These are intentionally placeholders: real legal/business copy has to
 * come from the site owner, so this only provides structure (section
 * headers) plus a clearly-marked TODO notice, never invented claims.
 */
export function LegalPageShell({ title, sections }) {
  const { go } = useStore();
  return (
    <div className="r-container glass-card" style={css("max-width:720px;margin:30px auto;padding:56px var(--sp-5) 70px;")}>
      <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:22px;text-align:center;")}>{title}</h1>

      <div style={css("background:var(--c-accent-soft);color:var(--c-accent-dark);border-radius:var(--r-md);padding:16px 18px;font-size:14px;line-height:1.7;margin-bottom:36px;")}>
        ⚠️ עמוד זה טרם הושלם. הכותרות שלהלן הן שלד ארגוני בלבד ואינן מהוות מסמך משפטי תקף — יש להחליף כל סעיף בתוכן הרשמי והמדויק של העסק לפני פרסום.
      </div>

      {sections.map((s) => (
        <div key={s} style={css("margin-bottom:24px;")}>
          <h2 style={css("font-family:var(--font-serif);font-size:18px;margin-bottom:6px;")}>{s}</h2>
          <p style={css("font-size:14.5px;color:var(--c-ink-mute);")}>[TODO — להשלמה על ידי בעל/ת העסק]</p>
        </div>
      ))}

      <button onClick={() => go("home")} className="btn btn-secondary" style={css("margin-top:12px;")}>חזרה לדף הבית</button>
    </div>
  );
}
