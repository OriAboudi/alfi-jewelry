import React from "react";
import { createPortal } from "react-dom";
import "../../styles/restock.css";
import { css } from "../../lib/css.js";
import { fmt, fmtDate } from "../../lib/format.js";
import { setTitle } from "../../lib/pricing.js";
import { ImageLightbox } from "../../components/ImageLightbox.jsx";
import { useStore } from "../../context/StoreContext.jsx";
import { store } from "../../lib/store.js";
import { inp, CAT_NAMES, stockTier, TIER_COLOR } from "./shared.jsx";

// Admin "הזמנת מלאי": build a restock order for the supplier. Pick quantities
// per product — and per set, which is ordered as ONE unit (one of every
// piece) — then export two documents through the browser's print dialog
// ("Save as PDF"):
//   • הזמנה לספק  — photo + quantity, no prices (what the supplier gets)
//   • דוח עלויות  — photo, name, cost, quantity, line total and grand total
// Cost prices live in the admin-only cost_prices table (store.costs), keyed
// "p:<product id>" / "s:<set name>". A set with no cost of its own costs the
// sum of its pieces. The order in progress is kept in this browser
// (localStorage) until it is cleared.
const DRAFT_KEY = "alfi:restockDraft";
const SETS_CAT = "סטים";
const CATS = [...CAT_NAMES, SETS_CAT];
const MAX_QTY = 9999;

