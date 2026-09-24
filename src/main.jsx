import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { StoreProvider } from "./context/StoreContext.jsx";
import "./styles/base.css";
import "./styles/utilities.css";
import "./styles/redesign.css";
import "./index.css";

// Every screen change already scrolls to the top itself (StoreContext's go/
// openProduct/popstate). Left on "auto", mobile browsers re-apply the old
// scroll offset on reload / tab restore / back — after this SPA has
// rendered — so the site would open part-way down the home page, below the
// hero, with the header scrolled out of view.
if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
window.scrollTo(0, 0);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>
);
