import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import store, { CONFIG_DEFAULTS, BACKEND } from "../lib/store.js";
import { ADMIN_PATH } from "../lib/adminPath.js";
import { pathFor, parsePath } from "../lib/routes.js";
import { initNavMemory, rememberScroll, pushEntry, onPopEntry, restoreScroll } from "../lib/navMemory.js";

initNavMemory();

// The sign-up coupon is for new visitors only: never for someone signed in,
// who already placed an order on this device (it's a first-order offer),
// who has a coupon applied, is mid-payment, or already claimed it.
// Dismissing the pop-up is not remembered across page loads.
function signupCouponEligible(s) {
  if (s.content?.signupCouponEnabled === false) return false;
  if (s.user || s.couponCode) return false;
  if ((s.myOrders || []).length || s.lastOrder) return false;
  try {
    if (localStorage.getItem("alfi:signupCouponClaimed") === "1") return false;
    if (localStorage.getItem("alfi:pendingOrder")) return false;
  } catch { /* ignore */ }
  return true;
}

// Pages the pop-up never opens on by itself: around payment, the account,
// admin. (Checkout offers it on its own, see Checkout.jsx.)
const NO_SIGNUP_POPUP_SCREENS = new Set(["checkout", "confirm", "payment-failed", "status", "loading", "my-orders", "admin", "admin-login"]);

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

// Delivery method picked in the cart ("delivery" | "pickup"), remembered
// like the cart itself so checkout (and a reload) keep the choice.
const loadDeliveryMethod = () => {
  try { return localStorage.getItem("alfi:deliveryMethod") === "pickup" ? "pickup" : "delivery"; } catch { return "delivery"; }
};
const loadCart = () => {
  try { return JSON.parse(localStorage.getItem("alfi:cart") || "[]"); } catch { return []; }
};
const saveCart = (cart) => {
  try { localStorage.setItem("alfi:cart", JSON.stringify(cart)); } catch { /* ignore */ }
};

// "Liked" products. Kept locally for guests; for a signed-in customer they
// are also saved on the account (auth user metadata) and merged on sign-in,
// so they follow the customer to every device.
const loadFavorites = () => {
  try { return JSON.parse(localStorage.getItem("alfi:favorites") || "[]"); } catch { return []; }
};
const saveFavorites = (ids) => {
  try { localStorage.setItem("alfi:favorites", JSON.stringify(ids)); } catch { /* ignore */ }
};
// Admin editor fields from a stored product (see saveDraft for the reverse).
const draftPrices = (p) => {
  const onSale = Number(p.compare_at_price) > Number(p.price);
  return { regularPrice: onSale ? p.compare_at_price : p.price, salePrice: onSale ? p.price : "" };
};
// In-app navigation: remember where the page being left was scrolled to
// (so Back returns there — see navMemory.js), then open the new screen at
// the top.
const scrollTop = () => {
  if (typeof window === "undefined") return;
  rememberScroll();
  window.scrollTo(0, 0);
};

const isAdminPath = () => typeof window !== "undefined" && window.location.pathname === ADMIN_PATH;
const currentPath = () => {
  try { return decodeURIComponent(window.location.pathname); } catch { return window.location.pathname; }
};

// Returning from a Takbull redirect (?paid=) or an emailed tracking link
// (?order=) needs an async fetch before the real screen (confirm/status) is
// known — computed synchronously here (not in an effect) so the very first
// render goes straight to the "loading" screen instead of flashing home
// first, which looked like a bug rather than a normal page load.
const getPendingRedirectScreen = () => {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") || params.get("order") || params.get("canceled")) return "loading";
  } catch { /* ignore */ }
  return null;
};

const loadCoupon = () => {
  try {
    return {
      couponCode: localStorage.getItem("alfi:couponCode") || "",
      couponPercent: Number(localStorage.getItem("alfi:couponPercent")) || 0,
    };
  } catch {
    return { couponCode: "", couponPercent: 0 };
  }
};
const saveCoupon = (code, percent) => {
  try { localStorage.setItem("alfi:couponCode", code); localStorage.setItem("alfi:couponPercent", String(percent)); } catch { /* ignore */ }
};
const clearCouponStorage = () => {
  try { localStorage.removeItem("alfi:couponCode"); localStorage.removeItem("alfi:couponPercent"); } catch { /* ignore */ }
};
// Every order this browser has legitimately placed (or opened via its own
// tracking link) is remembered locally, so a guest can still find them in
// "החשבון שלי". Once the shopper signs in, these ids are linked to the
// account (store.account.claimOrders) and from then on the list comes from
// the server — the same on every device.
const loadMyOrders = () => {
  try { return JSON.parse(localStorage.getItem("alfi:myOrders") || "[]"); } catch { return []; }
};
const addMyOrder = (order) => {
  if (!order?.id) return;
  try {
    const list = loadMyOrders().filter((o) => o.id !== order.id);
    list.unshift({ id: order.id, number: order.number, created_at: order.created_at || new Date().toISOString() });
    localStorage.setItem("alfi:myOrders", JSON.stringify(list.slice(0, 50)));
  } catch { /* ignore */ }
};

