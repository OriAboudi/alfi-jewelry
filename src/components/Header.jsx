import React, { useState } from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";

// Category-forward nav (tzufa.co.il pattern): categories are top-level nav
// items that pre-filter the catalog, not buried behind one generic link.
const CATEGORY_LINKS = ["הכל", "טבעות", "שרשראות", "עגילים", "צמידים", "אקססוריז"];

export function Header() {
  const { go, screen, catFilter, setCatFilter, cartCount } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const goCat = (cat) => {
    setMenuOpen(false);
    setCatFilter(cat);
    go("catalog");
  };
  const goCollections = () => {
    setMenuOpen(false);
    go("collections");
  };
  const navigate = (target) => {
    setMenuOpen(false);
    go(target);
  };

  const isCatActive = (cat) => screen === "catalog" && catFilter === cat;
  const isCollectionsActive = screen === "collections";

  const navLink = (active) => `cursor:pointer;color:${active ? "var(--c-ink)" : "var(--c-ink-mute)"};font-weight:${active ? 700 : 500};transition:color var(--dur) var(--ease);`;

  return (
    <header style={css("position:sticky;top:0;z-index:40;background:var(--c-surface-glass-strong);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--c-line);")}>
      <div className="container r-header-inner" style={css("display:flex;align-items:center;justify-content:space-between;gap:var(--sp-5);height:64px;")}>
        <nav className="r-header-nav" style={css("display:flex;gap:24px;align-items:center;font-size:14.5px;letter-spacing:.01em;")}>
          {CATEGORY_LINKS.map((cat) => (
            <a key={cat} onClick={() => goCat(cat)} aria-current={isCatActive(cat) ? "page" : undefined} style={css(navLink(isCatActive(cat)))}>{cat}</a>
          ))}
          <a onClick={goCollections} aria-current={isCollectionsActive ? "page" : undefined} style={css(navLink(isCollectionsActive))}>קולקציות</a>
        </nav>

        <button
          className="r-header-burger tap-target"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="תפריט"
          aria-expanded={menuOpen}
          style={css("display:none;width:44px;height:44px;border:none;background:none;cursor:pointer;align-items:center;justify-content:center;padding:0;flex:none;")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>

        <div onClick={() => navigate("home")} style={css("cursor:pointer;text-align:center;")}>
          <div style={css("font-family:var(--font-serif);font-size:24px;font-weight:500;letter-spacing:.16em;line-height:1;")}>ALFI</div>
          <div style={css("font-size:9px;letter-spacing:.4em;color:var(--c-accent);margin-top:3px;")}>תכשיטי כסף</div>
        </div>

        <div style={css("display:flex;gap:18px;align-items:center;font-size:15px;")}>
          <span onClick={() => navigate("cart")} className="tap-target" style={css("cursor:pointer;display:flex;align-items:center;gap:7px;")} aria-label={`עגלה, ${cartCount} פריטים`}>
            עגלה
            <span style={css("display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 6px;background:var(--c-accent);color:#fff;border-radius:var(--r-pill);font-size:12px;font-weight:600;")}>{cartCount}</span>
          </span>
        </div>
      </div>

      {menuOpen && (
        <nav className="r-header-menu" style={css("border-top:1px solid var(--c-line);background:var(--c-bg);padding:6px var(--sp-4) 16px;display:flex;flex-direction:column;")}>
          {CATEGORY_LINKS.map((cat) => (
            <a key={cat} onClick={() => goCat(cat)} style={css("padding:15px 2px;border-bottom:1px solid var(--c-line);cursor:pointer;color:var(--c-ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;")}>{cat}</a>
          ))}
          <a onClick={goCollections} style={css("padding:15px 2px;cursor:pointer;color:var(--c-ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;")}>קולקציות</a>
        </nav>
      )}
    </header>
  );
}
