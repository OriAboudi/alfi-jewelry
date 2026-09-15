import React from "react";
import { css } from "./lib/css.js";
import { useStore } from "./context/StoreContext.jsx";
import { Header } from "./components/Header.jsx";
import { Footer } from "./components/Footer.jsx";
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
  admin: Admin,
};

const CHROMELESS = new Set(["admin", "admin-login"]);

const PAGE_BG =
  "font-family:'Assistant',sans-serif;color:#3a2c25;" +
  "background:linear-gradient(rgba(250,245,239,.42),rgba(250,245,239,.55)),url(floral-bg.jpg) center top/cover fixed;" +
  "background-color:#faf5ef;min-height:100vh;font-weight:400;line-height:1.65;-webkit-font-smoothing:antialiased;";

export default function App() {
  const { screen } = useStore();

  // The admin login gate is a full-bleed page with its own layout (no header/footer).
  if (screen === "admin-login") {
    return (
      <div dir="rtl" style={css(PAGE_BG)}>
        <AdminLogin />
      </div>
    );
  }

  const Screen = SCREENS[screen] || Home;
  const showChrome = !CHROMELESS.has(screen);

  return (
    <div dir="rtl" style={css(PAGE_BG)}>
      {showChrome && <Header />}
      <Screen />
      {showChrome && <Footer />}
    </div>
  );
}
