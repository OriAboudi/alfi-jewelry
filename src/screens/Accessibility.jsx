import React from "react";
import { css } from "../lib/css.js";
import { CONTACT } from "../lib/contact.js";
import { useSeoTags } from "../hooks/useSeoTags.js";
import { openA11yMenu } from "../components/AccessibilityMenu.jsx";

// Accessibility statement (הצהרת נגישות) — required by Israel's Equal Rights
// for Persons with Disabilities (Service Accessibility Adjustments)
// Regulations 2013, reg. 35, and by the European Accessibility Act (EAA).
// Keep it truthful: only list adjustments that were actually made.
export const A11Y_UPDATED = "ספטמבר 2026";

const pStyle = "font-size:15px;line-height:1.85;color:var(--c-ink-soft);margin:0 0 12px;";
const linkStyle = "color:var(--c-ink);border-bottom:1px solid var(--c-line-strong);";
const P = ({ children }) => <p style={css(pStyle)}>{children}</p>;

function List({ items }) {
  return (
    <ul className="r-policy-list" style={css("list-style:none;margin:0 0 12px;padding:0;")}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

function Section({ n, title, first, children }) {
  return (
    <section aria-labelledby={`a11y-s${n}`} style={css(`padding:30px 0;${first ? "padding-top:0;" : "border-top:1px solid var(--c-line);"}`)}>
      <div aria-hidden="true" style={css("font-family:var(--font-serif);font-size:13px;letter-spacing:.2em;color:var(--c-accent-dark);margin-bottom:6px;")}>{String(n).padStart(2, "0")}</div>
      <h2 id={`a11y-s${n}`} style={css("font-family:var(--font-serif);font-weight:400;font-size:22px;margin:0 0 14px;color:var(--c-ink);")}>{title}</h2>
      {children}
    </section>
  );
}

export function Accessibility() {
  useSeoTags({
    title: "הצהרת נגישות · ALFI",
    description: "הצהרת הנגישות של Alfi Jewelry: רמת הנגישות באתר, ההתאמות שבוצעו, מגבלות ידועות ודרכי פנייה לרכז הנגישות.",
    canonical: "/הצהרת-נגישות",
  });

  return (
    <div className="r-container glass-card" style={css("max-width:720px;margin:30px auto;padding:56px var(--sp-5) 48px;")}>
      <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:8px;text-align:center;")}>הצהרת נגישות</h1>
      <p style={css("text-align:center;font-size:13px;letter-spacing:.04em;color:var(--c-ink-mute);margin:0 0 34px;")}>עודכן לאחרונה: {A11Y_UPDATED}</p>

      <p style={css("font-size:16px;line-height:1.8;color:var(--c-ink-soft);margin:0 0 34px;")}>
        ב־Alfi Jewelry אנו מאמינים שכל אדם צריך ליהנות מחוויית קנייה נוחה, עצמאית ושוויונית. השקענו בהתאמת האתר כך שיהיה נגיש לאנשים עם מוגבלות, ואנו ממשיכים לשפר אותו באופן שוטף.
      </p>

      <Section n={1} first title="רמת הנגישות באתר">
        <P>האתר הותאם בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע״ג–2013, ולתקן הישראלי ת״י 5568, המבוסס על הנחיות הנגישות הבינלאומיות WCAG 2.1 ברמה AA.</P>
        <P>ההתאמות נעשו גם בהתאם לדרישות חוק הנגישות האירופי (European Accessibility Act) והתקן האירופי EN 301 549, המפנה לאותן הנחיות.</P>
        <P>בדיקת הנגישות נערכה באמצעות כלי בדיקה אוטומטיים ובבדיקה ידנית של ניווט במקלדת, חלונות קופצים, טפסים וניגודיות צבעים.</P>
      </Section>

      <Section n={2} title="התאמות הנגישות שבוצעו">
        <List items={[
          "ניווט מלא באמצעות המקלדת בכל חלקי האתר, כולל תפריטים, מסננים, עגלת הקניות והקופה.",
          "קישור ״דלג לתוכן הראשי״ בתחילת כל עמוד.",
          "סימון בולט של הרכיב הנבחר (פוקוס) בעת ניווט במקלדת.",
          "תוויות ברורות לכל שדות הטפסים, סימון שדות חובה והודעות שגיאה המוקראות לקוראי מסך.",
          "חלונות קופצים נגישים: המיקוד עובר לחלון, נשאר בתוכו, נסגר במקש Esc וחוזר למקום שממנו נפתח.",
          "ניגודיות צבעים העומדת בדרישות רמה AA.",
          "אפשרות לעצור את החלפת התמונות האוטומטית בעמוד הבית, וכיבוד הגדרת ״הפחתת תנועה״ של מערכת ההפעלה.",
          "טקסט חלופי לתמונות, מבנה כותרות היררכי והגדרת שפת האתר (עברית) וכיוון הכתיבה.",
          "תמיכה בהגדלת תצוגה עד 200% ללא אובדן תוכן, והתאמה מלאה לטלפונים ולטאבלטים.",
          "תפריט נגישות מובנה (ראו בהמשך).",
        ]} />
      </Section>

      <Section n={3} title="תפריט הנגישות">
        <P>בכל עמוד באתר קיים כפתור נגישות קבוע, הפותח תפריט עם האפשרויות הבאות:</P>
        <List items={[
          "הגדלה והקטנה של גודל הטקסט.",
          "מצב ניגודיות גבוהה.",
          "הדגשת קישורים.",
          "גופן קריא.",
          "עצירת אנימציות ותנועה.",
          "איפוס כל ההגדרות.",
        ]} />
        <P>ההגדרות נשמרות בדפדפן שלכם לביקורים הבאים. <button type="button" onClick={openA11yMenu} style={css("background:none;border:0;padding:0;font:inherit;cursor:pointer;" + linkStyle)}>פתיחת תפריט הנגישות</button></P>
      </Section>

      <Section n={4} title="דפדפנים וטכנולוגיות מסייעות">
        <P>האתר נבדק ומותאם לגרסאות העדכניות של הדפדפנים Chrome, Safari, Edge ו־Firefox, במחשב ובטלפון, ולשימוש עם קוראי מסך כגון NVDA ו־VoiceOver.</P>
      </Section>

      <Section n={5} title="מגבלות נגישות ידועות">
        <P>למרות מאמצינו, ייתכן שחלקים מסוימים עדיין אינם נגישים באופן מלא. להלן מגבלות ידועות:</P>
        <List items={[
          "עמוד התשלום המאובטח מופעל על ידי חברת הסליקה Takbull, שהיא צד שלישי, ורמת הנגישות שלו אינה בשליטתנו המלאה.",
          "תמונות המוצרים מתוארות לפי שם המוצר; ייתכן שפרטים חזותיים עדינים (כגון גוון מדויק) אינם מתוארים במלואם — נשמח לתאר כל מוצר בפנייה אלינו.",
          "תכנים חיצוניים שאליהם האתר מקשר (כגון Instagram ו־WhatsApp) כפופים לנגישות של אותם שירותים.",
        ]} />
        <P>אם נתקלתם בקושי, נשמח שתעדכנו אותנו ונפעל לתקן אותו בהקדם.</P>
      </Section>

      <Section n={6} title="פנייה לרכז הנגישות">
        <P>נתקלתם בבעיית נגישות, או שאתם זקוקים לעזרה בביצוע הזמנה? ניתן לפנות לרכז הנגישות של Alfi Jewelry:</P>
        <div style={css("border:1px solid var(--c-line-strong);border-radius:var(--r-md);padding:6px 20px;margin:4px 0 14px;")}>
          <div style={css("display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--c-line);font-size:15px;")}>
            <span style={css("color:var(--c-ink-mute);")}>WhatsApp / טלפון</span>
            <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" dir="ltr" style={css(linkStyle)}>{CONTACT.whatsappDisplay}</a>
          </div>
          <div style={css("display:flex;justify-content:space-between;gap:12px;padding:12px 0;font-size:15px;")}>
            <span style={css("color:var(--c-ink-mute);")}>דוא״ל</span>
            <a href={CONTACT.emailUrl} dir="ltr" style={css(linkStyle + "word-break:break-all;")}>{CONTACT.email}</a>
          </div>
        </div>
        <P>כדי שנוכל לטפל בפנייה במהירות, מומלץ לציין: תיאור הבעיה, העמוד שבו נתקלתם בה, והדפדפן או הטכנולוגיה המסייעת שבהם השתמשתם.</P>
        <P>אם פנייתכם לא טופלה לשביעות רצונכם, ניתן לפנות לנציבות שוויון זכויות לאנשים עם מוגבלות במשרד המשפטים.</P>
      </Section>

      <p style={css("text-align:center;font-size:13px;color:var(--c-ink-mute);margin:24px 0 0;")}>הצהרה זו עודכנה לאחרונה ב{A11Y_UPDATED}.</p>
    </div>
  );
}
