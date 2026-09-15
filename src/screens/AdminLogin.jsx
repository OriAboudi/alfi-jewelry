import React from "react";
import { css } from "../lib/css.js";
import { useStore } from "../context/StoreContext.jsx";

export function AdminLogin() {
  const { adminForm, adminError, adminBusy, setAdminField, submitAdminLogin } = useStore();

  return (
    <div style={css("min-height:100vh;display:flex;align-items:center;justify-content:center;background:#faf5ef;")}>
      <div style={css("width:100%;max-width:360px;padding:40px;background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(70,50,40,.12);")}>
        <div style={css("text-align:center;margin-bottom:28px;")}>
          <div style={css("font-family:'Frank Ruhl Libre',serif;font-size:24px;letter-spacing:.14em;")}>ALFI</div>
        </div>
        <div style={css("margin-bottom:16px;")}>
          <label style={css("display:block;font-size:13px;color:var(--c-ink-mute);margin-bottom:7px;")}>אימייל</label>
          <input
            value={adminForm.email}
            onChange={(e) => setAdminField("email", e.target.value)}
            style={css("width:100%;padding:13px 15px;border:1px solid var(--c-line-strong);border-radius:12px;font-size:15px;background:#fff;")}
          />
        </div>
        <div style={css("margin-bottom:18px;")}>
          <label style={css("display:block;font-size:13px;color:var(--c-ink-mute);margin-bottom:7px;")}>סיסמה</label>
          <input
            type="password"
            value={adminForm.password}
            onChange={(e) => setAdminField("password", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitAdminLogin(); }}
            style={css("width:100%;padding:13px 15px;border:1px solid var(--c-line-strong);border-radius:12px;font-size:15px;background:#fff;")}
          />
        </div>
        {adminError && (
          <div style={css("background:var(--c-danger-bg);color:var(--c-danger);font-size:13.5px;padding:11px 14px;border-radius:10px;margin-bottom:16px;")}>
            {adminError}
          </div>
        )}
        <button
          onClick={submitAdminLogin}
          style={css(`width:100%;padding:15px;background:var(--c-accent);color:#fff;border:none;border-radius:12px;font-size:15.5px;font-weight:600;cursor:pointer;opacity:${adminBusy ? 0.6 : 1};`)}
        >
          {adminBusy ? "רגע..." : "כניסה"}
        </button>
      </div>
    </div>
  );
}
