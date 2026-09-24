import React from "react";
import { css } from "../../lib/css.js";
import { AdminImageField } from "../../components/AdminImageField.jsx";
import { AdminGalleryField } from "../../components/AdminGalleryField.jsx";
import { AdminListField } from "../../components/AdminListField.jsx";
import { useStore } from "../../context/StoreContext.jsx";
import { Field, Area, lbl, CAT_NAMES } from "./shared.jsx";

export function ContentTab() {
  const { content: C, cdraft, contentSaved, setCdraft, saveContent } = useStore();
  const cd = cdraft || C;

  return (
    <div style={css("max-width:760px;")}>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;margin-bottom:20px;")}>תוכן האתר</h2>
      <div style={css("display:flex;flex-direction:column;gap:18px;")}>
        <Field label="תווית באנר (Hero)" value={cd.heroBadge} onChange={(v) => setCdraft("heroBadge", v)} />
        <Field label="כותרת ראשית בבאנר" value={cd.authHeadline} onChange={(v) => setCdraft("authHeadline", v)} />
        <Area label="טקסט משנה בבאנר" value={cd.authTagline} onChange={(v) => setCdraft("authTagline", v)} rows={2} />
        <Field label="טקסט כפתור הבאנר" value={cd.heroCtaLabel} onChange={(v) => setCdraft("heroCtaLabel", v)} />
        <div>
          <label style={css(lbl)}>תמונות באנר עמוד הבית — דסקטופ (סליידר, עד 5)</label>
          <AdminGalleryField
            images={cd.heroImages ?? (cd.heroImage ? [cd.heroImage] : [])}
            onChange={(imgs) => setCdraft("heroImages", imgs)}
          />
          <div style={css("font-size:12px;color:var(--c-ink-faint);margin-top:6px;")}>תמונה אחת = באנר קבוע. יותר מתמונה אחת = הבאנר עובר אוטומטית בין התמונות. מומלץ תמונה רחבה (למשל יחס 2:1).</div>
        </div>
        <div>
          <label style={css(lbl)}>תמונות באנר עמוד הבית — מובייל (אופציונלי, עד 5)</label>
          <AdminGalleryField
            images={cd.heroImagesMobile || []}
            onChange={(imgs) => setCdraft("heroImagesMobile", imgs)}
          />
          <div style={css("font-size:12px;color:var(--c-ink-faint);margin-top:6px;")}>מומלץ תמונה לאורך (יחס 3:4) שמתאימה טוב יותר למסך מאונך — ממוספר תמונות תואם לרשימה הדסקטופ. אם ריק, המובייל ישתמש בתמונות הדסקטופ.</div>
        </div>
        <div style={css("height:1px;background:var(--c-line);margin:6px 0;")} />
        <div>
          <div style={css("font-size:15px;font-weight:700;color:var(--c-accent);margin-bottom:8px;")}>פס קידום עליון (מעל הבאנר הראשי)</div>
          <AdminListField
            items={cd.promoStripItems}
            onChange={(v) => setCdraft("promoStripItems", v)}
            placeholder="✓ טקסט קצר"
          />
          <div style={css("font-size:12px;color:var(--c-ink-faint);margin-top:6px;")}>עובר אוטומטית בין השורות כל 4 שניות. השורה על משלוח חינם היא טקסט קבוע — אם משנים את "משלוח חינם מעל" למטה, צריך לעדכן את הטקסט כאן בנפרד.</div>
        </div>

        <div style={css("height:1px;background:var(--c-line);margin:6px 0;")} />
        <Field label="כותרת מקטע נבחרים" value={cd.featuredTitle} onChange={(v) => setCdraft("featuredTitle", v)} />

        <div style={css("height:1px;background:var(--c-line);margin:6px 0;")} />
        <div style={css("font-size:15px;font-weight:700;color:var(--c-accent);")}>תמונות קטגוריה (4 האריחים בעמוד הבית)</div>
        <div className="r-grid3" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
          {CAT_NAMES.filter((c) => c !== "אקססוריז").map((cat) => (
            <div key={cat}>
              <label style={css(lbl)}>{cat}</label>
              <AdminImageField
                value={(cd.categoryImages || {})[cat] || ""}
                onChange={(v) => setCdraft("categoryImages", { ...(cd.categoryImages || {}), [cat]: v })}
              />
            </div>
          ))}
        </div>

        <div style={css("height:1px;background:var(--c-line);margin:6px 0;")} />
        <div style={css("font-size:15px;font-weight:700;color:var(--c-accent);")}>באנר גדול 1 (בין הסליידרים בעמוד הבית)</div>
        <div><label style={css(lbl)}>תמונה</label><AdminImageField value={cd.banner2Image} onChange={(v) => setCdraft("banner2Image", v)} /></div>
        <Field label="כותרת" value={cd.banner2Title} onChange={(v) => setCdraft("banner2Title", v)} />
        <Area label="טקסט משנה" value={cd.banner2Subtitle} onChange={(v) => setCdraft("banner2Subtitle", v)} rows={2} />
        <Field label="טקסט כפתור" value={cd.banner2CtaLabel} onChange={(v) => setCdraft("banner2CtaLabel", v)} />

        <div style={css("height:1px;background:var(--c-line);margin:6px 0;")} />
        <div style={css("font-size:15px;font-weight:700;color:var(--c-accent);")}>באנר גדול 2 (מבצע)</div>
        <div><label style={css(lbl)}>תמונה</label><AdminImageField value={cd.banner3Image} onChange={(v) => setCdraft("banner3Image", v)} /></div>
        <Field label="כותרת" value={cd.banner3Title} onChange={(v) => setCdraft("banner3Title", v)} />
        <Area label="טקסט משנה" value={cd.banner3Subtitle} onChange={(v) => setCdraft("banner3Subtitle", v)} rows={2} />
        <Field label="טקסט כפתור" value={cd.banner3CtaLabel} onChange={(v) => setCdraft("banner3CtaLabel", v)} />
        <div style={css("font-size:12px;color:var(--c-ink-faint);")}>שימו לב: זהו באנר שיווקי בלבד — המחיר/המבצע לא נאכף אוטומטית בקופה.</div>

        <div style={css("height:1px;background:var(--c-line);margin:6px 0;")} />
        <Field label="כותרת מקטע ״קצת עלינו״" value={cd.aboutTitle} onChange={(v) => setCdraft("aboutTitle", v)} />
        <Area label="טקסט ״קצת עלינו״ (מקטע קצר בתחתית עמוד הבית)" value={cd.aboutText} onChange={(v) => setCdraft("aboutText", v)} />

        <div style={css("height:1px;background:var(--c-line);margin:6px 0;")} />
        <div style={css("font-size:15px;font-weight:700;color:var(--c-accent);")}>עמוד ״הסיפור שלנו״</div>
        <Field label="כותרת ראשית" value={cd.storyTitle} onChange={(v) => setCdraft("storyTitle", v)} />
        <div><label style={css(lbl)}>תמונת ראש העמוד</label><AdminImageField value={cd.storyHeroImage} onChange={(v) => setCdraft("storyHeroImage", v)} /></div>
        <Area label="פסקת פתיחה" value={cd.storyLead} onChange={(v) => setCdraft("storyLead", v)} rows={2} />
        <Area label="גוף הסיפור" value={cd.storyBody} onChange={(v) => setCdraft("storyBody", v)} />
        <Field label="ציטוט" value={cd.storyQuote} onChange={(v) => setCdraft("storyQuote", v)} />
        <div className="r-grid3" style={css("display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;")}>
          {[1, 2, 3].map((n) => (
            <div key={n}>
              <label style={css(lbl)}>ערך {n} · כותרת</label>
              <input value={cd["value" + n + "Title"] ?? ""} onChange={(e) => setCdraft("value" + n + "Title", e.target.value)} style={css("width:100%;padding:12px 14px;border:1px solid var(--c-line-strong);border-radius:11px;font-size:15px;background:#fff;margin-bottom:8px;")} />
              <textarea value={cd["value" + n + "Text"] ?? ""} onChange={(e) => setCdraft("value" + n + "Text", e.target.value)} rows={3} placeholder="תיאור" style={css("width:100%;padding:12px 14px;border:1px solid var(--c-line-strong);border-radius:11px;font-size:15px;background:#fff;resize:vertical;")} />
            </div>
          ))}
        </div>
        <Field label="כותרת ״התהליך״" value={cd.processTitle} onChange={(v) => setCdraft("processTitle", v)} />
        <Area label="טקסט ״התהליך״" value={cd.processText} onChange={(v) => setCdraft("processText", v)} rows={2} />
        <div style={css("height:1px;background:var(--c-line);margin:6px 0;")} />

        <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
          <Field label="משלוח חינם מעל (₪)" value={cd.freeShipFrom} onChange={(v) => setCdraft("freeShipFrom", v)} type="number" />
          <Field label="דמי משלוח (₪)" value={cd.shipFee} onChange={(v) => setCdraft("shipFee", v)} type="number" />
        </div>
        <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
          <div>
            <Field label="סף מלאי אדום (יחידות)" value={cd.lowStockThreshold} onChange={(v) => setCdraft("lowStockThreshold", v)} type="number" />
            <div style={css("font-size:11.5px;color:var(--c-ink-faint);margin-top:4px;")}>מתחת למספר הזה — אדום (מלאי קריטי)</div>
          </div>
          <div>
            <Field label="סף מלאי כתום (יחידות)" value={cd.stockFineThreshold} onChange={(v) => setCdraft("stockFineThreshold", v)} type="number" />
            <div style={css("font-size:11.5px;color:var(--c-ink-faint);margin-top:4px;")}>מתחת למספר הזה (ומעל האדום) — כתום</div>
          </div>
        </div>
        <div style={css("height:1px;background:var(--c-line);margin:6px 0;")} />
        <div style={css("font-size:15px;font-weight:700;color:var(--c-accent);")}>קופון הרשמה</div>
        <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
          <Field label="אחוז הנחה בקופון (%)" value={cd.signupCouponPercent} onChange={(v) => setCdraft("signupCouponPercent", v)} type="number" />
          <Field label="השהיה לפני הצגת הפופאפ (שניות)" value={cd.signupPopupDelaySeconds} onChange={(v) => setCdraft("signupPopupDelaySeconds", v)} type="number" />
        </div>
        <label style={css("display:flex;align-items:center;gap:8px;font-size:14px;color:var(--c-ink-soft);cursor:pointer;")}>
          <input type="checkbox" checked={cd.signupCouponEnabled !== false} onChange={(e) => setCdraft("signupCouponEnabled", e.target.checked)} />
          הצגת פופאפ ההרשמה באתר
        </label>

        <div style={css("display:flex;gap:12px;margin-top:8px;")}>
          <button onClick={saveContent} style={css("padding:13px 28px;background:var(--c-accent-fill);color:#fff;border:none;border-radius:11px;font-size:15px;font-weight:600;cursor:pointer;")}>שמירת שינויים</button>
          {contentSaved && <span style={css("align-self:center;color:var(--c-success);font-size:14px;font-weight:600;")}>✓ נשמר</span>}
        </div>
      </div>
    </div>
  );
}
