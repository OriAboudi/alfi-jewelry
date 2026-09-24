import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import store, { SEED_PRODUCTS, SEED_CONTENT, SEED_COLLECTIONS, BACKEND } from "../lib/store.js";
import { ADMIN_PATH } from "../lib/adminPath.js";
import { pathFor, parsePath } from "../lib/routes.js";

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const loadCart = () => {
  try { return JSON.parse(localStorage.getItem("alfi:cart") || "[]"); } catch { return []; }
};
const saveCart = (cart) => {
  try { localStorage.setItem("alfi:cart", JSON.stringify(cart)); } catch { /* ignore */ }
};

// "Liked" products — local only, same guest-only model as the cart (no
// accounts/backend field for this; see customerLogout's own note on why).
const loadFavorites = () => {
  try { return JSON.parse(localStorage.getItem("alfi:favorites") || "[]"); } catch { return []; }
};
const saveFavorites = (ids) => {
  try { localStorage.setItem("alfi:favorites", JSON.stringify(ids)); } catch { /* ignore */ }
};
const scrollTop = () => { if (typeof window !== "undefined") window.scrollTo(0, 0); };

const isAdminPath = () => typeof window !== "undefined" && window.location.pathname === ADMIN_PATH;

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
const loadCustomer = () => {
  try {
    return {
      customerName: localStorage.getItem("alfi:customerName") || "",
      customerEmail: localStorage.getItem("alfi:customerEmail") || "",
    };
  } catch {
    return { customerName: "", customerEmail: "" };
  }
};
const saveCustomer = (name, email) => {
  try {
    if (name) localStorage.setItem("alfi:customerName", name);
    if (email) localStorage.setItem("alfi:customerEmail", email);
  } catch { /* ignore */ }
};

