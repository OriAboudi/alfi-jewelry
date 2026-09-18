import React, { useState } from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";
import { CONTACT } from "../lib/contact.js";

// Reset-styled <button> instead of a <span onClick> — real button semantics
// mean native keyboard support (Tab + Enter/Space) for free.
const linkBtn = "cursor:pointer;background:none;border:none;padding:0;margin:0;font:inherit;color:inherit;text-align:right;display:block;width:100%;";
const colHeading = "font-weight:600;color:var(--cream);";
const colList = "display:flex;flex-direction:column;gap:12px;font-size:15px;color:inherit;";

// Desktop's "שירות"/mobile's "שירות לקוחות" column: "משלוחים והחזרות" maps to
// the real shipping/returns page; the other two have no dedicated page or
// data anywhere in the app (no ring-size guide, no standalone care page —
// Product.jsx has a care *accordion*, not a route), so per HANDOFF.md
// ("render missing content as static") they're plain non-interactive text,
// not invented links.
function ServiceList({ go, textStyle }) {
  return (
    <>
      <button onClick={() => go("shipping")} style={css(linkBtn + textStyle)}>משלוחים והחזרות</button>
      <span style={css(textStyle)}>מידות טבעת</span>
      <span style={css(textStyle)}>טיפול בכסף</span>
    </>
  );
}

function ContactList({ textStyle }) {
  return (
    <>
      <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" style={css(textStyle + "direction:ltr;text-align:right;")}>{CONTACT.whatsappDisplay}</a>
      <a href={CONTACT.emailUrl} style={css(textStyle + "direction:ltr;text-align:right;")}>{CONTACT.email}</a>
      <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer" style={css(textStyle)}>{CONTACT.instagramHandle}</a>
    </>
  );
}

export function Footer() {
  const { go, setCatFilter } = useStore();
  const goCat = (c) => { setCatFilter(c); go("catalog"); };
  const [openSection, setOpenSection] = useState(null);

  const mobileLinkStyle = "color:var(--cream);";
  const desktopLinkStyle = "";

  const accordionRow = (key, label, content) => {
    const open = openSection === key;
    return (
      <div key={key}>
        <button
          onClick={() => setOpenSection(open ? null : key)}
          aria-expanded={open}
          style={css("width:100%;height:54px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--divider-dark);background:none;border-width:0 0 1px 0;color:var(--cream);font-size:16px;font:inherit;cursor:pointer;padding:0;text-align:right;")}
        >
          {label}
          <span className={`rd-acc-plus${open ? " rd-acc-open" : ""}`} aria-hidden="true">+</span>
        </button>
        {open && (
          <div style={css("padding:16px 4px;")}>
            <div style={css(colList + "color:var(--cream);")}>{content}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <footer className="rd-footer-glass" style={css("color:#E6DAE6;")}>
      {/* ---- Desktop (>=768px) ---- */}
      <div className="rd-footer-desktop" style={css("padding:72px 64px 40px;flex-direction:column;gap:48px;")}>
        <div style={css("display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:40px;")}>
          <div className="serif" style={css("font-size:36px;letter-spacing:.42em;color:var(--cream);")}>ALFI</div>
          <div style={css(colList)}>
            <strong style={css(colHeading)}>חנות</strong>
            <button onClick={() => goCat("טבעות")} style={css(linkBtn)}>טבעות</button>
            <button onClick={() => goCat("שרשראות")} style={css(linkBtn)}>שרשראות</button>
            <button onClick={() => goCat("עגילים")} style={css(linkBtn)}>עגילים</button>
            <button onClick={() => goCat("צמידים")} style={css(linkBtn)}>צמידים</button>
          </div>
          <div style={css(colList)}>
            <strong style={css(colHeading)}>שירות</strong>
            <ServiceList go={go} textStyle={desktopLinkStyle} />
          </div>
          <div style={css(colList)}>
            <strong style={css(colHeading)}>צרי קשר</strong>
            <ContactList textStyle={desktopLinkStyle} />
          </div>
        </div>
        <div style={css("font-size:13px;color:#C3B3C4;border-top:1px solid var(--divider-dark);padding-top:24px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;")}>
          <span>© ALFI · תכשיטי כסף בעבודת יד</span>
          <span style={css("display:flex;flex-wrap:wrap;gap:16px;")}>
            <button onClick={() => go("contact")} style={css(linkBtn + "width:auto;color:#C3B3C4;")}>צור קשר</button>
            <button onClick={() => go("privacy")} style={css(linkBtn + "width:auto;color:#C3B3C4;")}>מדיניות פרטיות</button>
            <button onClick={() => go("terms")} style={css(linkBtn + "width:auto;color:#C3B3C4;")}>תנאי שימוש</button>
          </span>
        </div>
      </div>

      {/* ---- Mobile (<768px) — real accordions, not the mockup's static "+" ---- */}
      <div className="rd-footer-mobile" style={css("padding:44px 24px 32px;flex-direction:column;gap:28px;")}>
        <div className="serif" style={css("font-size:30px;letter-spacing:.36em;color:var(--cream);")}>ALFI</div>
        <div>
          {accordionRow("shop", "חנות", (
            <>
              <button onClick={() => goCat("טבעות")} style={css(linkBtn + "color:var(--cream);")}>טבעות</button>
              <button onClick={() => goCat("שרשראות")} style={css(linkBtn + "color:var(--cream);")}>שרשראות</button>
              <button onClick={() => goCat("עגילים")} style={css(linkBtn + "color:var(--cream);")}>עגילים</button>
              <button onClick={() => goCat("צמידים")} style={css(linkBtn + "color:var(--cream);")}>צמידים</button>
            </>
          ))}
          {accordionRow("service", "שירות לקוחות", <ServiceList go={go} textStyle={mobileLinkStyle} />)}
          {accordionRow("contact", "צרי קשר", <ContactList textStyle={mobileLinkStyle} />)}
        </div>
        <div style={css("font-size:12px;color:#C3B3C4;")}>© ALFI · תכשיטי כסף בעבודת יד</div>
        <div style={css("display:flex;flex-wrap:wrap;gap:16px;font-size:12px;")}>
          <button onClick={() => go("contact")} style={css(linkBtn + "width:auto;color:#C3B3C4;")}>צור קשר</button>
          <button onClick={() => go("privacy")} style={css(linkBtn + "width:auto;color:#C3B3C4;")}>מדיניות פרטיות</button>
          <button onClick={() => go("terms")} style={css(linkBtn + "width:auto;color:#C3B3C4;")}>תנאי שימוש</button>
        </div>
      </div>
    </footer>
  );
}
