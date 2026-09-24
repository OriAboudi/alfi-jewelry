import React from "react";
import { css } from "../lib/css.js";
import { CONTACT } from "../lib/contact.js";

// Business-provided privacy policy text. Rendered both as the /מדיניות-פרטיות
// page (Privacy.jsx) and inside PrivacyPolicyModal (checkout / sign-up
// consent checkboxes), so there is exactly one copy of the wording.

export const PRIVACY_UPDATED = "ספטמבר 2026";

const pStyle = "font-size:15px;line-height:1.85;color:var(--c-ink-soft);margin:0 0 12px;";
const linkStyle = "color:var(--c-ink);border-bottom:1px solid var(--c-line-strong);";

const P = ({ children }) => <p style={css(pStyle)}>{children}</p>;

function Section({ n, title, first, children }) {
  return (
    <section style={css(`padding:30px 0;${first ? "padding-top:0;" : "border-top:1px solid var(--c-line);"}`)}>
      <div style={css("font-family:var(--font-serif);font-size:13px;letter-spacing:.2em;color:var(--c-accent);margin-bottom:6px;")}>{String(n).padStart(2, "0")}</div>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:22px;margin:0 0 14px;color:var(--c-ink);")}>{title}</h2>
      {children}
    </section>
  );
}

function ContactBox() {
  return (
    <div style={css("border:1px solid var(--c-line-strong);border-radius:var(--r-md);padding:6px 20px;margin:4px 0 14px;")}>
      <div style={css("display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--c-line);font-size:15px;")}>
        <span style={css("color:var(--c-ink-mute);")}>דוא״ל</span>
        <a href={CONTACT.emailUrl} dir="ltr" style={css(linkStyle + "word-break:break-all;")}>{CONTACT.email}</a>
      </div>
      <div style={css("display:flex;justify-content:space-between;gap:12px;padding:12px 0;font-size:15px;")}>
        <span style={css("color:var(--c-ink-mute);")}>WhatsApp</span>
        <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" dir="ltr" style={css(linkStyle)}>{CONTACT.whatsappDisplay}</a>
      </div>
    </div>
  );
}

