import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import store, { SEED_PRODUCTS, SEED_CONTENT, SEED_COLLECTIONS, BACKEND } from "../lib/store.js";
import { ADMIN_PATH } from "../lib/adminPath.js";

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const loadCart = () => {
  try { return JSON.parse(localStorage.getItem("alfi:cart") || "[]"); } catch { return []; }
};
const saveCart = (cart) => {
  try { localStorage.setItem("alfi:cart", JSON.stringify(cart)); } catch { /* ignore */ }
};
const scrollTop = () => { if (typeof window !== "undefined") window.scrollTo(0, 0); };

const isAdminPath = () => typeof window !== "undefined" && window.location.pathname === ADMIN_PATH;

export function StoreProvider({ children }) {
  const [state, setFull] = useState(() => ({
    loaded: false,
    screen: isAdminPath() ? "admin-login" : "home",
    pid: SEED_PRODUCTS[0].id,
    qty: 1,
    size: "",
    products: SEED_PRODUCTS,
    content: SEED_CONTENT,
    collections: SEED_COLLECTIONS,
    user: null,
    users: [],
    cart: loadCart(),
    catFilter: "הכל",
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
  }));

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
          setState({ lastOrder: order, cart: [] });
          saveCart([]);
          go("confirm");
        }
      })();
    } else if (viewId) {
      window.history.replaceState({}, "", window.location.pathname);
      (async () => {
        try {
          const order = await store.orders.getPublic(viewId);
          setState({ lastOrder: order });
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

  const goCheckout = useCallback(() => go("checkout"), [go]);

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
  const newProduct = useCallback(() => setState({ draft: { _new: true, name: "", category: "טבעות", price: 0, stock: 50, material: "כסף 925", description: "", images: [], featured: false, sizesText: "S, M, L" } }), [setState]);
  const editProduct = useCallback((p) => setState({ draft: { ...p, images: p.images && p.images.length ? p.images : (p.image ? [p.image] : []), sizesText: (p.sizes || []).join(", ") } }), [setState]);
  const setDraft = useCallback((k, v) => setState((s) => ({ draft: { ...s.draft, [k]: v } })), [setState]);
  const cancelDraft = useCallback(() => setState({ draft: null }), [setState]);
  const saveDraft = useCallback(async () => {
    const d = { ...ref.current.draft };
    const images = (d.images || []).slice(0, 5);
    const payload = {
      name: d.name, category: d.category, price: Number(d.price) || 0, stock: Math.max(0, Number(d.stock) || 0), material: d.material,
      description: d.description, image: images[0] || "", images, featured: !!d.featured,
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
  // write) so a "status changed" email always fires exactly once — see
  // src/lib/store.js orders.updateStatus.
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
      const { url, order } = await store.checkout.createSession({ items, shipping_address: addr });
      if (url) {
        try { localStorage.setItem("alfi:pendingOrder", JSON.stringify(order)); } catch { /* ignore */ }
        window.location.href = url;
      } else {
        setState({ lastOrder: order, cart: [], checkoutBusy: false });
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
    // actions
    go, openProduct, goAdmin, goCheckout,
    addToCart, changeQty, removeItem, addCurrent,
    setAdminField, submitAdminLogin, logout,
    setQty, setSize, setCatFilter,
    setTab, newProduct, editProduct, setDraft, cancelDraft, saveDraft, deleteProduct, refreshProducts,
    newCollection, editCollection, setDraftCol, cancelCol, saveCol, deleteCollection,
    setCdraft, saveContent, setOrderStatus, uploadImage, startCheckout, createTestPayment, refreshOrder,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
