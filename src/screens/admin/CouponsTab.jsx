import React from "react";
import { css } from "../../lib/css.js";
import { fmtDateTime } from "../../lib/format.js";
import { store } from "../../lib/store.js";
import { Pager } from "./shared.jsx";

const PAGE_SIZE = 20;

const STATUS_LABEL = { active: "פעיל", redeemed: "נוצל", void: "בוטל" };
const STATUS_COLOR = {
  active: { fg: "var(--c-success)", bg: "var(--c-success-bg)" },
  redeemed: { fg: "var(--c-ink-mute)", bg: "var(--c-line-soft)" },
  void: { fg: "var(--c-danger)", bg: "var(--c-danger-bg)" },
};

export function CouponsTab() {
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState([]);
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(() => {
    setLoading(true);
    store.adminCoupons
      .list({ page, pageSize: PAGE_SIZE })
      .then((r) => { setRows(r.rows); setCount(r.count); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  React.useEffect(() => { reload(); }, [reload]);

  const voidCoupon = async (id) => {
    if (!confirm("לבטל את הקופון? לא ניתן יהיה להשתמש בו יותר.")) return;
    try { await store.adminCoupons.void(id); reload(); } catch (e) { alert("ביטול נכשל: " + e.message); }
  };

  const active = rows.filter((r) => r.status === "active").length;
  const redeemed = rows.filter((r) => r.status === "redeemed").length;

  return (
    <div>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;margin-bottom:18px;")}>קופונים ({count})</h2>

      <div style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:22px;")}>
        <div style={css("background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:16px 18px;")}>
          <div style={css("font-size:12.5px;color:var(--c-ink-mute);margin-bottom:4px;")}>סה״כ הונפקו</div>
          <div style={css("font-size:24px;font-weight:700;")}>{count}</div>
        </div>
        <div style={css("background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:16px 18px;")}>
          <div style={css("font-size:12.5px;color:var(--c-ink-mute);margin-bottom:4px;")}>פעילים (בעמוד זה)</div>
          <div style={css("font-size:24px;font-weight:700;color:var(--c-success);")}>{active}</div>
        </div>
        <div style={css("background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:16px 18px;")}>
          <div style={css("font-size:12.5px;color:var(--c-ink-mute);margin-bottom:4px;")}>נוצלו (בעמוד זה)</div>
          <div style={css("font-size:24px;font-weight:700;")}>{redeemed}</div>
        </div>
      </div>

      {loading ? (
        <div style={css("text-align:center;padding:40px;color:var(--c-ink-mute);")}>טוען…</div>
      ) : rows.length === 0 ? (
        <div style={css("background:#fff;border:1px dashed var(--c-line-strong);border-radius:14px;padding:40px;text-align:center;color:var(--c-ink-mute);")}>עדיין לא הונפקו קופונים.</div>
      ) : (
        <div style={css("overflow-x:auto;")}>
          <table style={css("width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;")}>
            <thead>
              <tr style={css("background:var(--c-line-soft);text-align:right;")}>
                <th style={css("padding:12px 14px;font-size:12.5px;color:var(--c-ink-mute);")}>קוד</th>
                <th style={css("padding:12px 14px;font-size:12.5px;color:var(--c-ink-mute);")}>שם</th>
                <th style={css("padding:12px 14px;font-size:12.5px;color:var(--c-ink-mute);")}>אימייל</th>
                <th style={css("padding:12px 14px;font-size:12.5px;color:var(--c-ink-mute);")}>טלפון</th>
                <th style={css("padding:12px 14px;font-size:12.5px;color:var(--c-ink-mute);")}>אחוז</th>
                <th style={css("padding:12px 14px;font-size:12.5px;color:var(--c-ink-mute);")}>סטטוס</th>
                <th style={css("padding:12px 14px;font-size:12.5px;color:var(--c-ink-mute);")}>נוצר</th>
                <th style={css("padding:12px 14px;font-size:12.5px;color:var(--c-ink-mute);")}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const color = STATUS_COLOR[c.status] || STATUS_COLOR.active;
                return (
                  <tr key={c.id} style={css("border-top:1px solid var(--c-line);")}>
                    <td style={css("padding:12px 14px;font-weight:700;font-size:13.5px;letter-spacing:.03em;")}>{c.code}</td>
                    <td style={css("padding:12px 14px;font-size:13.5px;")}>{c.name || "—"}</td>
                    <td style={css("padding:12px 14px;font-size:13.5px;")}>{c.email}</td>
                    <td style={css("padding:12px 14px;font-size:13.5px;")}>{c.phone || "—"}</td>
                    <td style={css("padding:12px 14px;font-size:13.5px;")}>{c.percent}%</td>
                    <td style={css("padding:12px 14px;")}>
                      <span style={css(`font-size:12px;font-weight:600;padding:4px 10px;border-radius:100px;white-space:nowrap;background:${color.bg};color:${color.fg};`)}>{STATUS_LABEL[c.status] || c.status}</span>
                    </td>
                    <td style={css("padding:12px 14px;font-size:12.5px;color:var(--c-ink-mute);white-space:nowrap;")}>{fmtDateTime(c.created_at)}</td>
                    <td style={css("padding:12px 14px;")}>
                      {c.status === "active" && (
                        <button onClick={() => voidCoupon(c.id)} style={css("padding:6px 12px;background:var(--c-danger-bg);color:var(--c-danger);border:none;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap;")}>ביטול</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} pageSize={PAGE_SIZE} count={count} onPage={setPage} />
    </div>
  );
}