// Every order this browser has legitimately placed (or opened via its own
// tracking link) is remembered locally so "ההזמנות שלי" can list them — no
// new server capability is added for this: it's the same trust model the
// existing single-order "?order=<uuid>" tracking link already relies on
// (this app deliberately has no customer accounts/login), just remembered
// across visits instead of requiring the emailed link each time.
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
    return {
      loaded: false,
      screen: isAdminPath() ? "admin-login" : (pending || routed?.screen || "home"),
      pid: routed?.pid ?? SEED_PRODUCTS[0].id,
      qty: 1,
      size: "",
      products: SEED_PRODUCTS,
      content: SEED_CONTENT,
      collections: SEED_COLLECTIONS,
      user: null,
      users: [],
      cart: loadCart(),
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
      phoneLoginOpen: false,
      phoneLoginBusy: false,
      phoneLoginError: "",
      ...loadCustomer(),
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
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [products, content, user, collections] = await Promise.all([
          store.products.list(),
          store.content.get(),
          store.auth.current(),
          store.collections.list(),
        ]);
        if (!alive) return;
        const admin = user && user.role === "admin" ? user : null;
        // Anyone signed in but not an admin (shouldn't normally happen, since
        // the site never offers customer signup) is dropped silently.
        if (user && !admin) store.auth.logout().catch(() => {});
        setState((s) => ({
          loaded: true,
          products: products && products.length ? products : s.products,
          content: { ...s.content, ...content },
          collections: collections && collections.length ? collections : s.collections,
          user: admin,
        }));
        if (isAdminPath() && admin) goAdmin();
      } catch (e) {
        console.warn("ALFI load failed", e);
        if (alive) setState({ loaded: true });
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setState]);

  /* ---------- navigation ---------- */
  const go = useCallback((screen) => { setState({ screen, contentSaved: false }); scrollTop(); }, [setState]);

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
      window.history.replaceState({}, "", window.location.pathname);
    } else if (paidId) {
      window.history.replaceState({}, "", window.location.pathname);
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
      window.history.replaceState({}, "", window.location.pathname);
      (async () => {
        try {
          const order = await store.orders.getPublic(viewId);
          addMyOrder(order);
          setState({ lastOrder: order, myOrders: loadMyOrders() });
          go("status");
        } catch {
          alert("ההזמנה לא נמצאה");
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openProduct = useCallback((id) => {
    const p = ref.current.products.find((x) => String(x.id) === String(id));
    setState({ screen: "product", pid: id, qty: 1, size: (p && p.sizes && p.sizes[0]) || "" });
    scrollTop();
  }, [setState]);

  // ---------- URL sync (real routing) ----------
  // Keeps the address bar in step with {screen, catFilter, pid} for every
  // content screen (see routes.js's pathFor — it returns null for cart/
  // checkout/confirm/etc., which this effect then simply leaves alone, so it
  // can never fight the Takbull payment-redirect flow above). Only pushes
  // when the derived path actually differs from the current one, which is
  // also what stops this from re-pushing right after a popstate-driven
  // update below (that update already leaves location.pathname matching).
  useEffect(() => {
    if (typeof window === "undefined" || isAdminPath()) return;
    const path = pathFor(state.screen, { catFilter: state.catFilter, pid: state.pid, products: state.products });
    if (path && path !== window.location.pathname) {
      window.history.pushState({}, "", path);
    }
  }, [state.screen, state.catFilter, state.pid, state.products]);

  // Browser back/forward: re-derive {screen, catFilter, pid} from whatever
  // URL the user landed back on.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onPopState = () => {
      if (isAdminPath()) return;
      const parsed = parsePath(window.location.pathname);
      if (parsed) setState((s) => ({ ...s, ...parsed, contentSaved: false }));
      scrollTop();
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
  // Dismissing the pop-up is never remembered across page loads (no
  // localStorage write for it) — only actually claiming a coupon suppresses
  // it, so it keeps offering the coupon on every fresh visit/navigation
  // until the visitor signs up.
  const shouldOfferSignupPopup = useCallback(() => {
    if (ref.current.content?.signupCouponEnabled === false) return false;
    try {
      if (localStorage.getItem("alfi:signupCouponClaimed") === "1") return false;
    } catch { /* ignore */ }
    return true;
  }, []);

  const openSignupPopup = useCallback((pendingCheckout = false, prefillPhone = "") => {
    setState({ signupPopupOpen: true, signupPopupPendingCheckout: pendingCheckout, signupPopupPrefillPhone: prefillPhone });
  }, [setState]);

  // Only opens if eligible (not already claimed/dismissed-recently/disabled)
  // and nothing else has it open — used by the 10s-browsing timer and by
  // the checkout page's own mount trigger, so both funnel through one place.
  const maybeOfferSignupPopup = useCallback((pendingCheckout = false) => {
    if (!ref.current.signupPopupOpen && shouldOfferSignupPopup()) openSignupPopup(pendingCheckout);
  }, [shouldOfferSignupPopup, openSignupPopup]);

  const closeSignupPopup = useCallback(() => {
    setState({ signupPopupOpen: false, signupPopupPendingCheckout: false, signupPopupPrefillPhone: "" });
  }, [setState]);

  /* ---------- phone "login" (no accounts/passwords — see customerLogout) ----------
     The header's user icon, when nobody's identified yet, offers phone-number
     entry instead of a text "הרשמה" button. If that phone already has a
     coupons-table row (i.e. signed up before, on any device), we just load
     their name/email/coupon back — otherwise we hand off to the exact same
     sign-up popup/component the footer's button uses, prefilled with the
     phone already typed, so there's only ever one registration flow. */
  const openPhoneLogin = useCallback(() => {
    setState({ phoneLoginOpen: true, phoneLoginError: "" });
  }, [setState]);

  const closePhoneLogin = useCallback(() => {
    setState({ phoneLoginOpen: false, phoneLoginError: "" });
  }, [setState]);

  const loginByPhone = useCallback(async (phone) => {
    setState({ phoneLoginBusy: true, phoneLoginError: "" });
    try {
      const result = await store.signup.loginByPhone(phone);
      if (result.found) {
        // Phone login is unverified, so the server only returns a first name
        // (never the email), and never a coupon — the sign-up coupon is a
        // one-time offer shown only at registration. See login-by-phone.
        saveCustomer(result.name);
        setState({
          customerName: result.name,
          phoneLoginOpen: false,
          phoneLoginBusy: false,
        });
      } else {
        setState({ phoneLoginOpen: false, phoneLoginBusy: false });
        openSignupPopup(false, phone);
      }
      return result;
    } catch (e) {
      setState({ phoneLoginBusy: false, phoneLoginError: e.message || "ההתחברות נכשלה" });
      throw e;
    }
  }, [setState, openSignupPopup]);

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
    saveCoupon(code, percent);
    saveCustomer(name, email);
    try { localStorage.setItem("alfi:signupCouponClaimed", "1"); } catch { /* ignore */ }
    setState({ couponCode: code, couponPercent: percent, couponError: "", customerName: name, customerEmail: email });
    return { code, percent };
  }, [setState]);

  // Clears only the locally-remembered display name/email (the "שלום, X"
  // greeting) — there's no real account/session to end, since this site is
  // guest-checkout-only. The coupon already claimed and the local order
  // history stay put; this just lets someone stop being greeted by name on
  // a shared/public device.
  const customerLogout = useCallback(() => {
    try { localStorage.removeItem("alfi:customerName"); localStorage.removeItem("alfi:customerEmail"); } catch { /* ignore */ }
    setState({ customerName: "", customerEmail: "" });
  }, [setState]);

  /* ---------- order history (local, no accounts — see loadMyOrders above) ---------- */
  const viewOrder = useCallback(async (id) => {
    try {
      const order = await store.orders.getPublic(id);
      setState({ lastOrder: order });
      go("status");
    } catch {
      alert("ההזמנה לא נמצאה");
    }
  }, [setState, go]);

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
    setState((s) => {
      const has = s.favorites.includes(id);
      const favorites = has ? s.favorites.filter((x) => x !== id) : [...s.favorites, id];
      saveFavorites(favorites);
      return { favorites };
    });
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
  const setCatFilter = useCallback((catFilter) => setState({ catFilter }), [setState]);

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
  const newProduct = useCallback(() => setState({ draft: { _new: true, name: "", category: "טבעות", price: 0, stock: 1, material: "כסף 925", description: "", details: "", images: [], featured: false, sizesText: "S, M, L" } }), [setState]);
  const editProduct = useCallback((p) => setState({ draft: { ...p, images: p.images && p.images.length ? p.images : (p.image ? [p.image] : []), sizesText: (p.sizes || []).join(", ") } }), [setState]);
  const setDraft = useCallback((k, v) => setState((s) => ({ draft: { ...s.draft, [k]: v } })), [setState]);
  const cancelDraft = useCallback(() => setState({ draft: null }), [setState]);
  const saveDraft = useCallback(async () => {
    const d = { ...ref.current.draft };
    const images = (d.images || []).slice(0, 5);
    const payload = {
      name: d.name, category: d.category, price: Number(d.price) || 0, stock: Math.max(0, Number(d.stock) || 0), material: d.material,
      description: d.description, details: (d.details || "").trim(), image: images[0] || "", images, featured: !!d.featured,
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
  const startCheckout = useCallback(async (addr) => {
    if (ref.current.checkoutBusy) return;
    setState({ checkoutBusy: true });
    const s = ref.current;
    const items = s.cart.map((c) => ({ id: c.id, qty: c.qty, size: c.size }));
    try {
      const { url, order } = await store.checkout.createSession({ items, shipping_address: addr, couponCode: s.couponCode || undefined });
      addMyOrder(order);
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
    setState((s) => ({ lastOrder: { ...s.lastOrder, ...order } }));
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
    cartCount: state.cart.reduce((a, c) => a + c.qty, 0),
    favoritesCount: state.favorites.length,
    // actions
    go, openProduct, goAdmin, goCheckout,
    addToCart, changeQty, removeItem, addCurrent, toggleFavorite,
    setAdminField, submitAdminLogin, logout,
    setQty, setSize, setCatFilter,
    setTab, newProduct, editProduct, setDraft, cancelDraft, saveDraft, deleteProduct, refreshProducts,
    newCollection, editCollection, setDraftCol, cancelCol, saveCol, deleteCollection,
    setCdraft, saveContent, setOrderStatus, uploadImage, startCheckout, createTestPayment, refreshOrder,
    openSignupPopup, closeSignupPopup, maybeOfferSignupPopup, submitSignup, applyCoupon, removeCoupon, viewOrder, customerLogout,
    openPhoneLogin, closePhoneLogin, loginByPhone,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