export function StoreProvider({ children }) {
  const [state, setFull] = useState(() => {
    // Resolve the initial screen/catFilter/pid from the real URL, but only
    // when neither the secret admin path nor a Takbull payment-redirect
    // query param is in play — those two take precedence exactly as before
    // (see getPendingRedirectScreen/isAdminPath above).
    const pending = getPendingRedirectScreen();
    const routed = (typeof window !== "undefined" && !isAdminPath() && !pending)
      ? parsePath(window.location.pathname)
      : null;
    // Nothing server-managed is rendered from code: products, collections
    // and content start EMPTY (plus business-setting defaults only) and
    // `loaded` stays false until Supabase answers — screens show skeletons
    // meanwhile, so the shopper sees "loading → real content", never
    // "demo content → real content".
    return {
      loaded: false,
      loadError: false,
      screen: isAdminPath() ? "admin-login" : (pending || routed?.screen || "home"),
      pid: routed?.pid ?? null,
      orderId: routed?.orderId ?? null,
      qty: 1,
      size: "",
      products: [],
      content: { ...CONFIG_DEFAULTS },
      collections: [],
      // Signed-in account (customer or admin); authReady once the session
      // check finished, so account UI never flashes "logged out" first.
      user: null,
      authReady: false,
      authDialog: null, // null | "login" (the emailed-code sign-in dialog)
      accountOrders: null, // server order list for the signed-in customer
      accountOrdersError: false,
      users: [],
      cart: loadCart(),
      deliveryMethod: loadDeliveryMethod(),
      favorites: loadFavorites(),
      catFilter: routed?.catFilter || "הכל",
      adminForm: { email: "", password: "" },
      adminError: "",
      adminBusy: false,
      adminTab: "dashboard",
      draft: null,
      draftCol: null,
      cdraft: null,
      contentSaved: false,
      lastOrder: null,
      checkoutBusy: false,
      paymentError: "",
      testPaymentBusy: false,
      ...loadCoupon(),
      couponError: "",
      couponBusy: false,
      signupPopupOpen: false,
      signupPopupPendingCheckout: false,
      signupPopupPrefillPhone: "",
      myOrders: loadMyOrders(),
    };
  });

  // keep a live ref so multi-field handlers (placeOrder, cart math) read fresh state
  const ref = useRef(state);
  ref.current = state;

  const setState = useCallback((patch) => {
    setFull((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  /* ---------- initial load ---------- */
  // Site data (products/content/collections) is what the page renders, so it
  // is fetched on its own — never held up by the auth session check below.
  const loadSiteData = useCallback(async () => {
    try {
      const [products, content, collections] = await Promise.all([
        store.products.list(),
        store.content.get(),
        store.collections.list(),
      ]);
      setState((s) => ({
        loaded: true,
        loadError: false,
        products: products || [],
        content: { ...s.content, ...content },
        collections: collections || [],
      }));
    } catch (e) {
      console.warn("ALFI load failed", e);
      setState({ loaded: true, loadError: true });
    }
  }, [setState]);

  useEffect(() => { loadSiteData(); }, [loadSiteData]);

  /* ---------- customer account ---------- */
  // After any sign-in (or a restored session): link this browser's guest
  // orders to the account, load the account's orders, and merge favorites
  // saved here with the ones saved on the account.
  const syncAccount = useCallback(async (user) => {
    if (!user || user.role === "admin") return;
    try { await store.account.claimOrders(loadMyOrders().map((o) => o.id)); } catch (e) { console.warn("claim orders failed", e); }
    try {
      const orders = await store.account.orders();
      setState({ accountOrders: orders, accountOrdersError: false });
    } catch (e) {
      console.warn("account orders failed", e);
      setState({ accountOrders: null, accountOrdersError: true });
    }
    const local = loadFavorites();
    const remote = user.favorites || [];
    const merged = [...new Set([...remote, ...local].map(String))].map((id) => (/^\d+$/.test(id) ? Number(id) : id));
    saveFavorites(merged);
    setState({ favorites: merged });
    if (merged.length !== remote.length) store.auth.updateMeta({ favorites: merged }).catch(() => {});
  }, [setState]);

  const refreshAccountOrders = useCallback(async () => {
    if (!ref.current.user || ref.current.user.role === "admin") return;
    try { setState({ accountOrders: await store.account.orders(), accountOrdersError: false }); }
    catch { if (ref.current.accountOrders === null) setState({ accountOrdersError: true }); }
  }, [setState]);

  useEffect(() => {
    let alive = true;
    (async () => {
      let user = null;
      try { user = await store.auth.current(); } catch { /* signed out */ }
      if (!alive) return;
      setState({ user, authReady: true });
      if (user?.role === "admin") { if (isAdminPath()) goAdmin(); }
      else if (user) syncAccount(user);
    })();
    // Sign-in/out in another tab.
    const off = store.auth.onChange(async (event) => {
      if (event === "SIGNED_OUT") { setState({ user: null, accountOrders: null }); return; }
      if (event === "SIGNED_IN" && !ref.current.user) {
        const user = await store.auth.current().catch(() => null);
        if (user) { setState({ user }); if (user.role !== "admin") syncAccount(user); }
      }
    });
    return () => { alive = false; off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setState]);

  /* ---------- navigation ---------- */
  // Opening the catalog always states its filter: go("catalog") = all
  // jewellery, go("catalog", "טבעות" | DEAL_FILTER …) = that view. A filter
  // left over from an earlier visit (e.g. the deal page) never leaks into
  // later "all jewellery" buttons.
  // Every in-app navigation pushes its history entry right here, BEFORE the
  // new screen renders (see navMemory.js — a screen reads its entry's saved
  // UI state while mounting).
  const pushFor = useCallback((patch, opts) => {
    if (typeof window === "undefined" || isAdminPath()) return;
    const s = { ...ref.current, ...patch };
    const path = pathFor(s.screen, { catFilter: s.catFilter, pid: s.pid, orderId: s.orderId, products: s.products });
    if (path && path !== currentPath()) pushEntry(path, opts);
  }, []);

  const go = useCallback((screen, catFilter, extra) => {
    const patch = { ...(screen === "catalog" ? { screen, catFilter: catFilter || "הכל" } : { screen }), ...extra, contentSaved: false };
    scrollTop();
    pushFor(patch);
    setState(patch);
  }, [setState, pushFor]);

  // Returning from Takbull: ?paid=<orderId> is used for both success and
  // failure (the actual result is only known from &statusCode=0/nonzero),
  // or ?canceled=1 if the customer backed out without attempting payment.
  // ?order=<orderId> is the permanent link emailed to the customer so they
  // can check their order's status any time, from any device.
  useEffect(() => {
    if (typeof window === "undefined" || isAdminPath()) return;
    const params = new URLSearchParams(window.location.search);
    const paidId = params.get("paid");
    const viewId = params.get("order");
    const statusCode = params.get("statusCode");
    const statusDescription = params.get("statusDescription");
    const failed = params.get("canceled") || (paidId && statusCode != null && statusCode !== "0");

    if (failed) {
      setState({ paymentError: statusDescription || "" });
      go("payment-failed");
      try { localStorage.removeItem("alfi:pendingOrder"); } catch { /* ignore */ }
      window.history.replaceState(window.history.state, "", window.location.pathname);
    } else if (paidId) {
      window.history.replaceState(window.history.state, "", window.location.pathname);
      (async () => {
        // Fetch the real order rather than trusting only the localStorage
        // snapshot — that snapshot can be missing (different browser/device,
        // cleared storage) even though the payment genuinely succeeded.
        let order = null;
        try { order = await store.orders.getPublic(paidId); } catch { /* fall back below */ }
        if (!order) {
          try { order = JSON.parse(localStorage.getItem("alfi:pendingOrder") || "null"); } catch { /* ignore */ }
        }
        try { localStorage.removeItem("alfi:pendingOrder"); } catch { /* ignore */ }
        if (order && String(order.id) === String(paidId)) {
          clearCouponStorage();
          addMyOrder(order);
          setState({ lastOrder: order, cart: [], couponCode: "", couponPercent: 0, myOrders: loadMyOrders() });
          saveCart([]);
          go("confirm");
        }
      })();
    } else if (viewId) {
      window.history.replaceState(window.history.state, "", window.location.pathname);
      (async () => {
        try {
          const order = await store.orders.getPublic(viewId);
          addMyOrder(order);
          setState({ myOrders: loadMyOrders() });
          go("status", undefined, { lastOrder: order, orderId: order.id });
        } catch {
          alert("ההזמנה לא נמצאה");
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openProduct = useCallback((id) => {
    const p = ref.current.products.find((x) => String(x.id) === String(id));
    const patch = { screen: "product", pid: id, qty: 1, size: (p && p.sizes && p.sizes[0]) || "" };
    scrollTop();
    pushFor(patch);
    setState(patch);
  }, [setState, pushFor]);

  // A product set's own page (/סט/<name>) — the set's name rides in pid.
  const openSet = useCallback((name) => {
    const patch = { screen: "set", pid: name };
    scrollTop();
    pushFor(patch);
    setState(patch);
  }, [setState, pushFor]);

  // ---------- URL normalisation ----------
  // Pushing happens in go/openProduct/setCatFilter above. This only corrects
  // the CURRENT entry in place (replaceState, never a new entry) — e.g. a
  // direct visit to /מוצר/12 gains its name slug once products load. It
  // compares DECODED paths: location.pathname is percent-encoded, so the old
  // raw comparison never matched a Hebrew path and pushed a duplicate entry
  // after every change — including right after Back, which trapped Back on
  // the same page.
  useEffect(() => {
    if (typeof window === "undefined" || isAdminPath()) return;
    const path = pathFor(state.screen, { catFilter: state.catFilter, pid: state.pid, orderId: state.orderId, products: state.products });
    if (path && path !== currentPath()) {
      window.history.replaceState(window.history.state, "", path);
    }
  }, [state.screen, state.catFilter, state.pid, state.orderId, state.products]);

  // Browser back/forward (incl. Android back and the iOS edge swipe):
  // re-derive the screen from the URL, then return to the scroll offset
  // that entry was left at.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onPopState = () => {
      if (isAdminPath()) return;
      const y = onPopEntry();
      const parsed = parsePath(window.location.pathname);
      if (parsed) {
        setState((s) => {
          const next = { ...parsed, contentSaved: false };
          if (parsed.screen === "product" && String(parsed.pid) !== String(s.pid)) {
            const p = s.products.find((x) => String(x.id) === String(parsed.pid));
            Object.assign(next, { qty: 1, size: (p && p.sizes && p.sizes[0]) || "" });
          }
          if (parsed.screen === "status" && s.lastOrder?.id !== parsed.orderId) next.lastOrder = null;
          return next;
        });
      }
      restoreScroll(y);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [setState]);

  const goAdmin = useCallback(async () => {
    try {
      // Orders are no longer bulk-fetched here — the Orders tab paginates
      // its own data directly from store.js (see src/screens/admin/OrdersTab.jsx).
      const [users, products, content, collections] = await Promise.all([
        store.users.list(), store.products.list(), store.content.get(), store.collections.list(),
      ]);
      setState((s) => ({
        users,
        products: products && products.length ? products : s.products,
        collections: collections && collections.length ? collections : s.collections,
        content: { ...s.content, ...content },
        adminTab: "dashboard",
        cdraft: { ...s.content, ...content },
      }));
    } catch { /* ignore */ }
    go("admin");
  }, [setState, go]);

  /* ---------- signup pop-up + coupon ---------- */
  // When the pop-up may open by itself: never before the session check
  // finished, never over the sign-in dialog, and not on the pages around
  // payment and the account (NO_SIGNUP_POPUP_SCREENS). The checkout page
  // offers it itself (atCheckout), once, while the details are filled in.
  // Who may get it at all: signupCouponEligible (module level).
  const shouldOfferSignupPopup = useCallback((atCheckout = false) => {
    const s = ref.current;
    if (typeof window === "undefined" || isAdminPath()) return false;
    if (!s.authReady || s.authDialog || s.signupPopupOpen) return false;
    if (!atCheckout && NO_SIGNUP_POPUP_SCREENS.has(s.screen)) return false;
    return signupCouponEligible(s);
  }, []);

  // Explicit "הרשמה" clicks: open unless the visitor is signed in.
  const openSignupPopup = useCallback((pendingCheckout = false, prefillPhone = "") => {
    if (ref.current.user) return;
    setState({ signupPopupOpen: true, authDialog: null, signupPopupPendingCheckout: pendingCheckout, signupPopupPrefillPhone: prefillPhone });
  }, [setState]);

  // The 10s-browsing timer and the checkout page's own trigger both funnel
  // through here.
  const maybeOfferSignupPopup = useCallback((pendingCheckout = false) => {
    if (shouldOfferSignupPopup(pendingCheckout)) openSignupPopup(pendingCheckout);
  }, [shouldOfferSignupPopup, openSignupPopup]);

  const closeSignupPopup = useCallback(() => {
    setState({ signupPopupOpen: false, signupPopupPendingCheckout: false, signupPopupPrefillPhone: "" });
  }, [setState]);

  /* ---------- customer account (Supabase Auth, emailed one-time code) -----
     One account = the same orders and favorites on every device. The dialog
     (AuthDialog.jsx) is opened from the header / account page; these
     actions do the real work and throw Hebrew messages the dialog shows. */
  // Only one of the two pop-ups is ever open: opening sign-in closes the
  // coupon pop-up, and each links to the other.
  const openAuth = useCallback(() => setState({ authDialog: "login", signupPopupOpen: false }), [setState]);
  const closeAuth = useCallback(() => setState({ authDialog: null }), [setState]);
  const switchToSignIn = useCallback(() => setState({ signupPopupOpen: false, signupPopupPendingCheckout: false, authDialog: "login" }), [setState]);
  const switchToSignup = useCallback(() => setState({ authDialog: null, signupPopupOpen: true, signupPopupPendingCheckout: false }), [setState]);

  const afterSignIn = useCallback(async (user) => {
    setState({ user, authDialog: null, signupPopupOpen: false });
    if (!user) return;
    if (user.role === "admin") {
      // The store's own email: straight to the admin panel, at its URL so a
      // reload stays there.
      if (!isAdminPath()) window.history.pushState({}, "", ADMIN_PATH);
      await goAdmin();
      return;
    }
    await syncAccount(user);
  }, [setState, syncAccount, goAdmin]);

  // Email + mobile → a 6-digit code by email → signed in (the first sign-in
  // creates the account; the admin email opens the admin panel). The admin
  // page's own password sign-in (submitAdminLogin) still works too.
  const requestLoginCode = useCallback(async ({ email, phone }) => {
    await store.auth.requestLoginCode({ email, phone });
    try { localStorage.setItem("alfi:lastContact", JSON.stringify({ email: String(email || "").trim(), phone })); } catch { /* ignore */ }
  }, []);

  const verifyLoginCode = useCallback(async ({ email, code }) => {
    const user = await store.auth.verifyLoginCode({ email, code });
    await afterSignIn(user);
    return user;
  }, [afterSignIn]);

  // Ends the session on this device. Favorites and the guest order list
  // kept in this browser are cleared too — they're safe on the account, and
  // the next person using a shared device shouldn't see them.
  const customerLogout = useCallback(async () => {
    try { await store.auth.logout(); } catch { /* ignore */ }
    saveFavorites([]);
    try { localStorage.removeItem("alfi:myOrders"); } catch { /* ignore */ }
    setState({ user: null, accountOrders: null, favorites: [], myOrders: [] });
    go("home");
  }, [setState, go]);

  const goCheckout = useCallback(() => go("checkout"), [go]);

  // Offer the pop-up after content.signupPopupDelaySeconds of browsing, once
  // per the dismissal-cooldown/claimed rules above. The other trigger point
  // (landing on the checkout/order-details page) is in Checkout.jsx itself.
  useEffect(() => {
    if (typeof window === "undefined" || isAdminPath()) return undefined;
    const delay = Number(ref.current.content?.signupPopupDelaySeconds || 10) * 1000;
    const t = setTimeout(maybeOfferSignupPopup, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitSignup = useCallback(async ({ name, email, phone }) => {
    const { code, percent } = await store.signup.subscribe({ name, email, phone });
    // Pre-fills the sign-in form later (same email + mobile).
    try { localStorage.setItem("alfi:lastContact", JSON.stringify({ email: String(email || "").trim(), phone })); } catch { /* ignore */ }
    saveCoupon(code, percent);
    try { localStorage.setItem("alfi:signupCouponClaimed", "1"); } catch { /* ignore */ }
    setState({ couponCode: code, couponPercent: percent, couponError: "" });
    return { code, percent };
  }, [setState]);

  /* ---------- order history ---------- */
  // Opens the order's own page (/הזמנה/<id>) right away; Status.jsx fetches
  // the live order and shows its loading state meanwhile.
  const viewOrder = useCallback((id) => {
    go("status", undefined, { orderId: id, lastOrder: null });
  }, [go]);

  const applyCoupon = useCallback(async (code) => {
    setState({ couponBusy: true, couponError: "" });
    try {
      const { valid, percent } = await store.coupon.validate(code);
      if (!valid) throw new Error("קוד לא תקין");
      const upper = String(code).trim().toUpperCase();
      saveCoupon(upper, percent);
      setState({ couponCode: upper, couponPercent: percent, couponBusy: false });
      return true;
    } catch (e) {
      setState({ couponError: e.message || "קוד לא תקין", couponBusy: false });
      return false;
    }
  }, [setState]);

  const removeCoupon = useCallback(() => {
    clearCouponStorage();
    setState({ couponCode: "", couponPercent: 0, couponError: "" });
  }, [setState]);

  /* ---------- cart ---------- */
  const addToCart = useCallback((id, q, size) => {
    setState((s) => {
      const cart = s.cart.slice();
      const ex = cart.find((c) => c.id === id && c.size === size);
      if (ex) ex.qty += q; else cart.push({ id, qty: q, size });
      saveCart(cart);
      return { cart };
    });
  }, [setState]);

  const changeQty = useCallback((id, size, d) => {
    setState((s) => {
      const cart = s.cart.map((c) => (c.id === id && c.size === size ? { ...c, qty: c.qty + d } : c)).filter((c) => c.qty > 0);
      saveCart(cart);
      return { cart };
    });
  }, [setState]);

  const removeItem = useCallback((id, size) => {
    setState((s) => {
      const cart = s.cart.filter((c) => !(c.id === id && c.size === size));
      saveCart(cart);
      return { cart };
    });
  }, [setState]);

  /* ---------- favorites (local only, no accounts — see loadFavorites) ---------- */
  const toggleFavorite = useCallback((id) => {
    const cur = ref.current.favorites;
    const favorites = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    saveFavorites(favorites);
    setState({ favorites });
    // Signed in: the account copy is what other devices see.
    const u = ref.current.user;
    if (u && u.role !== "admin") store.auth.updateMeta({ favorites }).catch((e) => console.warn("favorites sync failed", e));
  }, [setState]);

  /* ---------- admin login (hidden route only) ---------- */
  const setAdminField = useCallback((k, v) => setState((s) => ({ adminForm: { ...s.adminForm, [k]: v }, adminError: "" })), [setState]);

  const submitAdminLogin = useCallback(async () => {
    if (ref.current.adminBusy) return;
    const { email, password } = ref.current.adminForm;
    setState({ adminBusy: true, adminError: "" });
    try {
      const user = await store.auth.login({ email, password });
      if (!user || user.role !== "admin") {
        await store.auth.logout().catch(() => {});
        throw new Error("פרטי התחברות שגויים");
      }
      setState({ user, adminBusy: false, adminForm: { email: "", password: "" } });
      await goAdmin();
    } catch (e) {
      setState({ adminBusy: false, adminError: e.message || "פרטי התחברות שגויים" });
    }
  }, [setState, goAdmin]);

  const logout = useCallback(async () => {
    try { await store.auth.logout(); } catch { /* ignore */ }
    setState({ user: null });
    go("home");
  }, [setState, go]);

  /* ---------- product page ---------- */
  const setQty = useCallback((qty) => setState({ qty: Math.max(1, qty) }), [setState]);
  const setSize = useCallback((size) => setState({ size }), [setState]);
  // A category switch inside the catalog is its own history entry (Back
  // returns to the previous category) and keeps the sort/material filters.
  const setCatFilter = useCallback((catFilter) => {
    pushFor({ catFilter }, { carryUi: true });
    setState({ catFilter });
  }, [setState, pushFor]);

  const addCurrent = useCallback(() => {
    const s = ref.current;
    const p = s.products.find((x) => String(x.id) === String(s.pid));
    addToCart(s.pid, s.qty, s.size || (p && p.sizes && p.sizes[0]) || "יחיד");
    go("cart");
  }, [addToCart, go]);

  /* ---------- admin: products ---------- */
  const refreshProducts = useCallback(async () => { setState({ products: await store.products.list() }); }, [setState]);
  const setTab = useCallback((t) => {
    setState((s) => (t === "content" ? { adminTab: t, contentSaved: false, cdraft: { ...s.content } } : { adminTab: t, contentSaved: false }));
    if (t === "users") {
      store.users.list().then((users) => setState({ users })).catch(() => {});
    }
  }, [setState]);
  const newProduct = useCallback(() => setState({ draft: { _new: true, name: "", category: "טבעות", regularPrice: "", salePrice: "", stock: 1, material: "כסף 925", description: "", details: "", images: [], featured: false, in_bundle: false, set_name: "", sizesText: "S, M, L" } }), [setState]);
  const editProduct = useCallback((p) => setState({ draft: { ...p, ...draftPrices(p), images: p.images && p.images.length ? p.images : (p.image ? [p.image] : []), sizesText: (p.sizes || []).join(", ") } }), [setState]);
  const setDraft = useCallback((k, v) => setState((s) => ({ draft: { ...s.draft, [k]: v } })), [setState]);
  const cancelDraft = useCallback(() => setState({ draft: null }), [setState]);
  const saveDraft = useCallback(async () => {
    const d = { ...ref.current.draft };
    const images = (d.images || []).slice(0, 5);
    // Admin enters a regular price + optional sale price; stored as
    // price (what's charged) + compare_at_price (regular, only when on sale).
    const regular = Number(d.regularPrice) || 0;
    const sale = Number(d.salePrice) || 0;
    const onSale = sale > 0 && sale < regular;
    const payload = {
      name: d.name, category: d.category, price: onSale ? sale : regular, compare_at_price: onSale ? regular : null, stock: Math.max(0, Number(d.stock) || 0), material: d.material,
      description: d.description, details: (d.details || "").trim(), image: images[0] || "", images, featured: !!d.featured, in_bundle: !!d.in_bundle, set_name: String(d.set_name || "").trim() || null,
      sizes: (d.sizesText || "").split(",").map((x) => x.trim()).filter(Boolean),
    };
    if (!payload.sizes.length) payload.sizes = ["יחיד"];
    try {
      if (d._new) await store.products.create(payload);
      else await store.products.update(d.id, payload);
      await refreshProducts();
      setState({ draft: null });
    } catch (e) { alert("שמירה נכשלה: " + e.message); }
  }, [refreshProducts, setState]);
  const deleteProduct = useCallback(async (id) => {
    if (!confirm("למחוק את המוצר?")) return;
    try { await store.products.remove(id); await refreshProducts(); } catch { alert("מחיקה נכשלה"); }
  }, [refreshProducts]);

  /* ---------- admin: collections ---------- */
  const refreshCollections = useCallback(async () => { setState({ collections: await store.collections.list() }); }, [setState]);
  const newCollection = useCallback(() => setState({ draftCol: { _new: true, title: "", subtitle: "", image: "", description: "" } }), [setState]);
  const editCollection = useCallback((c) => setState({ draftCol: { ...c } }), [setState]);
  const setDraftCol = useCallback((k, v) => setState((s) => ({ draftCol: { ...s.draftCol, [k]: v } })), [setState]);
  const cancelCol = useCallback(() => setState({ draftCol: null }), [setState]);
  const saveCol = useCallback(async () => {
    const d = { ...ref.current.draftCol };
    const payload = { title: d.title, subtitle: d.subtitle, image: d.image, description: d.description, category_filter: d.category_filter || null };
    try {
      if (d._new) await store.collections.create(payload);
      else await store.collections.update(d.id, payload);
      await refreshCollections();
      setState({ draftCol: null });
    } catch (e) { alert("שמירה נכשלה: " + e.message); }
  }, [refreshCollections, setState]);
  const deleteCollection = useCallback(async (id) => {
    if (!confirm("למחוק את הקולקציה?")) return;
    try { await store.collections.remove(id); await refreshCollections(); } catch { alert("מחיקה נכשלה"); }
  }, [refreshCollections]);

  /* ---------- admin: content ---------- */
  const setCdraft = useCallback((k, v) => setState((s) => ({ cdraft: { ...s.cdraft, [k]: v }, contentSaved: false })), [setState]);
  // Save just some content keys (e.g. setPrices from the admin Sets tab)
  // without going through the full content-tab draft.
  const saveContentPatch = useCallback(async (patch) => {
    const content = await store.content.update(patch);
    setState((s) => ({ content: { ...s.content, ...content } }));
  }, [setState]);
  const saveContent = useCallback(async () => {
    try {
      const content = await store.content.update(ref.current.cdraft);
      setState((s) => ({ content: { ...s.content, ...content }, contentSaved: true }));
    } catch { alert("שמירה נכשלה"); }
  }, [setState]);

  /* ---------- admin: orders ---------- */
  // Goes through the update-order-status Edge Function (not a direct table
  // write) so every change lands in the status history. It never emails the
  // customer — that's a separate, explicit admin action (Orders tab →
  // "שליחת מייל ללקוח", store.orders.sendEmail).
  const setOrderStatus = useCallback(async (id, status) => {
    try {
      return await store.orders.updateStatus(id, status);
    } catch (e) { alert("עדכון הסטטוס נכשל: " + e.message); return null; }
  }, []);

  /* ---------- image upload (admin only) ---------- */
  const uploadImage = useCallback((file) => store.storage.uploadImage(file), []);

  /* ---------- checkout ---------- */
  // Prices are never trusted from the client: only id/qty/size go to the
  // server, which looks up real prices and creates the order there. For the
  // Supabase backend this opens a Takbull payment page (card data never
  // touches this app); the local dev backend places the order directly.
  const setDeliveryMethod = useCallback((m) => {
    const v = m === "pickup" ? "pickup" : "delivery";
    try { localStorage.setItem("alfi:deliveryMethod", v); } catch { /* ignore */ }
    setState({ deliveryMethod: v });
  }, [setState]);

  const startCheckout = useCallback(async (addr) => {
    if (ref.current.checkoutBusy) return;
    setState({ checkoutBusy: true });
    const s = ref.current;
    const items = s.cart.map((c) => ({ id: c.id, qty: c.qty, size: c.size }));
    const deliveryMethod = s.deliveryMethod === "pickup" ? "pickup" : "delivery";
    try {
      const { url, order } = await store.checkout.createSession({ items, shipping_address: addr, deliveryMethod, couponCode: s.couponCode || undefined });
      addMyOrder(order);
      // Signed in: attach the new order to the account before leaving for
      // the payment page, so it shows up on every device.
      if (s.user && s.user.role !== "admin") {
        try { await store.account.claimOrders([order.id]); } catch (e) { console.warn("claim order failed", e); }
      }
      if (url) {
        try { localStorage.setItem("alfi:pendingOrder", JSON.stringify(order)); } catch { /* ignore */ }
        window.location.href = url;
      } else {
        clearCouponStorage();
        setState({ lastOrder: order, cart: [], checkoutBusy: false, couponCode: "", couponPercent: 0, myOrders: loadMyOrders() });
        saveCart([]);
        go("confirm");
      }
    } catch (e) {
      setState({ checkoutBusy: false });
      alert("יצירת ההזמנה נכשלה: " + e.message);
    }
  }, [setState, go]);

  /* ---------- order confirmation: fetch the real, live order state ---------- */
  const refreshOrder = useCallback(async (id) => {
    const order = await store.orders.getPublic(id);
    setState((s) => ({ lastOrder: String(s.lastOrder?.id) === String(order.id) ? { ...s.lastOrder, ...order } : order }));
    return order;
  }, [setState]);

  /* ---------- admin: test payment (arbitrary amount, real gateway) ---------- */
  const createTestPayment = useCallback(async (amount) => {
    if (ref.current.testPaymentBusy) return;
    setState({ testPaymentBusy: true });
    try {
      const { url } = await store.checkout.createSession({
        items: [], shipping_address: { email: ref.current.user?.email || "" }, testAmount: amount,
      });
      if (url) window.open(url, "_blank");
    } catch (e) {
      alert("יצירת תשלום בדיקה נכשלה: " + e.message);
    } finally {
      setState({ testPaymentBusy: false });
    }
  }, [setState]);

  const value = {
    ...state,
    BACKEND,
    isAdmin: !!(state.user && state.user.role === "admin"),
    // The signed-in shopper (never the admin session).
    customer: state.user && state.user.role !== "admin" ? state.user : null,
    signupCouponAvailable: signupCouponEligible(state),
    cartCount: state.cart.reduce((a, c) => a + c.qty, 0),
    favoritesCount: state.favorites.length,
    // actions
    go, openProduct, openSet, goAdmin, goCheckout,
    addToCart, changeQty, removeItem, addCurrent, toggleFavorite, setDeliveryMethod,
    setAdminField, submitAdminLogin, logout,
    setQty, setSize, setCatFilter,
    setTab, newProduct, editProduct, setDraft, cancelDraft, saveDraft, deleteProduct, refreshProducts,
    newCollection, editCollection, setDraftCol, cancelCol, saveCol, deleteCollection,
    setCdraft, saveContent, saveContentPatch, setOrderStatus, uploadImage, startCheckout, createTestPayment, refreshOrder,
    openSignupPopup, closeSignupPopup, maybeOfferSignupPopup, submitSignup, applyCoupon, removeCoupon, viewOrder, customerLogout,
    openAuth, closeAuth, switchToSignIn, switchToSignup, requestLoginCode, verifyLoginCode, refreshAccountOrders, loadSiteData,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
