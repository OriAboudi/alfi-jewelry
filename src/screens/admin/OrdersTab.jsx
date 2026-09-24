import React from "react";
import { css } from "../../lib/css.js";
import { fmt, fmtDate, fmtDateTime } from "../../lib/format.js";
import { useStore } from "../../context/StoreContext.jsx";
import { store } from "../../lib/store.js";
import { Overlay, OverlayHeader, Pager, lbl, inp, STATUS_OPTS, emailDraft } from "./shared.jsx";

const PAGE_SIZE = 20;

const card = "background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:18px;";
const cardTitle = "font-size:13px;font-weight:700;color:var(--c-ink-mute);margin-bottom:10px;";
const btnPrimary = "padding:11px 18px;background:var(--c-accent);color:#fff;border:none;border-radius:11px;font-size:14.5px;font-weight:600;cursor:pointer;";
const btnSecondary = "padding:11px 18px;background:#fff;color:var(--c-ink);border:1px solid var(--c-line-strong);border-radius:11px;font-size:14.5px;cursor:pointer;";

// Composer for a customer email about one order. Pre-filled from a status
// template (or blank), always editable; the server adds the order number,
// tracking link and footer, and sends only to the order's own address.
function EmailComposer({ to, draft, setDraft, firstName, sending, error, onSend, onCancel }) {
  const pickTemplate = (key) => setDraft(emailDraft(key, firstName));
  const canSend = !sending && draft.subject.trim() && draft.message.trim();
  return (
    <div style={css(card + "border-color:var(--c-accent);")}>
      <div style={css(cardTitle)}>מייל ללקוח</div>
      <div style={css("font-size:13.5px;color:var(--c-ink-soft);margin-bottom:14px;")}>אל: <span dir="ltr">{to}</span></div>
      <div style={css("display:flex;flex-direction:column;gap:12px;")}>
        <div>
          <label style={css(lbl)}>תבנית</label>
          <select value={draft.template} onChange={(e) => pickTemplate(e.target.value)} style={css(inp + "cursor:pointer;")}>
            {STATUS_OPTS.map((sname) => <option key={sname} value={sname}>{`סטטוס: ${sname}`}</option>)}
            <option value="">הודעה חופשית</option>
          </select>
        </div>
        <div>
          <label style={css(lbl)}>נושא</label>
          <input value={draft.subject} maxLength={150} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} style={css(inp)} />
        </div>
        <div>
          <label style={css(lbl)}>תוכן ההודעה</label>
          <textarea value={draft.message} maxLength={5000} rows={6} onChange={(e) => setDraft({ ...draft, message: e.target.value })} style={css(inp + "resize:vertical;line-height:1.6;")} />
          <div style={css("font-size:12px;color:var(--c-ink-mute);margin-top:6px;")}>מספר ההזמנה וקישור למעקב יתווספו למייל אוטומטית.</div>
        </div>
        {error && <div role="alert" style={css("color:var(--c-danger);font-size:13px;")}>{error}</div>}
        <div style={css("display:flex;gap:10px;")}>
          <button onClick={onSend} disabled={!canSend} style={css(btnPrimary + "flex:1;" + (canSend ? "" : "opacity:.55;cursor:default;"))}>
            {sending ? "שולח…" : "שליחת המייל"}
          </button>
          <button onClick={onCancel} disabled={sending} style={css(btnSecondary)}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

export function OrdersTab() {
  const { setOrderStatus } = useStore();

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [paymentStatus, setPaymentStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState([]);
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [orderView, setOrderView] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [emails, setEmails] = React.useState([]);
  // Customer email composer (one order at a time — it lives in the
  // order-detail overlay). null = closed.
  const [draft, setDraft] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState("");
  const [sentTo, setSentTo] = React.useState("");
  // After a status change: offer (never force) an email about it.
  const [statusPrompt, setStatusPrompt] = React.useState(null); // { id, number, status }

  const reload = React.useCallback(() => {
    setLoading(true);
    store.orders
      .listAll({ search: search.trim() || undefined, status: status || undefined, paymentStatus: paymentStatus || undefined, page, pageSize: PAGE_SIZE })
      .then((r) => { setRows(r.rows); setCount(r.count); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, status, paymentStatus, page]);

  React.useEffect(() => { setPage(1); }, [search, status, paymentStatus]);
  React.useEffect(() => { const t = setTimeout(reload, 250); return () => clearTimeout(t); }, [reload]);

  React.useEffect(() => {
    if (!orderView) { setHistory([]); return; }
    store.orders.history(orderView.id).then(setHistory).catch(() => setHistory([]));
  }, [orderView]);

  const orderViewId = orderView?.id;
  const loadEmails = React.useCallback(() => {
    if (!orderViewId) { setEmails([]); return; }
    store.orders.emails(orderViewId).then(setEmails).catch(() => setEmails([]));
  }, [orderViewId]);
  React.useEffect(loadEmails, [loadEmails]);

  // Status changes never email the customer by themselves — they record the
  // change and offer an email about it (statusPrompt), which the admin can
  // take or ignore.
  const changeStatus = async (id, s) => {
    const updated = await setOrderStatus(id, s);
    reload();
    if (!updated) return;
    setStatusPrompt({ id, number: updated.number, status: s });
    if (orderView?.id === id) {
      store.orders.history(id).then(setHistory).catch(() => {});
      setOrderView((o) => (o ? { ...o, status: s } : o));
    }
  };

  const openEmail = (order, templateKey) => {
    setOrderView(order);
    setDraft(emailDraft(templateKey, order.shipping_address?.first));
    setSendError("");
    setSentTo("");
    setStatusPrompt((p) => (p?.id === order.id ? null : p));
  };

  const closeOrderView = () => {
    setOrderView(null);
    setDraft(null);
    setSendError("");
    setSentTo("");
  };

  const sendEmail = async () => {
    if (!orderView || !draft) return;
    setSending(true);
    setSendError("");
    try {
      const { to } = await store.orders.sendEmail(orderView.id, { subject: draft.subject.trim(), message: draft.message.trim() });
      setDraft(null);
      setSentTo(to);
    } catch (e) {
      setSendError(e.message || "שליחת המייל נכשלה");
    } finally {
      setSending(false);
      loadEmails();
    }
  };

  return (
    <div>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;margin-bottom:18px;")}>הזמנות ({count})</h2>

      <div style={css("display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;")}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי מספר הזמנה…" style={css(inp + "max-width:220px;")} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={css(inp + "max-width:150px;cursor:pointer;")}>
          <option value="">כל הסטטוסים</option>
          {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={css(inp + "max-width:150px;cursor:pointer;")}>
          <option value="">כל סטטוסי התשלום</option>
          <option value="paid">שולם</option>
          <option value="pending">טרם שולם</option>
        </select>
      </div>

      {statusPrompt && statusPrompt.id !== orderView?.id && (() => {
        const o = rows.find((x) => x.id === statusPrompt.id);
        return (
          <div role="status" style={css("display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:var(--c-line-soft);border-radius:14px;padding:12px 16px;margin-bottom:18px;font-size:14px;")}>
            <span style={css("flex:1;min-width:200px;")}>הסטטוס של הזמנה {statusPrompt.number} עודכן ל־<strong>{statusPrompt.status}</strong>. לשלוח מייל ללקוח?</span>
            {o?.shipping_address?.email && (
              <button onClick={() => openEmail(o, statusPrompt.status)} style={css(btnPrimary + "padding:8px 14px;font-size:13.5px;")}>✉ כתיבת מייל</button>
            )}
            <button onClick={() => setStatusPrompt(null)} aria-label="סגירה" style={css("background:none;border:none;font-size:20px;line-height:1;color:var(--c-ink-mute);cursor:pointer;padding:4px 8px;")}>×</button>
          </div>
        );
      })()}

      {loading ? (
        <div style={css("text-align:center;padding:40px;color:var(--c-ink-mute);")}>טוען…</div>
      ) : rows.length === 0 ? (
        <div style={css("background:#fff;border:1px dashed var(--c-line-strong);border-radius:14px;padding:40px;text-align:center;color:var(--c-ink-mute);")}>לא נמצאו הזמנות.</div>
      ) : rows.map((o) => {
        const qty = (o.items || []).reduce((a, it) => a + (it.qty || 0), 0);
        const cust = (o.shipping_address && ((o.shipping_address.first || "") + " " + (o.shipping_address.last || "")).trim()) || "אורח";
        return (
          <div key={o.id} className="r-admin-row" style={css(`background:#fff;border:1px solid ${o.is_test ? "var(--c-line-strong)" : "var(--c-line)"};border-radius:14px;padding:18px 20px;margin-bottom:10px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;${o.is_test ? "opacity:.7;" : ""}`)}>
            {o.is_test && <span style={css("font-size:11px;font-weight:700;padding:4px 9px;border-radius:100px;background:var(--c-line-soft);color:var(--c-ink-mute);white-space:nowrap;")}>TEST</span>}
            {o.review_flag && <span title={o.review_flag} style={css("font-size:11px;font-weight:700;padding:4px 9px;border-radius:100px;background:var(--c-danger-bg);color:var(--c-danger);white-space:nowrap;")}>⚠ לבדיקה</span>}
            <div style={css("flex:1;min-width:140px;")}><div style={css("font-weight:600;font-size:15.5px;")}>{o.number}</div><div style={css("font-size:13px;color:var(--c-ink-mute);")}>{fmtDate(o.created_at)} · {cust}</div></div>
            <div style={css("font-size:14px;color:var(--c-ink-soft);")}>{qty} פריטים</div>
            <span style={css(`font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:100px;white-space:nowrap;background:${o.payment_status === "paid" ? "var(--c-success-bg)" : "var(--c-danger-bg)"};color:${o.payment_status === "paid" ? "var(--c-success)" : "var(--c-danger)"};`)}>
              {o.payment_status === "paid" ? "שולם" : "טרם שולם"}
            </span>
            <div style={css("font-size:16px;font-weight:600;width:90px;")}>{fmt(o.total)}</div>
            <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} style={css("padding:8px 12px;border:1px solid var(--c-line-strong);border-radius:9px;font-size:13.5px;background:#fff;cursor:pointer;color:var(--c-ink);")}>
              {STATUS_OPTS.map((sname) => <option key={sname} value={sname}>{sname}</option>)}
            </select>
            <button onClick={() => openEmail(o, o.status)} disabled={!o.shipping_address?.email} title={o.shipping_address?.email ? "שליחת מייל ללקוח" : "אין אימייל בהזמנה"} style={css(`padding:8px 14px;background:var(--c-line-soft);border:none;border-radius:9px;font-size:13.5px;color:var(--c-accent);font-weight:600;white-space:nowrap;${o.shipping_address?.email ? "cursor:pointer;" : "opacity:.45;cursor:default;"}`)}>✉ מייל</button>
            <button onClick={() => setOrderView(o)} style={css("padding:8px 14px;background:var(--c-line-soft);border:none;border-radius:9px;font-size:13.5px;color:var(--c-accent);font-weight:600;cursor:pointer;white-space:nowrap;")}>פרטים</button>
          </div>
        );
      })}

      <Pager page={page} pageSize={PAGE_SIZE} count={count} onPage={setPage} />

      {orderView && (() => {
        const o = rows.find((x) => x.id === orderView.id) || orderView;
        const addr = o.shipping_address || {};
        const fullName = [addr.first, addr.last].filter(Boolean).join(" ") || "אורח";
        return (
          <Overlay onClose={closeOrderView}>
            <OverlayHeader title={o.number} onClose={closeOrderView} />
            <div style={css("display:flex;flex-direction:column;gap:18px;")}>
              {o.review_flag && (
                <div role="alert" style={css("background:var(--c-danger-bg);color:var(--c-danger);border-radius:14px;padding:14px 18px;font-size:14px;font-weight:600;")}>⚠ {o.review_flag}</div>
              )}
              <div>
                <label style={css(lbl)}>סטטוס הזמנה</label>
                <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} style={css(inp + "cursor:pointer;")}>
                  {STATUS_OPTS.map((sname) => <option key={sname} value={sname}>{sname}</option>)}
                </select>
              </div>
              {draft ? (
                <EmailComposer
                  to={addr.email}
                  draft={draft}
                  setDraft={setDraft}
                  firstName={addr.first}
                  sending={sending}
                  error={sendError}
                  onSend={sendEmail}
                  onCancel={() => { setDraft(null); setSendError(""); }}
                />
              ) : statusPrompt?.id === o.id && addr.email ? (
                <div role="status" style={css("background:var(--c-line-soft);border-radius:14px;padding:14px 16px;font-size:14px;")}>
                  <div style={css("margin-bottom:10px;")}>הסטטוס עודכן ל־<strong>{statusPrompt.status}</strong>. לשלוח מייל ללקוח?</div>
                  <div style={css("display:flex;gap:10px;")}>
                    <button onClick={() => openEmail(o, statusPrompt.status)} style={css(btnPrimary + "padding:9px 16px;font-size:14px;")}>✉ כתיבת מייל</button>
                    <button onClick={() => setStatusPrompt(null)} style={css(btnSecondary + "padding:9px 16px;font-size:14px;")}>לא עכשיו</button>
                  </div>
                </div>
              ) : (
                <div style={css("display:flex;align-items:center;gap:12px;flex-wrap:wrap;")}>
                  <button onClick={() => openEmail(o, o.status)} disabled={!addr.email} style={css(btnSecondary + (addr.email ? "" : "opacity:.5;cursor:default;"))}>✉ שליחת מייל ללקוח</button>
                  {!addr.email && <span style={css("font-size:13px;color:var(--c-ink-mute);")}>אין אימייל בהזמנה</span>}
                  {sentTo && <span role="status" style={css("font-size:13.5px;color:var(--c-success);font-weight:600;")}>✓ המייל נשלח אל <span dir="ltr">{sentTo}</span></span>}
                </div>
              )}
              <div style={css("background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:18px;")}>
                <div style={css("font-size:13px;font-weight:700;color:var(--c-ink-mute);margin-bottom:10px;")}>פרטי לקוח</div>
                <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:14px;")}>
                  <div><div style={css("color:var(--c-ink-mute);font-size:12px;")}>שם</div><div>{fullName}</div></div>
                  <div><div style={css("color:var(--c-ink-mute);font-size:12px;")}>אימייל</div><div>{addr.email || "—"}</div></div>
                  <div><div style={css("color:var(--c-ink-mute);font-size:12px;")}>טלפון</div><div>{addr.phone || "—"}</div></div>
                  <div><div style={css("color:var(--c-ink-mute);font-size:12px;")}>תשלום</div><div>{o.payment_status === "paid" ? "שולם" : "טרם שולם"}</div></div>
                  <div style={css("grid-column:1/3;")}><div style={css("color:var(--c-ink-mute);font-size:12px;")}>כתובת</div><div>{[addr.address, addr.city, addr.zip].filter(Boolean).join(", ") || "—"}</div></div>
                </div>
              </div>
              <div style={css("background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:18px;")}>
                <div style={css("font-size:13px;font-weight:700;color:var(--c-ink-mute);margin-bottom:10px;")}>פריטים</div>
                {(o.items || []).map((it, i) => (
                  <div key={i} style={css("display:flex;justify-content:space-between;font-size:14px;margin-bottom:8px;")}>
                    <span>{it.name}{it.size ? ` (${it.size})` : ""} × {it.qty}</span>
                    <span style={css("font-weight:600;")}>{fmt(it.price * it.qty)}</span>
                  </div>
                ))}
                <div style={css("height:1px;background:var(--c-line);margin:10px 0;")} />
                <div style={css("display:flex;justify-content:space-between;font-size:13.5px;color:var(--c-ink-mute);margin-bottom:4px;")}><span>משלוח</span><span>{o.shipping ? fmt(o.shipping) : "חינם"}</span></div>
                <div style={css("display:flex;justify-content:space-between;font-size:16px;font-weight:700;")}><span>סה״כ</span><span>{fmt(o.total)}</span></div>
              </div>
              {history.length > 0 && (
                <div style={css("background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:18px;")}>
                  <div style={css("font-size:13px;font-weight:700;color:var(--c-ink-mute);margin-bottom:10px;")}>ציר זמן סטטוס</div>
                  {history.map((h, i) => (
                    <div key={i} style={css("display:flex;justify-content:space-between;font-size:13.5px;padding:6px 0;border-top:1px solid var(--c-line-soft);")}>
                      <span>{h.status}</span>
                      <span style={css("color:var(--c-ink-mute);")}>{fmtDateTime(h.changed_at)}{h.notified ? " · נשלח מייל" : ""}</span>
                    </div>
                  ))}
                </div>
              )}
              {emails.length > 0 && (
                <div style={css(card)}>
                  <div style={css(cardTitle)}>מיילים ללקוח</div>
                  {emails.map((m, i) => (
                    <details key={i} style={css("padding:8px 0;border-top:1px solid var(--c-line-soft);font-size:13.5px;")}>
                      <summary style={css("display:flex;justify-content:space-between;gap:10px;cursor:pointer;list-style:none;")}>
                        <span style={css("font-weight:600;")}>{m.subject}</span>
                        <span style={css(`white-space:nowrap;color:${m.status === "failed" ? "var(--c-danger)" : "var(--c-ink-mute)"};`)}>
                          {m.status === "failed" ? "נכשל · " : ""}{fmtDateTime(m.sent_at)}
                        </span>
                      </summary>
                      <div style={css("white-space:pre-wrap;color:var(--c-ink-soft);margin-top:8px;line-height:1.6;")}>{m.body}</div>
                      {m.status === "failed" && m.error && <div style={css("color:var(--c-danger);font-size:12.5px;margin-top:6px;")}>{m.error}</div>}
                    </details>
                  ))}
                </div>
              )}
              <button onClick={closeOrderView} style={css("padding:13px;background:#fff;color:var(--c-ink);border:1px solid var(--c-line-strong);border-radius:11px;font-size:15px;cursor:pointer;")}>סגירה</button>
            </div>
          </Overlay>
        );
      })()}
    </div>
  );
}
