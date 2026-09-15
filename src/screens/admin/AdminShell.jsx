import React from "react";
import { css } from "../../lib/css.js";
import { useStore } from "../../context/StoreContext.jsx";
import { DashboardTab } from "./DashboardTab.jsx";
import { ProductsTab } from "./ProductsTab.jsx";
import { CollectionsTab } from "./CollectionsTab.jsx";
import { ContentTab } from "./ContentTab.jsx";
import { OrdersTab } from "./OrdersTab.jsx";
import { UsersTab } from "./UsersTab.jsx";
import { PaymentTestsTab } from "./PaymentTestsTab.jsx";

const ADMIN_TABS = [
  ["dashboard", "סקירה כללית"],
  ["products", "מוצרים"],
  ["collections", "קולקציות"],
  ["content", "תוכן האתר"],
  ["orders", "הזמנות"],
  ["users", "משתמשים"],
  ["payments", "בדיקות תשלום"],
];

const TAB_COMPONENTS = {
  dashboard: DashboardTab,
  products: ProductsTab,
  collections: CollectionsTab,
  content: ContentTab,
  orders: OrdersTab,
  users: UsersTab,
  payments: PaymentTestsTab,
};

export function AdminShell() {
  const { adminTab, user, setTab, logout } = useStore();
  const TabComponent = TAB_COMPONENTS[adminTab] || DashboardTab;

  return (
    <div className="r-container" style={css("max-width:1180px;margin:30px auto;padding:40px;background:rgba(250,245,239,.82);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);border-radius:22px;box-shadow:0 24px 70px rgba(70,50,40,.12);")}>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:10px;")}>
        <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:38px;")}>מערכת ניהול</h1>
        <span style={css("font-size:13.5px;color:var(--c-ink-mute);")}>מחובר כ‑{user ? user.name : ""} · <span onClick={logout} style={css("color:var(--c-danger);cursor:pointer;")}>יציאה</span></span>
      </div>
      <p style={css("font-size:14.5px;color:var(--c-ink-mute);margin-bottom:24px;")}>כל שינוי נשמר מיידית. במצב מסד אמיתי — נשמר בענן.</p>

      <div style={css("display:flex;gap:8px;margin-bottom:28px;border-bottom:1px solid var(--c-line);padding-bottom:0;overflow-x:auto;")}>
        {ADMIN_TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={css(`border:none;background:none;cursor:pointer;font-size:15px;font-weight:600;padding:12px 18px;white-space:nowrap;color:${adminTab === k ? "var(--c-accent)" : "var(--c-ink-mute)"};border-bottom:2px solid ${adminTab === k ? "var(--c-accent)" : "transparent"};`)}>{label}</button>
        ))}
      </div>

      <TabComponent />
    </div>
  );
}
