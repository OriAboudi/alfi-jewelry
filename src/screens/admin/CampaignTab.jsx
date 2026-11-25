import React from "react";
import { css } from "../../lib/css.js";
import { AdminImageField } from "../../components/AdminImageField.jsx";
import { CampaignBar, CampaignHome } from "../../components/Campaign.jsx";
import { useStore } from "../../context/StoreContext.jsx";
import { Field, Area, lbl, inp } from "./shared.jsx";
import { campaignConfig, previewConfig, campaignProducts, resetCampaignSeen, CAMPAIGN_DEFAULTS, CTA_TARGETS, MODAL_FREQUENCIES, toLocalInput, fromLocalInput } from "../../lib/campaign.js";
import { saleInfo } from "../../lib/pricing.js";

const STATUS = {
  off: { label: "כבוי", fg: "var(--c-ink-mute)", bg: "var(--c-line-soft)" },
  scheduled: { label: "מתוזמן — יתחיל אוטומטית", fg: "var(--c-warning)", bg: "var(--c-warning-bg)" },
  teaser: { label: "טיזר באוויר — המבצע מתחיל בתאריך ההתחלה", fg: "var(--c-accent-dark)", bg: "var(--c-accent-soft)" },
  live: { label: "פעיל עכשיו באתר", fg: "var(--c-success)", bg: "var(--c-success-bg)" },
  ended: { label: "הסתיים — כבר לא מוצג", fg: "var(--c-danger)", bg: "var(--c-danger-bg)" },
};

const PLACEMENTS = [
  ["bfShowModal", "פופאפ קמפיין", "פוסטר הקמפיין נפתח לבד כמה שניות אחרי הכניסה לאתר (במובייל — על כל המסך). לא נפתח בזמן תשלום, ופופאפ ההרשמה מחכה עד שהוא נסגר."],
  ["bfShowHome", "מקטע ראשי בעמוד הבית", "רצועת סאטן בראש עמוד הבית, עם ספירה לאחור ופריטי המבצע האמיתיים."],
  ["bfShowBar", "פס עליון בכל האתר", "פס דק מתחת לתפריט עם שעון שסופר לאחור — בכל עמודי הקנייה."],
  ["bfShowBadges", "תגית על כרטיסי מוצר", "תגית BLACK FRIDAY על כל מוצר שיש לו מחיר מבצע או שמשתתף במבצע (רק כשהמבצע עצמו פעיל)."],
  ["bfShowFab", "תזכורת צפה בפינה", "אחרי שסוגרים את הפופאפ — כפתור קטן בפינת המסך שפותח אותו מחדש."],
];

// Black Friday = the day after the 4th Thursday of November.
function blackFriday(year) {
  const d = new Date(year, 10, 1);
  const firstThu = 1 + ((4 - d.getDay() + 7) % 7);
  return new Date(year, 10, firstThu + 21 + 1);
}
const at = (d, h, m = 0) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function presets() {
  const now = new Date();
  let bf = blackFriday(now.getFullYear());
  if (addDays(bf, 4) < now) bf = blackFriday(now.getFullYear() + 1);
  const cyberEnd = at(addDays(bf, 3), 23, 59);
  return [
    { label: "יום שישי השחור בלבד", start: at(bf, 0), end: at(bf, 23, 59) },
    { label: "סופ״ש בלאק פריידי (שישי עד שני)", start: at(bf, 0), end: cyberEnd },
    { label: "כל שבוע בלאק פריידי", start: at(addDays(bf, -4), 0), end: cyberEnd },
    { label: "מעכשיו ל־48 שעות", start: null, end: new Date(now.getTime() + 48 * 3600 * 1000) },
  ];
}

