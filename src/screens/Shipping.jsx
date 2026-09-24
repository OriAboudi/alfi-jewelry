import React from "react";
import { css } from "../lib/css.js";
import { fmt } from "../lib/format.js";
import { CONTACT } from "../lib/contact.js";
import { useStore } from "../context/StoreContext.jsx";
import { useSeoTags } from "../hooks/useSeoTags.js";

// Business-provided shipping & returns policy. The free-shipping threshold
// and fee stay admin-configured (same values as Product.jsx's accordion and
// Home.jsx's FAQ) rather than hard-coded, so the page never drifts from them.

const pStyle = "font-size:15px;line-height:1.85;color:var(--c-ink-soft);margin:0 0 12px;";
const linkStyle = "color:var(--c-ink);border-bottom:1px solid var(--c-line-strong);";

function Section({ n, title, first, children }) {
  return (
    <section style={css(`padding:34px 0;${first ? "padding-top:0;" : "border-top:1px solid var(--c-line);"}`)}>
      <div style={css("font-family:var(--font-serif);font-size:13px;letter-spacing:.2em;color:var(--c-accent);margin-bottom:6px;")}>{n}</div>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:23px;margin:0 0 16px;color:var(--c-ink);")}>{title}</h2>
      {children}
    </section>
  );
}

const P = ({ children }) => <p style={css(pStyle)}>{children}</p>;
const B = ({ children }) => <strong style={css("font-weight:600;color:var(--c-ink);")}>{children}</strong>;

