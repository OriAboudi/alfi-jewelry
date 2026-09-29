import React, { useEffect, useRef, useState } from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";
import { SearchOverlay } from "./SearchOverlay.jsx";
import { pathFor, DEAL_FILTER } from "../lib/routes.js";
import { bundleConfig } from "../lib/pricing.js";

// The 4 categories now live under a "קטגוריות" dropdown (desktop) /
// accordion (mobile menu), next to "סטים" and "מבצעים".
const CATEGORY_LINKS = ["טבעות", "שרשראות", "עגילים", "צמידים"];

const iconBtnDesktop = "width:44px;height:44px;border:0;background:transparent;cursor:pointer;color:var(--ink);display:flex;align-items:center;justify-content:center;padding:0;flex:none;";
const iconBtnMobile = "width:48px;height:48px;border:0;background:transparent;cursor:pointer;color:var(--ink);display:flex;align-items:center;justify-content:center;padding:0;flex:none;";
const cartBadge = "position:absolute;top:-8px;left:-8px;min-width:16px;height:16px;border-radius:50%;background:var(--ink-fill);color:var(--cream);font-size:10px;line-height:16px;text-align:center;padding:0 3px;box-sizing:border-box;";

export function Header() {
  const { go, screen, catFilter, cartCount, favoritesCount, customer, authReady, openAuth, customerLogout, content } = useStore();
  const deal = bundleConfig(content);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // "קטגוריות": desktop dropdown / mobile-menu accordion.
  const [catsOpen, setCatsOpen] = useState(false);
  const [mCatsOpen, setMCatsOpen] = useState(false);
  const catsRef = useRef(null);
  useEffect(() => {
    if (!catsOpen) return undefined;
    const onDown = (e) => { if (catsRef.current && !catsRef.current.contains(e.target)) setCatsOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setCatsOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [catsOpen]);

  // Plays a one-shot "bump" on the cart icon whenever an item is added
  // (cartCount going up) — a removeItem/qty-decrease won't retrigger it,
  // only a genuine addition.
  const [cartBump, setCartBump] = useState(false);
  const prevCartCount = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBump(true);
      const t = setTimeout(() => setCartBump(false), 500);
      prevCartCount.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  const goCat = (cat) => (e) => {
    e.preventDefault();
    setMenuOpen(false);
    setCatsOpen(false);
    go("catalog", cat);
  };
  const goSets = (e) => { e.preventDefault(); setMenuOpen(false); go("sets"); };
  const goDeal = (e) => { e.preventDefault(); setMenuOpen(false); go("catalog", DEAL_FILTER); };
  const goCollections = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    go("collections");
  };
  const goStory = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    go("story");
  };
  const navigate = (target) => {
    setMenuOpen(false);
    go(target);
  };

  const isCatActive = (cat) => screen === "catalog" && catFilter === cat;
  const isCatsActive = screen === "catalog" && catFilter !== DEAL_FILTER;
  const isSetsActive = screen === "sets";
  const isDealActive = screen === "catalog" && catFilter === DEAL_FILTER;
  const isCollectionsActive = screen === "collections";
  const isStoryActive = screen === "story";

  // A plain <span> has no implicit ARIA role, and role-less/"generic"
  // elements don't accept aria-label (axe: aria-prohibited-attr) — these
  // spans act as buttons (onClick), so role="button" + tabIndex + Enter/
  // Space activation make that legitimate instead of just silencing the
  // linter.
  const asButton = (handler) => ({
    role: "button",
    tabIndex: 0,
    onClick: handler,
    onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(e); } },
  });

  // Customer account (Supabase Auth): signed in → the account page (orders,
  // details, logout); signed out → the login/register dialog. Nothing
  // account-specific renders until the session check finished (authReady),
  // so a signed-in shopper never sees "התחברות" flash first.
  const firstName = customer ? String(customer.name || customer.email || "").split(/[s@]/)[0] : "";
  const accountLabel = customer ? `החשבון שלי, ${firstName}` : "כניסה / הרשמה";
  const accountAction = customer ? () => navigate("my-orders") : () => { setMenuOpen(false); openAuth(); };
  // Back/forward (or any screen change) closes the open mobile menu.
  useEffect(() => { setMenuOpen(false); }, [screen, catFilter]);

  const CartIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
  );
  const HeartIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>
  );
  const SearchIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
  );
  const PersonIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  );
  const MenuIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M4 8h16M4 16h11" /></svg>
  );

  return (
    <>
      <header className="glass" style={css("position:sticky;top:0;z-index:40;box-sizing:border-box;border-width:0 0 1px 0;border-color:rgba(58,45,61,.08);")}>
        {/* ---- Desktop bar (>=768px) ---- */}
        <div className="rd-header-desktop" style={css("height:92px;box-sizing:border-box;padding:0 clamp(24px, 4.4vw, 64px);align-items:center;")}>
          <nav className="rd-nav" style={css("display:flex;gap:clamp(16px, 2vw, 36px);white-space:nowrap;font-size:15px;letter-spacing:.04em;")}>
            <div ref={catsRef} className="rd-nav-drop">
              <button type="button" className="rd-nav-drop-btn" aria-expanded={catsOpen} aria-haspopup="true" aria-current={isCatsActive ? "page" : undefined} onClick={() => setCatsOpen((v) => !v)}>
                קטגוריות
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" style={css(`transition:transform .2s;transform:rotate(${catsOpen ? 180 : 0}deg);`)}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {catsOpen && (
                <div className="rd-nav-drop-panel glass-strong">
                  {CATEGORY_LINKS.map((cat) => (
                    <a key={cat} href={pathFor("catalog", { catFilter: cat })} onClick={goCat(cat)} aria-current={isCatActive(cat) ? "page" : undefined}>{cat}</a>
                  ))}
                  <a href={pathFor("catalog", { catFilter: "הכל" })} onClick={goCat("הכל")} className="rd-nav-drop-all">כל התכשיטים</a>
                </div>
              )}
            </div>
            <a href={pathFor("sets")} {...asButton(goSets)} aria-current={isSetsActive ? "page" : undefined} style={css("cursor:pointer;")}>סטים</a>
            <a href={pathFor("catalog", { catFilter: DEAL_FILTER })} {...asButton(goDeal)} aria-current={isDealActive ? "page" : undefined} style={css("cursor:pointer;")}>מבצעים</a>
            <a href={pathFor("collections")} {...asButton(goCollections)} aria-current={isCollectionsActive ? "page" : undefined} style={css("cursor:pointer;")}>קולקציות</a>
            <a href={pathFor("story")} {...asButton(goStory)} aria-current={isStoryActive ? "page" : undefined} style={css("cursor:pointer;")}>הסיפור</a>
          </nav>
          <span
            {...asButton(() => navigate("home"))}
            className="serif"
            style={css("justify-self:center;cursor:pointer;font-size:34px;font-weight:400;letter-spacing:.42em;padding-right:.42em;color:var(--ink);")}
          >ALFI</span>
          <div style={css("display:flex;gap:8px;justify-content:flex-start;flex-direction:row-reverse;align-items:center;")}>
            <span {...asButton(() => navigate("cart"))} className={`tap-target${cartBump ? " cart-bump" : ""}`} aria-label={`סל קניות, ${cartCount} פריטים`} style={css(`position:relative;${iconBtnDesktop}`)}>
              <CartIcon />
              {cartCount > 0 && <span style={css(cartBadge)}>{cartCount}</span>}
            </span>
            <span {...asButton(() => navigate("favorites"))} className="tap-target" aria-label={`מועדפים, ${favoritesCount} פריטים`} style={css(`position:relative;${iconBtnDesktop}`)}>
              <HeartIcon />
              {favoritesCount > 0 && <span style={css(cartBadge)}>{favoritesCount}</span>}
            </span>
            <button onClick={() => setSearchOpen(true)} aria-label="חיפוש" className="tap-target" style={css(iconBtnDesktop)}><SearchIcon /></button>
            <span {...asButton(accountAction)} className="tap-target" aria-label={accountLabel} style={css("cursor:pointer;display:flex;align-items:center;gap:6px;padding:0 4px;color:var(--ink);")}>
              <PersonIcon />
              {/* Visible, not just the aria-label — the mockup has no
                  account UI at all, but a logged-in customer's name has to
                  actually show, not just be announced to screen readers. */}
              {authReady && customer && <span style={css("font-size:14px;white-space:nowrap;")}>שלום, {firstName}</span>}
            </span>
          </div>
        </div>

        {/* ---- Mobile bar (<768px) ---- */}
        <div className="rd-header-mobile" style={css("height:64px;box-sizing:border-box;padding:0 8px;align-items:center;")}>
          <div style={css("display:flex;")}>
            <button
              className="tap-target"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="תפריט"
              aria-expanded={menuOpen}
              style={css(iconBtnMobile)}
            ><MenuIcon /></button>
            <button onClick={() => setSearchOpen(true)} aria-label="חיפוש" className="tap-target" style={css(iconBtnMobile)}><SearchIcon size={21} /></button>
          </div>
          <span {...asButton(() => navigate("home"))} className="serif" style={css("justify-self:center;cursor:pointer;font-size:26px;letter-spacing:.36em;padding-right:.36em;color:var(--ink);")}>ALFI</span>
          <div style={css("display:flex;justify-content:flex-end;")}>
            <span {...asButton(accountAction)} className="tap-target" aria-label={accountLabel} style={css(`position:relative;${iconBtnMobile}`)}>
              <PersonIcon size={21} />
              {authReady && customer && <span aria-hidden="true" style={css("position:absolute;top:11px;left:11px;width:8px;height:8px;border-radius:50%;background:var(--c-accent);box-shadow:0 0 0 2px var(--c-bg);")} />}
            </span>
            <span {...asButton(() => navigate("cart"))} className={`tap-target${cartBump ? " cart-bump" : ""}`} aria-label={`סל קניות, ${cartCount} פריטים`} style={css(`position:relative;${iconBtnMobile}`)}>
              <CartIcon />
              {cartCount > 0 && <span style={css(cartBadge)}>{cartCount}</span>}
            </span>
          </div>
        </div>

        {menuOpen && (
          <nav className="glass" style={css("border-top:1px solid rgba(255,255,255,.65);padding:6px 16px 16px;display:flex;flex-direction:column;")}>
            <button type="button" aria-expanded={mCatsOpen} onClick={() => setMCatsOpen((v) => !v)} style={css("padding:15px 2px;border:0;border-bottom:1px solid rgba(58,45,61,.12);background:none;font:inherit;text-align:right;cursor:pointer;color:var(--ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;justify-content:space-between;width:100%;")}>
              קטגוריות
              <span aria-hidden="true" style={css(`color:var(--c-accent);font-size:20px;line-height:1;transition:transform .2s;transform:rotate(${mCatsOpen ? 45 : 0}deg);`)}>+</span>
            </button>
            {mCatsOpen && (
              <div style={css("display:flex;flex-direction:column;padding:0 14px 0 0;border-bottom:1px solid rgba(58,45,61,.12);")}>
                {[...CATEGORY_LINKS, "הכל"].map((cat) => (
                  <a key={cat} href={pathFor("catalog", { catFilter: cat })} {...asButton(goCat(cat))} style={css("padding:12px 2px;cursor:pointer;color:var(--ink);font-size:15.5px;min-height:var(--tap);display:flex;align-items:center;")}>{cat === "הכל" ? "כל התכשיטים" : cat}</a>
                ))}
              </div>
            )}
            <a href={pathFor("sets")} {...asButton(goSets)} style={css("padding:15px 2px;border-bottom:1px solid rgba(58,45,61,.12);cursor:pointer;color:var(--ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;")}>סטים</a>
            <a href={pathFor("catalog", { catFilter: DEAL_FILTER })} {...asButton(goDeal)} style={css("padding:15px 2px;border-bottom:1px solid rgba(58,45,61,.12);cursor:pointer;color:var(--c-accent-dark);font-weight:600;font-size:16px;min-height:var(--tap);display:flex;align-items:center;justify-content:space-between;")}>מבצעים<span style={css("font-size:13px;font-weight:400;")}>{deal.size} ב־₪{deal.price}</span></a>
            <a href={pathFor("collections")} {...asButton(goCollections)} style={css("padding:15px 2px;border-bottom:1px solid rgba(58,45,61,.12);cursor:pointer;color:var(--ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;")}>קולקציות</a>
            <a href={pathFor("story")} {...asButton(goStory)} style={css("padding:15px 2px;border-bottom:1px solid rgba(58,45,61,.12);cursor:pointer;color:var(--ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;")}>הסיפור</a>
            <span {...asButton(() => navigate("favorites"))} className="tap-target" style={css("padding:15px 2px;border-bottom:1px solid rgba(58,45,61,.12);cursor:pointer;color:var(--ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;justify-content:space-between;")}>
              מועדפים
              {favoritesCount > 0 && <span style={css("font-size:13px;color:var(--text-muted);")}>{favoritesCount}</span>}
            </span>
            <a href={pathFor("contact")} {...asButton((e) => { e.preventDefault(); navigate("contact"); })} style={css("padding:15px 2px;border-bottom:1px solid rgba(58,45,61,.12);cursor:pointer;color:var(--ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;")}>צור קשר</a>

            {/* Account — its own block at the end of the menu. */}
            {authReady && (customer ? (
              <div style={css("margin-top:14px;padding:14px;border-radius:var(--r-md);background:rgba(255,255,255,.55);display:flex;flex-direction:column;gap:4px;")}>
                <div style={css("font-size:13px;color:var(--text-muted);")}>מחוברת בתור {customer.email}</div>
                <a href={pathFor("my-orders")} {...asButton((e) => { e.preventDefault(); navigate("my-orders"); })} style={css("cursor:pointer;color:var(--ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;")}>החשבון וההזמנות שלי</a>
                <button type="button" onClick={() => { setMenuOpen(false); customerLogout(); }} style={css("align-self:flex-start;background:none;border:0;padding:0;font:inherit;cursor:pointer;color:var(--c-accent-dark);font-size:15px;min-height:var(--tap);")}>התנתקות</button>
              </div>
            ) : (
              <button type="button" onClick={() => { setMenuOpen(false); openAuth(); }} className="btn btn-primary" style={css("margin-top:14px;min-height:48px;font-size:15px;width:100%;")}>כניסה / הרשמה</button>
            ))}
          </nav>
        )}
      </header>
      {/* Reserves the fixed mobile header's height (see redesign.css). */}
      <div className="rd-header-spacer" aria-hidden="true" />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