const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch { return {}; } };
const norm = (s) => String(s || "").toLowerCase().replace(/["״׳']/g, "").trim();

export function RestockTab() {
  const { products, content } = useStore();
  const low = Number(content.lowStockThreshold ?? 5);
  const fine = Number(content.stockFineThreshold ?? 10);

  const [costs, setCosts] = React.useState({});   // null = cost_prices table missing
  const [costEdits, setCostEdits] = React.useState({});
  const [savedKey, setSavedKey] = React.useState("");
  const [qty, setQty] = React.useState(() => readDraft().qty || {});
  const [supplier, setSupplier] = React.useState(() => readDraft().supplier || "");
  const [note, setNote] = React.useState(() => readDraft().note || "");
  const [cat, setCat] = React.useState("הכל");
  const [view, setView] = React.useState("all");   // all | low | picked
  const [search, setSearch] = React.useState("");
  const [viewImages, setViewImages] = React.useState(null);
  const [doc, setDoc] = React.useState(null);      // null | "order" | "costs"

  React.useEffect(() => { store.costs.list().then(setCosts).catch(() => setCosts(null)); }, []);
  React.useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ qty, supplier, note })); } catch { /* private mode */ }
  }, [qty, supplier, note]);

  // Everything that can be ordered: each product, plus each set (2+ pieces).
  const items = React.useMemo(() => {
    const bySet = {};
    for (const p of products) {
      const n = String(p.set_name || "").trim();
      if (n) (bySet[n] ||= []).push(p);
    }
    const sets = Object.entries(bySet).filter(([, members]) => members.length >= 2).map(([name, members]) => ({
      key: `s:${name}`, kind: "set", name: setTitle(name), category: SETS_CAT, members,
      images: members.map((m) => m.image || ""), sub: members.map((m) => m.name).join(" · "),
      stock: Math.min(...members.map((m) => Number(m.stock) || 0)),
    }));
    const singles = products.map((p) => ({
      key: `p:${p.id}`, kind: "product", name: p.name, category: p.category, members: [p],
      images: [p.image || ""], sub: [p.category, p.material].filter(Boolean).join(" · "), stock: Number(p.stock) || 0,
    }));
    return [...singles, ...sets].sort((a, b) => CATS.indexOf(a.category) - CATS.indexOf(b.category) || a.name.localeCompare(b.name, "he"));
  }, [products]);

  // A set's own cost wins; without one it costs the sum of its pieces (only
  // when every piece has a cost). null = unknown.
  const derivedSetCost = (it) => {
    if (!costs || it.kind !== "set") return null;
    const parts = it.members.map((m) => costs[`p:${m.id}`]);
    return parts.every((v) => v != null) ? parts.reduce((a, v) => a + v, 0) : null;
  };
  const costOf = (it) => (costs ? costs[it.key] ?? derivedSetCost(it) : null);

  const lines = items.filter((it) => qty[it.key] > 0).map((it) => {
    const cost = costOf(it);
    return { ...it, qty: qty[it.key], cost, total: cost == null ? null : cost * qty[it.key] };
  });
  const units = lines.reduce((a, l) => a + l.qty, 0);
  const totalCost = lines.reduce((a, l) => a + (l.total || 0), 0);
  const missingCost = lines.filter((l) => l.cost == null).length;

  const q = norm(search);
  const shown = items.filter((it) =>
    (cat === "הכל" || it.category === cat) &&
    (view === "all" || (view === "picked" ? qty[it.key] > 0 : stockTier(it.stock, { fine, low }) !== "ok")) &&
    (!q || norm(it.name).includes(q) || norm(it.sub).includes(q)));

  const changeQty = (key, value) => {
    const n = Math.max(0, Math.min(MAX_QTY, Math.floor(Number(value)) || 0));
    setQty((cur) => { const next = { ...cur }; if (n) next[key] = n; else delete next[key]; return next; });
  };
  const clearOrder = () => { if (confirm("לנקות את כל הכמויות שנבחרו?")) setQty({}); };

  const commitCost = async (key) => {
    const raw = costEdits[key];
    if (raw === undefined) return;
    setCostEdits((e) => { const n = { ...e }; delete n[key]; return n; });
    const next = String(raw).trim() === "" ? null : Math.max(0, Number(raw) || 0);
    if (next === (costs[key] ?? null)) return;
    const prev = costs;
    setCosts((c) => { const n = { ...c }; if (next == null) delete n[key]; else n[key] = next; return n; });
    try {
      await store.costs.set(key, next);
      setSavedKey(key); setTimeout(() => setSavedKey((k) => (k === key ? "" : k)), 1800);
    } catch { setCosts(prev); alert("שמירת מחיר העלות נכשלה"); }
  };

  const pickedIn = (c) => lines.filter((l) => c === "הכל" || l.category === c).length;
  const lowCount = items.filter((it) => stockTier(it.stock, { fine, low }) !== "ok").length;

  return (
    <div>
      <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;margin-bottom:6px;")}>הזמנת מלאי מהספק</h2>
      <p style={css("font-size:14px;color:var(--c-ink-mute);margin-bottom:20px;line-height:1.6;max-width:70ch;")}>
        בחרו כמות לכל מוצר או סט שתרצו להזמין. סט מוזמן כיחידה אחת (אחד מכל פריט בסט). בסיום הפיקו את ההזמנה לספק ואת דוח העלויות כקובצי PDF. ההזמנה נשמרת בדפדפן הזה עד שתנקו אותה.
      </p>

      {costs === null && (
        <div role="alert" style={css("background:var(--c-warning-bg);color:var(--c-ink);border-radius:12px;padding:12px 14px;margin-bottom:18px;font-size:14px;line-height:1.6;")}>
          מחירי העלות עדיין לא הופעלו במסד הנתונים. יש להריץ פעם אחת את הקובץ <span dir="ltr">supabase/add-cost-prices.sql</span> ב‑SQL Editor של Supabase ולרענן את העמוד. בינתיים אפשר לבחור כמויות ולהפיק הזמנה לספק.
        </div>
      )}

      <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 2fr;gap:12px;margin-bottom:18px;")}>
        <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="שם הספק (אופציונלי)" aria-label="שם הספק" style={css(inp)} />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="הערה שתופיע בהזמנה לספק (אופציונלי)" aria-label="הערה להזמנה" style={css(inp)} />
      </div>

      <div className="rs-chips no-scrollbar" role="group" aria-label="סינון לפי קטגוריה">
        {["הכל", ...CATS].map((c) => {
          const total = c === "הכל" ? items.length : items.filter((it) => it.category === c).length;
          if (!total && c !== "הכל") return null;
          const picked = pickedIn(c);
          return (
            <button key={c} type="button" className="rs-chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c}
              {picked > 0 && <span className="rs-chip-n" aria-label={`${picked} נבחרו`}>{picked}</span>}
            </button>
          );
        })}
      </div>

      <div className="rs-filters">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי שם…" aria-label="חיפוש מוצר או סט" style={css(inp + "max-width:240px;")} />
        <div className="rs-seg" role="group" aria-label="תצוגה">
          <button type="button" aria-pressed={view === "all"} onClick={() => setView("all")}>הכל</button>
          <button type="button" aria-pressed={view === "low"} onClick={() => setView("low")}>מלאי נמוך ({lowCount})</button>
          <button type="button" aria-pressed={view === "picked"} onClick={() => setView("picked")}>נבחרו ({lines.length})</button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rs-empty">
          {view === "picked" ? "עוד לא נבחרו פריטים להזמנה." : view === "low" ? "אין כאן פריטים במלאי נמוך." : "לא נמצאו פריטים."}
        </div>
      ) : (
        <div className="rs-grid">
          {shown.map((it) => {
            const n = qty[it.key] || 0;
            const cost = costOf(it);
            const derived = derivedSetCost(it);
            const tier = stockTier(it.stock, { fine, low });
            const photos = it.images.filter(Boolean);
            const costId = `rs-cost-${it.key}`;
            return (
              <div key={it.key} className={`rs-card${n ? " is-picked" : ""}`}>
                <button type="button" className="rs-photo" disabled={!photos.length} onClick={() => setViewImages(photos)} aria-label={`הגדלת התמונה של ${it.name}`}>
                  {it.kind === "set" ? (
                    <span className="rs-photo-set">
                      {it.images.slice(0, 4).map((src, i) => <span key={i}>{src && <img src={src} alt="" loading="lazy" decoding="async" />}</span>)}
                    </span>
                  ) : photos.length ? <img src={photos[0]} alt="" loading="lazy" decoding="async" /> : <span className="rs-photo-empty">אין תמונה</span>}
                  <span className="rs-badge" style={tier === "ok" ? undefined : { color: TIER_COLOR[tier].fg }}>במלאי {it.stock}</span>
                  {it.kind === "set" && <span className="rs-badge rs-badge-set">סט · {it.members.length} פריטים</span>}
                </button>
                <div className="rs-body">
                  <div>
                    <div className="rs-name">{it.name}</div>
                    <div className="rs-sub">{it.sub}</div>
                  </div>
                  <div className="rs-field">
                    <label htmlFor={costId}>{it.kind === "set" ? "עלות לסט" : "עלות ליחידה"}{savedKey === it.key && <span className="rs-cost-saved" role="status"> ✓ נשמר</span>}</label>
                    <span className="rs-cost">
                      <input
                        id={costId} type="number" min="0" step="any" inputMode="decimal" disabled={!costs}
                        value={costEdits[it.key] ?? costs?.[it.key] ?? ""}
                        placeholder={derived != null ? String(derived) : ""}
                        title={derived != null && costs?.[it.key] == null ? "ריק = סכום עלויות הפריטים בסט" : undefined}
                        onChange={(e) => setCostEdits((ed) => ({ ...ed, [it.key]: e.target.value }))}
                        onBlur={() => commitCost(it.key)}
                        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                      />
                    </span>
                  </div>
                  <div className="rs-stepper">
                    <button type="button" onClick={() => changeQty(it.key, n + 1)} aria-label={`הוספת יחידה של ${it.name}`}>+</button>
                    <input type="number" min="0" max={MAX_QTY} inputMode="numeric" value={n || ""} placeholder="0" onChange={(e) => changeQty(it.key, e.target.value)} aria-label={`כמות להזמנה של ${it.name}`} />
                    <button type="button" onClick={() => changeQty(it.key, n - 1)} disabled={!n} aria-label={`הפחתת יחידה של ${it.name}`}>−</button>
                  </div>
                  <div className="rs-line-total">
                    {n > 0 && (cost != null ? <>סה״כ <b>{fmt(cost * n)}</b></> : costs ? "חסר מחיר עלות" : null)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rs-bar" role="region" aria-label="סיכום ההזמנה">
        <div className="rs-bar-sum">
          <strong>{costs ? fmt(totalCost) : `${units} יח׳`}</strong>
          <span>{lines.length} פריטים · {units} יחידות{missingCost > 0 && costs ? ` · ${missingCost} ללא מחיר עלות` : ""}</span>
        </div>
        <div className="rs-bar-actions">
          <button type="button" className="rs-btn rs-btn-light" disabled={!lines.length} onClick={() => setDoc("order")}>הזמנה לספק (PDF)</button>
          <button type="button" className="rs-btn rs-btn-accent" disabled={!lines.length || !costs} onClick={() => setDoc("costs")}>דוח עלויות (PDF)</button>
          <button type="button" className="rs-btn rs-btn-line" disabled={!lines.length} onClick={clearOrder}>ניקוי</button>
        </div>
      </div>

      {viewImages && <ImageLightbox images={viewImages} onClose={() => setViewImages(null)} />}
      {doc && <RestockDoc type={doc} lines={lines} supplier={supplier.trim()} note={note.trim()} onClose={() => setDoc(null)} />}
    </div>
  );
}

// Full-screen preview of one document; "הדפסה" opens the browser's print
// dialog, where "Save as PDF" produces the file. Portaled to <body> (the
// admin card's backdrop-filter would otherwise trap position:fixed, and the
// print rules in restock.css hide every other child of <body>).
function RestockDoc({ type, lines, supplier, note, onClose }) {
  const sheet = React.useRef(null);
  const isCosts = type === "costs";
  const today = new Date();
  const title = isCosts ? "דוח עלויות להזמנת מלאי" : "הזמנת מלאי";

  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevTitle = document.title;
    document.body.style.overflow = "hidden";
    document.body.classList.add("rs-printing");
    // The print dialog offers the page title as the PDF's file name.
    document.title = `ALFI ${title} ${today.toISOString().slice(0, 10)}`;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("rs-printing");
      document.title = prevTitle;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  // Print only once every photo has loaded, so none comes out blank.
  const print = async () => {
    const imgs = [...(sheet.current?.querySelectorAll("img") || [])];
    await Promise.all(imgs.map((img) => (img.complete ? null : new Promise((done) => { img.onload = img.onerror = done; }))));
    window.print();
  };

  const groups = CATS.map((c) => ({ cat: c, rows: lines.filter((l) => l.category === c) })).filter((g) => g.rows.length);
  const units = lines.reduce((a, l) => a + l.qty, 0);
  const grand = lines.reduce((a, l) => a + (l.total || 0), 0);
  const missing = lines.filter((l) => l.cost == null).length;
  const cols = isCosts ? 6 : 4;
  // The supplier order is labelled in Hebrew and English; the internal
  // cost report in Hebrew only.
  const label = (he, en) => (isCosts ? `${he}:` : `${he} / ${en}`);
  let row = 0;

  const photos = (l) => (
    <div className={`rs-doc-photos${l.kind === "set" ? " is-set" : ""}${isCosts ? " is-compact" : ""}`}>
      {l.images.map((src, i) => (src ? <img key={i} src={src} alt="" /> : <span key={i}>אין תמונה</span>))}
    </div>
  );

  return createPortal(
    <div className="rs-print" role="dialog" aria-modal="true" aria-label={title} dir="rtl">
      <div className="rs-print-bar">
        <p>בחלון ההדפסה בחרו ביעד ״שמירה כ‑PDF״ כדי לקבל קובץ לשליחה.</p>
        <div>
          <button type="button" className="rs-btn rs-btn-light" onClick={print}>הדפסה / שמירה כ‑PDF</button>
          <button type="button" className="rs-btn rs-btn-line" onClick={onClose}>סגירה</button>
        </div>
      </div>

      <div className="rs-sheet" ref={sheet}>
        <div className="rs-doc-head">
          <div className="rs-doc-title">{title}<small>{isCosts ? "לשימוש פנימי" : "Purchase Order"}</small></div>
          <div className="rs-doc-brand">ALFI<small>JEWELRY</small></div>
        </div>
        <div className="rs-doc-meta">
          <span><b><bdi>{label("תאריך", "Date")}</bdi></b> <bdi>{isCosts ? fmtDate(today.toISOString()) : today.toLocaleDateString("en-GB")}</bdi></span>
          {supplier && <span><b><bdi>{label("ספק", "Supplier")}</bdi></b> <bdi>{supplier}</bdi></span>}
          <span><b><bdi>{label("פריטים", "Items")}</bdi></b> <bdi>{lines.length}</bdi></span>
          <span><b><bdi>{label("יחידות", "Units")}</bdi></b> <bdi>{units}</bdi></span>
        </div>
        {note && !isCosts && <div className="rs-doc-note">{note}</div>}

        <table className="rs-table">
          <thead>
            {isCosts ? (
              <tr><th className="rs-num">#</th><th>תמונה</th><th>מוצר</th><th className="rs-e">עלות ליחידה</th><th className="rs-c">כמות</th><th className="rs-e">סה״כ</th></tr>
            ) : (
              <tr><th className="rs-num">#</th><th>תמונה / Photo</th><th>פריט / Item</th><th className="rs-c">כמות / Qty</th></tr>
            )}
          </thead>
          <tbody>
            {groups.map((g) => (
              <React.Fragment key={g.cat}>
                <tr className="rs-group"><td colSpan={cols}>{g.cat} ({g.rows.length})</td></tr>
                {g.rows.map((l) => (
                  <tr key={l.key}>
                    <td className="rs-num">{++row}</td>
                    <td className="rs-ph">{photos(l)}</td>
                    <td>
                      <div className="rs-doc-item">
                        {l.name}
                        {l.kind === "set"
                          ? <small>סט של {l.members.length} פריטים: {l.sub}.{isCosts ? "" : " הכמות היא מספר הסטים השלמים (אותה כמות מכל פריט)."}</small>
                          : <small>{l.sub}</small>}
                      </div>
                    </td>
                    {isCosts && <td className="rs-e">{l.cost == null ? "חסר" : fmt(l.cost)}</td>}
                    <td className={`rs-c${isCosts ? "" : " rs-qty"}`}>{l.qty}</td>
                    {isCosts && <td className="rs-e"><b>{l.total == null ? "—" : fmt(l.total)}</b></td>}
                  </tr>
                ))}
                {isCosts && (
                  <tr className="rs-subtotal">
                    <td colSpan={4}>סה״כ {g.cat}</td>
                    <td className="rs-c">{g.rows.reduce((a, l) => a + l.qty, 0)}</td>
                    <td className="rs-e">{fmt(g.rows.reduce((a, l) => a + (l.total || 0), 0))}</td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {isCosts ? (
          <>
            <div className="rs-doc-total"><span>סה״כ עלות ההזמנה · {lines.length} פריטים · {units} יחידות</span><strong>{fmt(grand)}</strong></div>
            {missing > 0 && <p className="rs-doc-foot">{missing === 1 ? "פריט אחד ללא מחיר עלות אינו כלול בסכום." : `${missing} פריטים ללא מחיר עלות אינם כלולים בסכום.`}</p>}
          </>
        ) : (
          <div className="rs-doc-total"><span>סה״כ / Total</span><span className="rs-doc-sums"><span><bdi>פריטים / Items</bdi> <strong>{lines.length}</strong></span><span><bdi>יחידות / Units</bdi> <strong>{units}</strong></span></span></div>
        )}
      </div>
    </div>,
    document.body
  );
}