function List({ items }) {
  return (
    <ul className="r-policy-list" style={css("list-style:none;margin:0 0 12px;padding:0;")}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

export function Shipping() {
  const { content: C } = useStore();
  const freeShipFrom = Number(C.freeShipFrom || 500);
  const shipFee = Number(C.shipFee || 39);

  useSeoTags({
    title: "משלוחים והחזרות · ALFI",
    description: `משלוח חינם בהזמנה מעל ${fmt(freeShipFrom)} (אחרת ${fmt(shipFee)}). זמן אספקה משוער עד 14 ימי עסקים. מדיניות ביטול, החזרות והחלפות.`,
    canonical: "/משלוחים-והחזרות",
  });

  const facts = [
    { value: fmt(freeShipFrom), label: "משלוח חינם מעל" },
    { value: "עד 14", label: "ימי עסקים לאספקה" },
    { value: "14", label: "ימים לבקשת החלפה" },
  ];

  return (
    <div className="r-container glass-card" style={css("max-width:720px;margin:30px auto;padding:56px var(--sp-5) 40px;")}>
      <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:14px;text-align:center;")}>משלוחים והחזרות</h1>
      <p style={css("font-size:16px;line-height:1.8;color:var(--c-ink-soft);text-align:center;margin:0 auto 34px;max-width:500px;")}>
        אנו עושים את מירב המאמצים כדי שההזמנה תגיע אליכם במהירות, בצורה בטוחה ובמצב מושלם.
      </p>

      <div className="r-policy-facts" style={css("margin-bottom:38px;")}>
        {facts.map((f) => (
          <div key={f.label} style={css("text-align:center;padding:18px 10px;")}>
            <div style={css("font-family:var(--font-serif);font-size:28px;font-weight:300;color:var(--c-ink);line-height:1.2;")}>{f.value}</div>
            <div style={css("font-size:13px;letter-spacing:.04em;color:var(--c-ink-mute);margin-top:4px;")}>{f.label}</div>
          </div>
        ))}
      </div>

      <Section n="01" first title="משלוחים בישראל">
        <P>משלוח עד הבית:</P>
        <List items={[
          <>משלוח <B>חינם</B> בהזמנה מעל <B>{fmt(freeShipFrom)}</B>.</>,
          <>בהזמנה מתחת ל־{fmt(freeShipFrom)}, עלות המשלוח היא <B>{fmt(shipFee)}</B>.</>,
          <>ההזמנה תישלח לכתובת שהוזנה בעת ביצוע ההזמנה.</>,
        ]} />
      </Section>

      <Section n="02" title="זמן אספקה משוער">
        <P>זמן האספקה המשוער הוא <B>עד 14 ימי עסקים</B> ממועד אישור ההזמנה והתשלום.</P>
        <P>עיכובים שאינם בשליטתנו, כגון תקלות של חברת השילוח, תנאי מזג אוויר, אירועים חריגים או נסיבות אחרות שאינן בשליטת העסק, עשויים להשפיע על מועד המסירה.</P>
      </Section>

      <Section n="03" title="ביטול עסקה והחזרת מוצר">
        <P>בהתאם להוראות חוק הגנת הצרכן, בעסקת מכר מרחוק עשויה לעמוד לצרכן זכות לבטל את העסקה בתוך התקופה הקבועה בחוק, בכפוף לתנאים ולחריגים הקבועים בדין.</P>
        <P>במקרה של ביטול עסקה שלא עקב פגם במוצר, אי התאמה או אי אספקה במועד, רשאי העסק לגבות דמי ביטול בהתאם להוראות החוק, <B>עד 5% ממחיר העסקה או 100 ₪, לפי הנמוך מביניהם</B>.</P>
        <P>במקרה של ביטול עקב פגם במוצר, אי התאמה לפרטים שנמסרו בעת הרכישה או אי אספקה במועד, <B>לא ייגבו דמי ביטול</B> בהתאם להוראות הדין.</P>
        <P>בעת החזרת מוצר, יש להחזירו במצב תקין וללא שימוש מעבר לבדיקה סבירה, ובמידת האפשר באריזתו המקורית.</P>
      </Section>

      <Section n="04" title="איך מבצעים ביטול או החזרה?">
        <P>כדי לבקש ביטול עסקה או החזרה, ניתן ליצור איתנו קשר:</P>
        <div style={css("border:1px solid var(--c-line-strong);border-radius:var(--r-md);padding:6px 20px;margin:4px 0 16px;")}>
          <div style={css("display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--c-line);font-size:15px;")}>
            <span style={css("color:var(--c-ink-mute);")}>WhatsApp</span>
            <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" dir="ltr" style={css(linkStyle)}>{CONTACT.whatsappDisplay}</a>
          </div>
          <div style={css("display:flex;justify-content:space-between;gap:12px;padding:12px 0;font-size:15px;")}>
            <span style={css("color:var(--c-ink-mute);")}>דוא״ל</span>
            <a href={CONTACT.emailUrl} dir="ltr" style={css(linkStyle + "word-break:break-all;")}>{CONTACT.email}</a>
          </div>
        </div>
        <P>בהודעת הביטול מומלץ לציין את שם המזמין, מספר ההזמנה ופרטי ההתקשרות.</P>
      </Section>

      <Section n="05" title="מדיניות החלפות">
        <P>אנו מאפשרים החלפת מוצר בהתאם לתנאים הבאים:</P>
        <List items={[
          <>יש לפנות אלינו בנוגע להחלפה <B>בתוך 14 ימים</B> ממועד קבלת המוצר.</>,
          <>המוצר צריך להיות במצב תקין וללא שימוש.</>,
          <>המוצר יוחזר, ככל שניתן, באריזתו המקורית.</>,
          <>החלפה כפופה לזמינות המוצר המבוקש.</>,
        ]} />
        <P>אם המוצר שהתקבל פגום או אינו תואם להזמנה, יש ליצור איתנו קשר בהקדם האפשרי ונפעל בהתאם להוראות הדין.</P>
      </Section>

      <Section n="06" title="משלוחים לחו״ל">
        <P>בשלב זה אנו מבצעים משלוחים <B>בישראל בלבד</B>.</P>
        <P>משלוחים למדינות אחרות עשויים להתווסף בעתיד, בכפוף להצגת תנאי המשלוח, העלויות והמדיניות הרלוונטית באתר.</P>
      </Section>

      <aside style={css("margin-top:8px;padding:20px 22px;border-right:2px solid var(--c-accent);background:rgba(255,255,255,.35);")}>
        <div style={css("font-family:var(--font-serif);font-size:18px;color:var(--c-ink);margin-bottom:8px;")}>חשוב לדעת</div>
        <p style={css("font-size:14px;line-height:1.8;color:var(--c-ink-soft);margin:0 0 6px;")}>האמור במדיניות זו אינו גורע מזכויות הצרכן המוקנות לפי חוק הגנת הצרכן וכל דין.</p>
        <p style={css("font-size:14px;line-height:1.8;color:var(--c-ink-soft);margin:0;")}>במקרה של סתירה בין הוראות מדיניות זו לבין הוראות הדין, יגברו הוראות הדין.</p>
      </aside>
    </div>
  );
}
