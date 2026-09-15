import React from "react";
import { css } from "../../lib/css.js";
import { useStore } from "../../context/StoreContext.jsx";

// Read-only by design — a single full-control admin, no multi-admin/RBAC.
export function UsersTab() {
  const { users } = useStore();
  return (
    <div>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;margin-bottom:20px;")}>משתמשים רשומים ({users.length})</h2>
      {users.map((u) => (
        <div key={u.id || u.email} className="r-admin-row" style={css("background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:16px 20px;margin-bottom:10px;display:flex;align-items:center;gap:16px;")}>
          <div style={css("width:42px;height:42px;border-radius:50%;background:var(--c-line-soft);color:var(--c-accent);display:flex;align-items:center;justify-content:center;font-size:17px;font-family:var(--font-serif);")}>{(u.name || u.email || "?").trim().charAt(0)}</div>
          <div style={css("flex:1;")}><div style={css("font-weight:600;font-size:15px;")}>{u.name || "—"}</div><div style={css("font-size:13px;color:var(--c-ink-mute);")}>{u.email || ""}</div></div>
          <span style={css(`font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:100px;background:${u.role === "admin" ? "var(--c-accent-soft)" : "var(--c-line-soft)"};color:${u.role === "admin" ? "var(--c-accent)" : "var(--c-ink-mute)"};`)}>{u.role === "admin" ? "מנהל" : "לקוח"}</span>
        </div>
      ))}
    </div>
  );
}
