import React, { useEffect, useRef, useState } from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";
import { SearchOverlay } from "./SearchOverlay.jsx";

// Design-handoff nav only lists the 4 categories (no "הכל"/collections item
// in the header itself) — see reference/desktop.html's <nav class="nav">.
const CATEGORY_LINKS = ["טבעות", "שרשראות", "עגילים", "צמידים"];

const iconBtnDesktop = "width:44px;height:44px;border:0;background:transparent;cursor:pointer;color:var(--ink);display:flex;align-items:center;justify-content:center;padding:0;flex:none;";
const iconBtnMobile = "width:48px;height:48px;border:0;background:transparent;cursor:pointer;color:var(--ink);display:flex;align-items:center;justify-content:center;padding:0;flex:none;";
const cartBadge = "position:absolute;top:-8px;left:-8px;min-width:16px;height:16px;border-radius:50%;background:var(--ink-fill);color:var(--cream);font-size:10px;line-height:16px;text-align:center;padding:0 3px;box-sizing:border-box;";

export function Header() {
  const { go, screen, catFilter, setCatFilter, cartCount, favoritesCount, customerName, openPhoneLogin, customerLogout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

  // Account/login isn't in the design mockup at all (this site has no
  // account UI concept there — see HANDOFF.md), but the existing phone-
  // login/greeting/logout behavior has to keep working exactly as before,
  // so it's folded in as one more icon button next to cart/favorites/
  // search rather than dropped.
  const accountLabel = customerName ? `שלום, ${customerName.split(" ")[0]} — ההזמנות שלי` : "כניסה / הרשמה";
  const accountAction = customerName ? () => navigate("my-orders") : openPhoneLogin;

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
      <header className="glass" style={css("position:sticky;top:0;z-index:40;box-sizing:border-box;border-width:0 0 1px 0;")}>
        {/* ---- Desktop bar (>=768px) ---- */}
        <div className="rd-header-desktop" style={css("height:92px;box-sizing:border-box;padding:0 64px;align-items:center;")}>
          <nav className="rd-nav" style={css("display:flex;gap:36px;font-size:15px;letter-spacing:.04em;")}>
            {CATEGORY_LINKS.map((cat) => (
              <a key={cat} {...asButton(() => goCat(cat))} aria-current={isCatActive(cat) ? "page" : undefined} style={css("cursor:pointer;")}>{cat}</a>
            ))}
            <a {...asButton(goCollections)} aria-current={isCollectionsActive ? "page" : undefined} style={css("cursor:pointer;")}>קולקציות</a>
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
              {customerName && <span style={css("font-size:14px;white-space:nowrap;")}>שלום, {customerName.split(" ")[0]}</span>}
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
            <span {...asButton(() => navigate("cart"))} className={`tap-target${cartBump ? " cart-bump" : ""}`} aria-label={`סל קניות, ${cartCount} פריטים`} style={css(`position:relative;${iconBtnMobile}`)}>
              <CartIcon />
              {cartCount > 0 && <span style={css(cartBadge)}>{cartCount}</span>}
            </span>
          </div>
        </div>

        {menuOpen && (
          <nav className="glass" style={css("border-top:1px solid rgba(255,255,255,.65);padding:6px 16px 16px;display:flex;flex-direction:column;")}>
            {CATEGORY_LINKS.map((cat) => (
              <a key={cat} {...asButton(() => goCat(cat))} style={css("padding:15px 2px;border-bottom:1px solid rgba(58,45,61,.12);cursor:pointer;color:var(--ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;")}>{cat}</a>
            ))}
            <a {...asButton(goCollections)} style={css("padding:15px 2px;border-bottom:1px solid rgba(58,45,61,.12);cursor:pointer;color:var(--ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;")}>קולקציות</a>
            <span {...asButton(() => navigate("favorites"))} className="tap-target" style={css("padding:15px 2px;border-bottom:1px solid rgba(58,45,61,.12);cursor:pointer;color:var(--ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;justify-content:space-between;")}>
              מועדפים
              {favoritesCount > 0 && <span style={css("font-size:13px;color:var(--text-muted);")}>{favoritesCount}</span>}
            </span>
            <span {...asButton(accountAction)} className="tap-target" style={css("padding:15px 2px;border-bottom:1px solid rgba(58,45,61,.12);cursor:pointer;color:var(--ink);font-size:16px;min-height:var(--tap);display:flex;align-items:center;")}>{accountLabel}</span>
            {customerName && (
              <span {...asButton(customerLogout)} className="tap-target" style={css("padding:15px 2px;cursor:pointer;color:var(--text-muted);font-size:14px;min-height:var(--tap);display:flex;align-items:center;")}>יציאה</span>
            )}
          </nav>
        )}
      </header>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
