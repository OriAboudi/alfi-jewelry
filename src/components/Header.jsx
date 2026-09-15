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
  const { go, cartCount } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (screen) => {
    setMenuOpen(false);
    go(screen);
  };

  return (
    <header style={css("position:sticky;top:0;z-index:40;background:rgba(250,245,239,.88);backdrop-filter:blur(14px);border-bottom:1px solid #ecdccd;")}>
      <div className="r-header-inner" style={css("max-width:1240px;margin:0 auto;padding:0 32px;height:76px;display:flex;align-items:center;justify-content:space-between;gap:24px;")}>
        <nav className="r-header-nav" style={css("display:flex;gap:28px;align-items:center;font-size:15px;letter-spacing:.01em;")}>
          {LINKS.map(([k, label]) => (
            <a key={k} onClick={() => go(k)} style={css(`cursor:pointer;color:${k === "home" || k === "catalog" ? "#3a2c25" : "#8a766a"};text-decoration:none;`)}>{label}</a>
          ))}
        </nav>

        <button
          className="r-header-burger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="תפריט"
          aria-expanded={menuOpen}
          style={css("display:none;width:38px;height:38px;border:none;background:none;cursor:pointer;align-items:center;justify-content:center;padding:0;flex:none;")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3a2c25" strokeWidth="2" strokeLinecap="round">
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
          <div style={css("font-family:'Frank Ruhl Libre',serif;font-size:27px;font-weight:500;letter-spacing:.16em;line-height:1;")}>ALFI</div>
          <div style={css("font-size:9.5px;letter-spacing:.42em;color:#bd7355;margin-top:3px;")}>תכשיטי כסף</div>
        </div>

        <div style={css("display:flex;gap:18px;align-items:center;font-size:15px;")}>
          <span onClick={() => navigate("cart")} style={css("cursor:pointer;display:flex;align-items:center;gap:7px;")}>
            עגלה
            <span style={css("display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 6px;background:#bd7355;color:#fff;border-radius:11px;font-size:12px;font-weight:600;")}>{cartCount}</span>
          </span>
        </div>
      </div>

      {menuOpen && (
        <nav className="r-header-menu" style={css("border-top:1px solid #ecdccd;background:#faf5ef;padding:6px 22px 16px;display:flex;flex-direction:column;")}>
          {LINKS.map(([k, label]) => (
            <a key={k} onClick={() => navigate(k)} style={css("padding:15px 2px;border-bottom:1px solid #ecdccd;cursor:pointer;color:#3a2c25;text-decoration:none;font-size:16px;")}>{label}</a>
          ))}
        </nav>
      )}
    </header>
  );
}