const fmt = (t) => new Date(t).toLocaleString("he-IL", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

function Toggle({ checked, onChange, title, text }) {
  return (
    <label style={css(`display:flex;gap:14px;align-items:flex-start;padding:14px 16px;border:1px solid ${checked ? "var(--c-accent)" : "var(--c-line)"};border-radius:12px;background:${checked ? "var(--c-accent-soft)" : "#fff"};cursor:pointer;`)}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={css("margin-top:3px;width:18px;height:18px;flex:none;accent-color:var(--c-accent);")} />
      <span>
        <span style={css("display:block;font-size:14.5px;font-weight:700;color:var(--c-ink);")}>{title}</span>
        <span style={css("display:block;font-size:12.5px;color:var(--c-ink-mute);margin-top:2px;line-height:1.5;")}>{text}</span>
      </span>
    </label>
  );
}

const sectionTitle = "font-size:15px;font-weight:700;color:var(--c-accent);margin-bottom:12px;";
const hint = "font-size:12px;color:var(--c-ink-faint);margin-top:6px;line-height:1.5;";
const divider = <div style={css("height:1px;background:var(--c-line);margin:8px 0;")} />;

export function CampaignTab() {
  const { content: C, cdraft, contentSaved, setCdraft, saveContent, products, openCampaignModal } = useStore();
  const cd = { ...CAMPAIGN_DEFAULTS, ...(cdraft || C) };
  const live = campaignConfig(C);
  const draft = campaignConfig(cd);
  const [previewPhase, setPreviewPhase] = React.useState(null);
  const phase = previewPhase || (draft.phase === "teaser" ? "teaser" : "live");
  const previewCfg = previewConfig(cd, phase);
  const [resetDone, setResetDone] = React.useState(false);
  const statusKey = (cfg) => (cfg.phase === "teaser" ? "teaser" : cfg.status);
  const items = campaignProducts(products);
  const onSale = items.filter((p) => saleInfo(p).onSale).length;
  const inDeal = items.filter((p) => p.in_bundle).length;
  const dirty = cdraft && Object.keys(CAMPAIGN_DEFAULTS).some((k) => JSON.stringify(cdraft[k]) !== JSON.stringify(C[k]));
  const st = STATUS[statusKey(draft)];
  const set = (k) => (v) => setCdraft(k, v);
  const endBeforeStart = draft.startAt && draft.endAt && draft.endAt <= draft.startAt;

  return (
    <div style={css("max-width:860px;")}>
      <div style={css("display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px;")}>
        <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;margin:0;")}>קמפיין בלאק פריידי</h2>
        <span style={css(`font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;color:${STATUS[statusKey(live)].fg};background:${STATUS[statusKey(live)].bg};`)}>באתר עכשיו: {STATUS[statusKey(live)].label}</span>
      </div>
      <p style={css("font-size:13.5px;color:var(--c-ink-mute);margin:0 0 22px;line-height:1.6;")}>
        עיצוב הסאטן של קמפיין ALFI — פופאפ, פס עליון ומקטע בעמוד הבית — לזמן המבצע. הקמפיין לא משנה מחירים — הוא מפנה למבצעים שכבר מוגדרים:
        מחירי מבצע על מוצרים, והמבצע הפעיל (בלשונית ״תוכן האתר״).
      </p>

      <div style={css("display:flex;flex-direction:column;gap:18px;")}>
        {/* Master switch */}
        <label style={css(`display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border-radius:14px;cursor:pointer;background:${cd.bfEnabled ? "linear-gradient(118deg,#e6dbcf,#f6f0ea 30%,#e3d7ca 60%,#f3ece4)" : "#fff"};color:#2b2420;border:1px solid ${cd.bfEnabled ? "rgba(43,36,32,.35)" : "var(--c-line-strong)"};`)}>
          <span>
            <span style={css("display:block;font-size:17px;font-weight:700;")}>{cd.bfEnabled ? "הקמפיין מופעל" : "הקמפיין כבוי"}</span>
            <span style={css(`display:block;font-size:13px;margin-top:3px;opacity:.8;`)}>
              {cd.bfEnabled ? (draft.active ? "מוצג באתר מיד אחרי השמירה" + (draft.phase === "teaser" ? " (כטיזר עד תאריך ההתחלה)" : "") : st.label) : "סמנו כדי להפעיל. אפשר גם לתזמן מראש — הוא יעלה וירד לבד."}
            </span>
          </span>
          <input type="checkbox" checked={!!cd.bfEnabled} onChange={(e) => setCdraft("bfEnabled", e.target.checked)} style={css("width:22px;height:22px;accent-color:#2b2420;flex:none;")} />
        </label>

        {items.length === 0 && (
          <div role="status" style={css("background:var(--c-warning-bg);color:var(--c-warning);padding:12px 16px;border-radius:12px;font-size:13.5px;line-height:1.6;")}>
            אין כרגע אף מוצר במלאי עם מחיר מבצע או שמשתתף במבצע. כדאי להגדיר ״מחיר מבצע״ בעריכת מוצר (או לסמן ״משתתף במבצע״) — אחרת הקמפיין מפנה לעמוד בלי הנחות.
          </div>
        )}
        {items.length > 0 && (
          <div style={css("font-size:13px;color:var(--c-ink-mute);")}>
            {items.length} פריטים במלאי יוצגו כפריטי הקמפיין ({onSale} עם מחיר מבצע, {inDeal} משתתפים במבצע).
          </div>
        )}

        {divider}
        <div>
          <div style={css(sectionTitle)}>מתי</div>
          <div style={css("display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;")}>
            {presets().map((p) => (
              <button key={p.label} type="button" onClick={() => { setCdraft("bfStartAt", p.start ? p.start.toISOString() : ""); setCdraft("bfEndAt", p.end.toISOString()); }} style={css("padding:8px 14px;border:1px solid var(--c-line-strong);border-radius:999px;background:#fff;font:inherit;font-size:13px;cursor:pointer;")}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
            <div>
              <label style={css(lbl)}>התחלה (ריק = מיד)</label>
              <input type="datetime-local" value={toLocalInput(cd.bfStartAt)} onChange={(e) => setCdraft("bfStartAt", fromLocalInput(e.target.value))} style={css(inp)} />
            </div>
            <div>
              <label style={css(lbl)}>סיום (מופיע כשעון שסופר לאחור)</label>
              <input type="datetime-local" value={toLocalInput(cd.bfEndAt)} onChange={(e) => setCdraft("bfEndAt", fromLocalInput(e.target.value))} style={css(inp)} />
            </div>
          </div>
          {endBeforeStart && <div role="alert" style={css("color:var(--c-danger);font-size:12.5px;margin-top:6px;")}>הסיום לפני ההתחלה — הקמפיין לא יוצג.</div>}
          <div style={css(hint)}>
            {draft.startAt || draft.endAt
              ? <>יוצג {draft.startAt ? `מ־${fmt(draft.startAt)}` : "מעכשיו"}{draft.endAt ? ` עד ${fmt(draft.endAt)}` : " ללא תאריך סיום"}. בסיום הוא יורד מהאתר לבד.</>
              : "בלי תאריכים הקמפיין מוצג כל עוד הוא מופעל, בלי שעון ספירה לאחור. מומלץ לקבוע סיום — שעון שרץ יוצר דחיפות."}
          </div>
          <div style={css("margin-top:12px;")}>
            <Toggle checked={cd.bfTeaser !== false} onChange={set("bfTeaser")} title="טיזר לפני ההתחלה" text={`עד תאריך ההתחלה האתר מציג את התאריך (${draft.startLabel || "27.11"}) עם ספירה לאחור להתחלה, בלי תגיות ובלי הנחות. ביום עצמו מתחלף לבד למבצע.`} />
          </div>
        </div>

        {divider}
        <div>
          <div style={css(sectionTitle)}>איפה זה מופיע באתר</div>
          <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;")}>
            {PLACEMENTS.map(([k, title, text]) => (
              <Toggle key={k} checked={cd[k] !== false} onChange={set(k)} title={title} text={text} />
            ))}
          </div>
          {cd.bfShowModal !== false && (
            <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;")}>
              <div>
                <label style={css(lbl)}>כמה פעמים הפופאפ נפתח לבד</label>
                <select value={draft.modalFrequency} onChange={(e) => setCdraft("bfModalFrequency", e.target.value)} style={css(inp + "cursor:pointer;")}>
                  {MODAL_FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <Field label="הפופאפ נפתח אחרי (שניות)" value={cd.bfModalDelaySeconds} onChange={set("bfModalDelaySeconds")} type="number" />
            </div>
          )}
        </div>

        {divider}
        <div style={css(sectionTitle + "margin-bottom:0;")}>טקסטים ועיצוב</div>
        <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
          <Field label="כותרת ענקית (באנגלית נראה הכי טוב)" value={cd.bfTitle} onChange={set("bfTitle")} placeholder="BLACK FRIDAY" />
          <Field label="תווית על כרטיסי מוצר" value={cd.bfBadgeLabel} onChange={set("bfBadgeLabel")} placeholder="BLACK FRIDAY" />
        </div>
        <Field label="משפט ראשי" value={cd.bfHeadline} onChange={set("bfHeadline")} placeholder="המבצע הגדול של השנה" />
        <Area label="טקסט משנה" value={cd.bfSubtitle} onChange={set("bfSubtitle")} rows={2} />
        <Field label="טקסט הפס העליון" value={cd.bfBarText} onChange={set("bfBarText")} />
        <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
          <Field label="טקסט הכפתור" value={cd.bfCtaLabel} onChange={set("bfCtaLabel")} />
          <div>
            <label style={css(lbl)}>הכפתור מוביל אל</label>
            <select value={draft.ctaTarget} onChange={(e) => setCdraft("bfCtaTarget", e.target.value)} style={css(inp + "cursor:pointer;")}>
              {CTA_TARGETS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={css(lbl)}>תמונת קמפיין (אופציונלי)</label>
          <AdminImageField value={cd.bfImage} onChange={set("bfImage")} />
          <div style={css(hint)}>בלי תמונה — רקע סאטן עם כרטיסים של פריטי המבצע האמיתיים. אפשר להעלות תמונת קמפיין (למשל הצמיד על הסאטן), רצוי בלי טקסט עליה — האתר מוסיף את הטקסט מעליה.</div>
        </div>
        <div style={css(hint + "margin-top:-6px;")}>אם יש מוצרים עם מחיר מבצע, האתר מוסיף לבד ״עד X% הנחה על פריטים נבחרים״ לפי ההנחה הגבוהה ביותר שקיימת בפועל.</div>

        {divider}
        <div>
          <div style={css("display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;")}>
            <div style={css(sectionTitle + "margin-bottom:0;")}>תצוגה מקדימה</div>
            <div style={css("display:flex;gap:8px;flex-wrap:wrap;align-items:center;")}>
              <div role="group" aria-label="מצב התצוגה" style={css("display:flex;border:1px solid var(--c-line-strong);border-radius:999px;overflow:hidden;")}>
                {[["teaser", "טיזר"], ["live", "מבצע"]].map(([k, l]) => (
                  <button key={k} type="button" aria-pressed={phase === k} onClick={() => setPreviewPhase(k)} style={css(`padding:8px 14px;border:0;font:inherit;font-size:13px;cursor:pointer;background:${phase === k ? "#2b2420" : "#fff"};color:${phase === k ? "#fff" : "var(--c-ink)"};`)}>{l}</button>
                ))}
              </div>
              <button type="button" onClick={() => openCampaignModal({ content: cd, phase })} style={css("padding:9px 18px;background:#2b2420;color:#fff;border:none;border-radius:999px;font:inherit;font-size:14px;cursor:pointer;")}>
                פתיחת הפופאפ לתצוגה
              </button>
            </div>
          </div>
          <div style={css("border:1px solid var(--c-line);border-radius:14px;overflow:hidden;")}>
            <CampaignBar cfg={previewCfg} preview />
            <CampaignHome cfg={previewCfg} preview />
          </div>
          <div style={css(hint)}>התצוגה מראה את הטיוטה הנוכחית, גם לפני שמירה וגם כשהקמפיין כבוי.</div>
          <div style={css("display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:12px;padding:12px 14px;background:#fff;border:1px solid var(--c-line);border-radius:12px;")}>
            <span style={css("font-size:13px;color:var(--c-ink-mute);flex:1;min-width:220px;line-height:1.5;")}>
              כל גולשת רואה את הפופאפ לבד {draft.modalFrequency === "day" ? "פעם ביום" : "פעם בכל כניסה לאתר"}. כדי לראות אותו שוב בעצמך באתר, בדפדפן הזה:
            </span>
            <button type="button" onClick={() => { resetCampaignSeen(); setResetDone(true); }} style={css("padding:8px 14px;border:1px solid var(--c-line-strong);border-radius:999px;background:#fff;font:inherit;font-size:13px;cursor:pointer;")}>
              {resetDone ? "✓ יופיע שוב בכניסה הבאה לאתר" : "להציג לי שוב את הפופאפ"}
            </button>
          </div>
        </div>

        <div style={css("display:flex;gap:12px;align-items:center;margin-top:8px;position:sticky;bottom:0;background:linear-gradient(0deg,var(--c-bg) 70%,transparent);padding:14px 0;")}>
          <button onClick={saveContent} style={css("padding:13px 28px;background:var(--c-accent-fill);color:#fff;border:none;border-radius:11px;font-size:15px;font-weight:600;cursor:pointer;")}>שמירת הקמפיין</button>
          {contentSaved && !dirty && <span style={css("color:var(--c-success);font-size:14px;font-weight:600;")}>✓ נשמר</span>}
          {dirty && <span style={css("color:var(--c-ink-mute);font-size:13px;")}>יש שינויים שלא נשמרו</span>}
        </div>
      </div>
    </div>
  );
}
