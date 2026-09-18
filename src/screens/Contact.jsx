import React from "react";
import { css } from "../lib/css.js";
import { FlowerMark } from "../components/Ornaments.jsx";
import { WhatsAppIcon, InstagramIcon, EmailIcon } from "../components/ContactIcons.jsx";
import { CONTACT } from "../lib/contact.js";

const row = "display:flex;align-items:center;gap:16px;padding:18px;border:1px solid var(--c-line);border-radius:var(--r-lg);background:#fff;text-decoration:none;color:inherit;";
const iconWrap = "flex:none;width:48px;height:48px;border-radius:50%;background:var(--c-accent-soft);color:var(--c-accent-dark);display:flex;align-items:center;justify-content:center;";

function ContactRow({ icon, label, value, href, external }) {
  return (
    <a
      href={href}
      className="hover-lift tap-target"
      style={css(row)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span style={css(iconWrap)}>{icon}</span>
      <span>
        <div style={css("font-weight:700;font-size:15.5px;margin-bottom:2px;")}>{label}</div>
        <div style={css("font-size:14px;color:var(--c-ink-mute);direction:ltr;text-align:right;")}>{value}</div>
      </span>
    </a>
  );
}

export function Contact() {
  return (
    <div className="r-container glass-card" style={css("max-width:640px;margin:30px auto;padding:56px var(--sp-5) 70px;text-align:center;")}>
      <FlowerMark width={130} height={48} style={{ margin: "0 auto 18px", display: "block" }} />
      <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:10px;")}>יצירת קשר</h1>
      <p style={css("font-size:15.5px;color:var(--c-ink-soft);margin-bottom:34px;")}>נשמח לשמוע מכם — הכי נוח ליצור קשר באחת מהדרכים הבאות:</p>

      <div style={css("display:flex;flex-direction:column;gap:12px;text-align:right;")}>
        <ContactRow
          icon={<WhatsAppIcon size={22} />}
          label="וואטסאפ"
          value={CONTACT.whatsappDisplay}
          href={CONTACT.whatsappUrl}
          external
        />
        <ContactRow
          icon={<EmailIcon size={22} />}
          label="אימייל"
          value={CONTACT.email}
          href={CONTACT.emailUrl}
        />
        <ContactRow
          icon={<InstagramIcon size={22} />}
          label="אינסטגרם"
          value={CONTACT.instagramHandle}
          href={CONTACT.instagramUrl}
          external
        />
      </div>
    </div>
  );
}
