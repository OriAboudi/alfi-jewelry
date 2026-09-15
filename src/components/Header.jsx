import React, { useState } from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";

const LINKS = [
  ["home", "בית"],
  ["catalog", "קטלוג"],
  ["collections", "קולקציות"],
  ["story", "הסיפור שלנו"],
];

export function Header() {
  const { go, screen, cartCount } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (target) => {
    setMenuOpen(false);
    go(target);
  };

  return (
    <header style={css("position:sticky;top:0;z-index:40;background:var(--c-surface-glass-strong);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--c-line);")}>
      <div className="container r-header-inner" style={css("display:flex;align-items:center;justify-content:space-between;gap:var(--sp-5);height:64px;")}>
        <nav className="r-header-nav" style={css("display:flex;gap:28px;align-items:center;font-size:15px;letter-spacing:.01em;")}>
          {LINKS.map(([k, label]) => (
            <a key={k} onClick={() => go(k)} aria-current={screen === k ? "page" : undefined} style={css(`cursor:pointer;color:${screen === k ? "var(--c-ink)" : "var(--c-ink-mute)"};font-weight:${screen === k ? 700 : 500};transition:color var(--dur) var(--ease);`)}>{label}</a>
          ))}
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
          {LINKS.map(([k, label]) => (
            <a key={k} onClick={() => navigate(k)} style={css("padding:15px 2px;border-bottom:1px solid var(--c-line);cursor:pointer;color:var(--c-ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;")}>{label}</a>
          ))}
        </nav>
      )}
    </header>
  );
}
