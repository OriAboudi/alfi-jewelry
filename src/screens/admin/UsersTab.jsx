import React from "react";
import { css } from "../../lib/css.js";
import { fmtDate } from "../../lib/format.js";
import { store } from "../../lib/store.js";
import { useStore } from "../../context/StoreContext.jsx";
import { Pager } from "./shared.jsx";

const PAGE_SIZE = 20;

// Read-only by design — a single full-control admin, no multi-admin/RBAC.
export function UsersTab() {
  const { users } = useStore();

  const [page, setPage] = React.useState(1);
  const [signups, setSignups] = React.useState([]);
  const [signupCount, setSignupCount] = React.useState(0);
  const [loadingSignups, setLoadingSignups] = React.useState(true);

  React.useEffect(() => {
    setLoadingSignups(true);
    store.adminCoupons
      .list({ page, pageSize: PAGE_SIZE })
      .then((r) => { setSignups(r.rows); setSignupCount(r.count); })
      .catch(() => {})
      .finally(() => setLoadingSignups(false));
  }, [page]);

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

      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:22px;margin:36px 0 18px;")}>נרשמו דרך פופאפ ההרשמה ({signupCount})</h2>
      {loadingSignups ? (
        <div style={css("text-align:center;padding:30px;color:var(--c-ink-mute);")}>טוען…</div>
      ) : signups.length === 0 ? (
        <div style={css("background:#fff;border:1px dashed var(--c-line-strong);border-radius:14px;padding:32px;text-align:center;color:var(--c-ink-mute);")}>עדיין אין נרשמים.</div>
      ) : signups.map((s) => (
        <div key={s.id} className="r-admin-row" style={css("background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:16px 20px;margin-bottom:10px;display:flex;align-items:center;gap:16px;")}>
          <div style={css("width:42px;height:42px;border-radius:50%;background:var(--c-line-soft);color:var(--c-accent);display:flex;align-items:center;justify-content:center;font-size:17px;font-family:var(--font-serif);")}>{(s.name || s.email || "?").trim().charAt(0)}</div>
          <div style={css("flex:1;min-width:140px;")}>
            <div style={css("font-weight:600;font-size:15px;")}>{s.name || "—"}</div>
            <div style={css("font-size:13px;color:var(--c-ink-mute);")}>{s.email}{s.phone ? ` · ${s.phone}` : ""}</div>
          </div>
          <div style={css("font-size:12.5px;color:var(--c-ink-mute);white-space:nowrap;")}>{fmtDate(s.created_at)}</div>
          <span style={css("font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:100px;white-space:nowrap;background:var(--c-line-soft);color:var(--c-ink-mute);")}>קופון {s.percent}%</span>
        </div>
      ))}
      <Pager page={page} pageSize={PAGE_SIZE} count={signupCount} onPage={setPage} />
    </div>
  );
}
