import React from "react";
import { css } from "./lib/css.js";
import { useStore } from "./context/StoreContext.jsx";
import { Header } from "./components/Header.jsx";
import { Footer } from "./components/Footer.jsx";
import { SignupCouponPopup } from "./components/SignupCouponPopup.jsx";
import { PhoneLoginPopup } from "./components/PhoneLoginPopup.jsx";
import { AdminLogin } from "./screens/AdminLogin.jsx";
import { Home } from "./screens/Home.jsx";
import { Catalog } from "./screens/Catalog.jsx";
import { Product } from "./screens/Product.jsx";
import { Collections } from "./screens/Collections.jsx";
import { Story } from "./screens/Story.jsx";
import { Cart } from "./screens/Cart.jsx";
import { Checkout } from "./screens/Checkout.jsx";
import { Confirm } from "./screens/Confirm.jsx";
import { PaymentFailed } from "./screens/PaymentFailed.jsx";
import { Status } from "./screens/Status.jsx";
import { MyOrders } from "./screens/MyOrders.jsx";
import { Favorites } from "./screens/Favorites.jsx";
import { Loading } from "./screens/Loading.jsx";
import { Contact } from "./screens/Contact.jsx";
import { Privacy } from "./screens/Privacy.jsx";
import { Terms } from "./screens/Terms.jsx";
import { Shipping } from "./screens/Shipping.jsx";
import { Admin } from "./screens/Admin.jsx";

const SCREENS = {
  home: Home,
  catalog: Catalog,
  product: Product,
  collections: Collections,
  story: Story,
  cart: Cart,
  checkout: Checkout,
  confirm: Confirm,
  "payment-failed": PaymentFailed,
  status: Status,
  "my-orders": MyOrders,
  favorites: Favorites,
  loading: Loading,
  contact: Contact,
  privacy: Privacy,
  terms: Terms,
  shipping: Shipping,
  admin: Admin,
};

const CHROMELESS = new Set(["admin", "admin-login"]);

// The floral painting itself is now two fixed (not background-attachment:
// fixed — broken on iOS) layers behind everything, see .rd-bg-paint/
// .rd-bg-veil in redesign.css. .r-page-bg here is just the cream fallback
// color + typography.
const PAGE_BG =
  "font-family:var(--font-sans);color:var(--c-ink);" +
  "min-height:100vh;font-weight:400;line-height:1.65;-webkit-font-smoothing:antialiased;";

export default function App() {
  const { screen } = useStore();

  // The admin login gate is a full-bleed page with its own layout (no
  // header/footer) and keeps the old plain background — admin is an
  // internal tool, out of scope for the redesign.
  if (screen === "admin-login") {
    return (
      <div dir="rtl" className="r-page-bg" style={css(PAGE_BG)}>
        <AdminLogin />
      </div>
    );
  }

  const Screen = SCREENS[screen] || Home;
  const showChrome = !CHROMELESS.has(screen);

  return (
    <div dir="rtl" className="r-page-bg" style={css(PAGE_BG)}>
      {showChrome && <div className="rd-bg-paint" aria-hidden="true" />}
      {showChrome && <div className="rd-bg-veil" aria-hidden="true" />}
      {/* position:relative + z-index:1 — .r-page-bg's own opaque background
          paints in normal flow, which (since .r-page-bg itself doesn't form
          a stacking context) happens AFTER the fixed bg layers above even
          though those use z-index:-2/-1, silently hiding them. Giving the
          real content its own explicit stacking level sidesteps that
          negative-z-index/paint-order gotcha instead of relying on it.
          (The 1440px width cap lives on the slider itself, not here — see
          .rd-rail-max in redesign.css — header/footer/other sections stay
          full-bleed.) */}
      <div style={css("position:relative;z-index:1;")}>
        {showChrome && <Header />}
        <Screen />
        {showChrome && <Footer />}
        {showChrome && <SignupCouponPopup />}
        {showChrome && <PhoneLoginPopup />}
      </div>
    </div>
  );
}