export function PrivacyPolicyContent() {
  return (
    <>
      <p style={css("font-size:16px;line-height:1.8;color:var(--c-ink-soft);margin:0 0 12px;")}>
        Alfi Jewelry מכבדת את פרטיות המשתמשים והלקוחות באתר ופועלת בהתאם להוראות הדין החלות על הגנת הפרטיות.
      </p>
      <p style={css("font-size:16px;line-height:1.8;color:var(--c-ink-soft);margin:0 0 34px;")}>
        מדיניות זו מסבירה איזה מידע עשוי להיאסף במסגרת השימוש באתר, לאילו מטרות נעשה בו שימוש, כיצד אנו שומרים עליו ומהן זכויות המשתמשים ביחס למידע.
      </p>

      <Section n={1} first title="מידע אישי">
        <P>במסגרת השימוש באתר וביצוע רכישה, עשוי להימסר לנו מידע אישי כגון:</P>
        <P><strong style={css("font-weight:600;color:var(--c-ink);")}>שם מלא, מספר טלפון, כתובת דוא״ל, כתובת למשלוח, פרטי הזמנה ופרטי התקשרות.</strong></P>
        <P>המידע שנדרש לצורך ביצוע עסקה או אספקת מוצר עשוי להיות הכרחי לצורך מתן השירות. אי מסירת מידע הדרוש לביצוע הפעולה עלולה למנוע מאיתנו לספק את השירות או להשלים את העסקה.</P>
        <P>אנו עשויים לקבל גם מידע טכני הקשור לשימוש באתר, כגון כתובת IP, סוג דפדפן, סוג מכשיר, מערכת הפעלה, עמודים שנצפו, זמני גישה ונתונים טכניים אחרים, בהתאם לכלים ולשירותים המופעלים באתר.</P>
      </Section>

      <Section n={2} title="מטרות השימוש במידע">
        <P>המידע עשוי לשמש, בין היתר, למטרות הבאות:</P>
        <P>עיבוד וביצוע הזמנות.</P>
        <P>אספקת מוצרים ומשלוחים.</P>
        <P>יצירת קשר עם לקוחות בנוגע להזמנות, תשלומים, משלוחים, ביטולים או שירות לקוחות.</P>
        <P>מתן שירות ותמיכה.</P>
        <P>שיפור האתר, חוויית המשתמש והשירותים.</P>
        <P>מניעת שימוש לרעה, הונאה או פעילות בלתי מורשית.</P>
        <P>שמירה על אבטחת האתר והמערכות.</P>
        <P>עמידה בדרישות החוק והדין.</P>
        <P>שליחת תוכן שיווקי, ככל שהדבר מותר על פי דין ובהתאם להסכמה או למנגנון החוקי הרלוונטי.</P>
      </Section>

      <Section n={3} title="ספקי שירות וצדדים שלישיים">
        <P>לצורך הפעלת האתר ומתן השירותים, ייתכן שהמידע יטופל באמצעות ספקי שירות חיצוניים, בהתאם לצורך, כגון ספקי אחסון, מסדי נתונים, שירותי דוא״ל, סליקה ותשלומים, משלוחים, אבטחה, אנליטיקה ושירותים טכנולוגיים נוספים.</P>
        <P>ספקי השירות עשויים לעבד מידע בהתאם לתפקידם ולתנאים שלהם.</P>
        <P>כאשר הדבר נדרש, המידע עשוי להיות מעובד או מאוחסן מחוץ לישראל, בהתאם לדין החל.</P>
      </Section>

      <Section n={4} title="תשלומים">
        <P>פרטי תשלום מלאים כגון מספר כרטיס אשראי עשויים להיות מעובדים ישירות באמצעות ספק שירותי התשלום המשמש באתר.</P>
        <P>אנו לא נשמור פרטי כרטיס אשראי מלאים במערכות שלנו, אלא אם צוין אחרת במפורש ונעשה הדבר בהתאם לדרישות הדין והאבטחה.</P>
      </Section>

      <Section n={5} title="עוגיות וטכנולוגיות דומות">
        <P>האתר עשוי להשתמש בקובצי Cookies ובטכנולוגיות דומות לצורך תפעול האתר, שמירת העדפות, אבטחה, ניתוח שימוש ושיפור חוויית המשתמש.</P>
        <P>ייתכן שגם ספקי שירות חיצוניים המשולבים באתר יעשו שימוש בטכנולוגיות דומות.</P>
        <P>ניתן לנהל או להגביל Cookies באמצעות הגדרות הדפדפן, אולם חסימת Cookies מסוימים עלולה להשפיע על פעילות האתר.</P>
      </Section>

      <Section n={6} title="מידע לצורכי שיווק">
        <P>במקרים שבהם הדבר מותר על פי דין, אנו עשויים להשתמש בפרטי קשר לצורך שליחת עדכונים, הצעות או מידע שיווקי.</P>
        <P>הודעות שיווקיות יישלחו בהתאם להוראות הדין ולמנגנוני ההסרה הרלוונטיים.</P>
        <P>ניתן לבקש להפסיק קבלת תוכן שיווקי בהתאם לאפשרויות המפורטות בהודעה או באמצעות פנייה אלינו.</P>
      </Section>

      <Section n={7} title="אבטחת מידע">
        <P>אנו נוקטים אמצעים סבירים ומקובלים לצורך הגנה על המידע שבשליטתנו מפני גישה בלתי מורשית, שימוש לרעה, שינוי, אובדן או חשיפה.</P>
        <P>עם זאת, אין מערכת מידע או שירות מקוון שניתן להבטיח שיהיו חסינים לחלוטין מפני כל אירוע אבטחה.</P>
        <P>לפיכך, בכפוף להוראות הדין, אין באמור במדיניות זו משום התחייבות לכך שלא יתרחש אירוע אבטחת מידע.</P>
        <P>במקרה של אירוע אבטחה המחייב דיווח או פעולה בהתאם לדין, נפעל בהתאם להוראות הדין הרלוונטיות.</P>
      </Section>

      <Section n={8} title="שמירת מידע">
        <P>אנו עשויים לשמור מידע אישי למשך התקופה הנדרשת לצורך המטרות שלשמן נאסף, לצורך ביצוע עסקאות, מתן שירות, עמידה בדרישות חוקיות, טיפול במחלוקות, הגנה על זכויות העסק או בהתאם לחובות שמירת מידע החלות עלינו.</P>
        <P>כאשר אין עוד צורך במידע, נפעל למחיקתו או לאנונימיזציה שלו, בכפוף לחובות חוקיות או לצורך לגיטימי בשמירתו.</P>
      </Section>

      <Section n={9} title="זכויות ביחס למידע אישי">
        <P>בהתאם להוראות הדין, למשתמש עשויות לעמוד זכויות ביחס למידע האישי הנוגע אליו, לרבות זכויות עיון, תיקון או זכויות אחרות הקבועות בדין.</P>
        <P>בקשה הנוגעת למידע אישי ניתן לשלוח ל:</P>
        <ContactBox />
        <P>הבקשה תיבחן בהתאם להוראות הדין ולנסיבות הרלוונטיות.</P>
      </Section>

      <Section n={10} title="מידע של קטינים">
        <P>האתר אינו מיועד לילדים מתחת לגיל שבו מותר לבצע רכישות באופן עצמאי לפי הדין.</P>
        <P>אנו מבקשים שלא למסור לנו מידע אישי של קטין ללא הסכמת הורה או אפוטרופוס כאשר הסכמה כזו נדרשת על פי דין.</P>
      </Section>

      <Section n={11} title="קישורים ושירותים חיצוניים">
        <P>האתר עשוי לכלול קישורים או שילובים של שירותים חיצוניים.</P>
        <P>השימוש בשירות חיצוני עשוי להיות כפוף למדיניות הפרטיות ולתנאי השימוש של אותו ספק.</P>
        <P>אנו ממליצים לעיין במדיניות הפרטיות של השירות החיצוני לפני מסירת מידע אישי באמצעותו.</P>
      </Section>

      <Section n={12} title="שינויים במדיניות הפרטיות">
        <P>אנו רשאים לעדכן מדיניות פרטיות זו מעת לעת, בין היתר בעקבות שינוי בפעילות האתר, שינוי טכנולוגי או שינוי בדרישות הדין.</P>
        <P>הגרסה העדכנית של המדיניות תפורסם באתר ותכלול את מועד העדכון האחרון.</P>
      </Section>

      <Section n={13} title="יצירת קשר">
        <P>לכל שאלה בנוגע למדיניות הפרטיות או לטיפול במידע אישי ניתן לפנות אלינו:</P>
        <P><strong style={css("font-weight:600;color:var(--c-ink);")}>Alfi Jewelry</strong></P>
        <ContactBox />
      </Section>

      <aside style={css("margin-top:8px;padding:20px 22px;border-right:2px solid var(--c-accent);background:rgba(255,255,255,.35);")}>
        <div style={css("font-family:var(--font-serif);font-size:18px;color:var(--c-ink);margin-bottom:8px;")}>14. הוראות הדין</div>
        <p style={css("font-size:14px;line-height:1.8;color:var(--c-ink-soft);margin:0 0 6px;")}>מדיניות זו כפופה להוראות הדין החלות במדינת ישראל.</p>
        <p style={css("font-size:14px;line-height:1.8;color:var(--c-ink-soft);margin:0;")}>במקרה של סתירה בין הוראה במדיניות זו לבין הוראה קוגנטית בדין, תגבר הוראת הדין.</p>
      </aside>

      <p style={css("text-align:center;font-size:13px;color:var(--c-ink-mute);margin:30px 0 0;")}>© Alfi Jewelry. כל הזכויות שמורות.</p>
    </>
  );
}
