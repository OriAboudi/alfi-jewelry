import React from "react";
import { createPortal } from "react-dom";
import "../../styles/restock.css";
import { css } from "../../lib/css.js";
import { fmtDate } from "../../lib/format.js";
import { useStore } from "../../context/StoreContext.jsx";
import { store } from "../../lib/store.js";
import { CAT_NAMES, CORE_CAT_NAMES, stockTier, TIER_LABEL, TIER_COLOR } from "./shared.jsx";

const SEVERITY = { out: 0, critical: 1, warning: 2, ok: 3 };

export function InventoryTab() {
  const { products, content, refreshProducts } = useStore();
  const low = Number(content.lowStockThreshold ?? 5);
  const fine = Number(content.stockFineThreshold ?? 10);
  const [stockEdits, setStockEdits] = React.useState({});
  const [busyId, setBusyId] = React.useState(null);
  const [showDoc, setShowDoc] = React.useState(false);

  const withTier = products.map((p) => ({ ...p, tier: stockTier(p.stock, { fine, low }) }));

  const totalUnits = withTier.reduce((a, p) => a + (Number(p.stock) || 0), 0);
  const countByTier = { ok: 0, warning: 0, critical: 0, out: 0 };
  withTier.forEach((p) => { countByTier[p.tier]++; });

  const shortages = withTier
    .filter((p) => p.tier !== "ok")
    .slice()
    .sort((a, b) => SEVERITY[a.tier] - SEVERITY[b.tier] || Number(a.stock) - Number(b.stock));

  const byCategory = CORE_CAT_NAMES.map((cat) => {
    const items = withTier.filter((p) => p.category === cat);
    return {
      cat,
      units: items.reduce((a, p) => a + (Number(p.stock) || 0), 0),
      itemCount: items.length,
      shortageCount: items.filter((p) => p.tier !== "ok").length,
    };
  });

  const sortedAll = withTier.slice().sort((a, b) => (a.category || "").localeCompare(b.category || "", "he") || (a.name || "").localeCompare(b.name || "", "he"));

  const adjustStock = async (id, value) => {
    const stock = Math.max(0, Number(value) || 0);
    setBusyId(id);
    try {
      await store.products.update(id, { stock });
      setStockEdits((s) => { const n = { ...s }; delete n[id]; return n; });
      await refreshProducts();
    } catch { alert("עדכון המלאי נכשל"); }
    finally { setBusyId(null); }
  };

  const card = "background:#fff;border:1px solid var(--c-line);border-radius:16px;padding:22px;";
  const statNum = "font-family:var(--font-serif);font-size:30px;font-weight:400;color:var(--c-ink);";
  const statLbl = "font-size:13px;color:var(--c-ink-mute);margin-top:4px;";

  const stockInput = (p) => (
    <div style={css("display:flex;align-items:center;gap:6px;")}>
      <input
        type="number" min="0"
        value={stockEdits[p.id] ?? p.stock}
        onChange={(e) => setStockEdits((s) => ({ ...s, [p.id]: e.target.value }))}
        style={css(`width:64px;padding:7px 8px;border:1px solid ${p.tier === "ok" ? "var(--c-line-strong)" : TIER_COLOR[p.tier].fg};border-radius:8px;font-size:13.5px;text-align:center;color:${p.tier === "ok" ? "var(--c-ink)" : TIER_COLOR[p.tier].fg};`)}
      />
      {String(stockEdits[p.id] ?? "") !== "" && Number(stockEdits[p.id]) !== p.stock && (
        <button onClick={() => adjustStock(p.id, stockEdits[p.id])} disabled={busyId === p.id} style={css("padding:6px 10px;background:var(--c-line-soft);border:none;border-radius:8px;font-size:12px;color:var(--c-accent);font-weight:600;cursor:pointer;")}>עדכון</button>
      )}
    </div>
  );

  return (
    <div>
      <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:20px;")}>
        <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;")}>מלאי</h2>
        <button type="button" className="rs-btn rs-btn-accent" disabled={!products.length} onClick={() => setShowDoc(true)}>ייצוא מלאי ל‑PDF</button>
      </div>

      {/* TOP STATS */}
      <div className="r-grid4" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;")}>
        <div style={css(card)}><div style={css(statNum)}>{totalUnits}</div><div style={css(statLbl)}>סה״כ יחידות במלאי</div></div>
        <div style={css(card + (countByTier.warning ? `border-color:${TIER_COLOR.warning.fg};` : ""))}>
          <div style={css(statNum + (countByTier.warning ? `color:${TIER_COLOR.warning.fg};` : ""))}>{countByTier.warning}</div>
          <div style={css(statLbl)}>מוצרים במלאי כתום</div>
        </div>
        <div style={css(card + (countByTier.critical ? `border-color:${TIER_COLOR.critical.fg};` : ""))}>
          <div style={css(statNum + (countByTier.critical ? `color:${TIER_COLOR.critical.fg};` : ""))}>{countByTier.critical}</div>
          <div style={css(statLbl)}>מוצרים במלאי אדום</div>
        </div>
        <div style={css(card + (countByTier.out ? `border-color:${TIER_COLOR.out.fg};` : ""))}>
          <div style={css(statNum + (countByTier.out ? `color:${TIER_COLOR.out.fg};` : ""))}>{countByTier.out}</div>
          <div style={css(statLbl)}>מוצרים שאזלו</div>
        </div>
      </div>

      {/* PER-CATEGORY SUMMARY */}
      <div style={css("font-size:15px;font-weight:700;color:var(--c-accent);margin-bottom:12px;")}>מלאי לפי קטגוריה</div>
      <div className="r-grid4" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;")}>
        {byCategory.map((c) => (
          <div key={c.cat} style={css(card)}>
            <div style={css("font-size:14.5px;font-weight:700;margin-bottom:8px;")}>{c.cat}</div>
            <div style={css(statNum + "font-size:24px;")}>{c.units} <span style={css("font-size:13px;color:var(--c-ink-mute);font-weight:400;")}>יח׳</span></div>
            <div style={css(statLbl)}>{c.itemCount} מוצרים{c.shortageCount ? ` · ${c.shortageCount} בחוסר` : ""}</div>
          </div>
        ))}
      </div>

      {/* SHORTAGES */}
      {shortages.length > 0 && (
        <div style={css(card + "margin-bottom:28px;")}>
          <div style={css("font-size:15px;font-weight:700;color:var(--c-danger);margin-bottom:14px;")}>⚠ חוסרים הדורשים תשומת לב ({shortages.length})</div>
          {shortages.map((p) => (
            <div key={p.id} style={css("display:flex;align-items:center;gap:14px;justify-content:space-between;font-size:14px;padding:10px 0;border-top:1px solid var(--c-line-soft);flex-wrap:wrap;")}>
              <div style={css("flex:1;min-width:140px;")}>
                <div style={css("font-weight:600;")}>{p.name}</div>
                <div style={css("font-size:12.5px;color:var(--c-ink-mute);")}>{p.category}</div>
              </div>
              <span style={css(`font-size:12px;font-weight:600;padding:4px 10px;border-radius:100px;background:${TIER_COLOR[p.tier].bg};color:${TIER_COLOR[p.tier].fg};white-space:nowrap;`)}>{TIER_LABEL[p.tier]}</span>
              {stockInput(p)}
            </div>
          ))}
        </div>
      )}

      {/* FULL LIST */}
      <div style={css("font-size:15px;font-weight:700;color:var(--c-accent);margin-bottom:12px;")}>כל המוצרים ({sortedAll.length})</div>
      {sortedAll.map((p) => (
        <div key={p.id} className="r-admin-row" style={css("display:flex;align-items:center;gap:14px;background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:12px 16px;margin-bottom:8px;flex-wrap:wrap;")}>
          <div style={css("flex:1;min-width:140px;")}>
            <div style={css("font-size:15px;")}>{p.name}</div>
            <div style={css("font-size:12.5px;color:var(--c-ink-mute);")}>{p.category}</div>
          </div>
          {stockInput(p)}
          <span style={css(`font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:100px;background:${TIER_COLOR[p.tier].bg};color:${TIER_COLOR[p.tier].fg};white-space:nowrap;`)}>{p.tier === "ok" ? "תקין" : TIER_LABEL[p.tier]}</span>
        </div>
      ))}

      {showDoc && <InventoryDoc products={withTier} onClose={() => setShowDoc(false)} />}
    </div>
  );
}

// Printable stock report — same look as the restock documents (restock.css):
// every product with its photo and current quantity, grouped by category with
// a subtotal per category, then a summary of units per category and status.
// "הדפסה" opens the browser's print dialog, where "Save as PDF" makes the file.
function InventoryDoc({ products, onClose }) {
  const sheet = React.useRef(null);
  const today = new Date();
  const title = "דוח מלאי";

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

  const NO_CAT = "ללא קטגוריה";
  const stockOf = (p) => Number(p.stock) || 0;
  const catOf = (p) => p.category || NO_CAT;
  const extraCats = [...new Set(products.map(catOf))].filter((c) => !CAT_NAMES.includes(c));
  const groups = [...CAT_NAMES, ...extraCats].map((cat) => {
    const rows = products.filter((p) => catOf(p) === cat).sort((a, b) => (a.name || "").localeCompare(b.name || "", "he"));
    const tiers = { ok: 0, warning: 0, critical: 0, out: 0 };
    rows.forEach((p) => { tiers[p.tier]++; });
    return { cat, rows, units: rows.reduce((a, p) => a + stockOf(p), 0), tiers };
  }).filter((g) => g.rows.length);

  const units = groups.reduce((a, g) => a + g.units, 0);
  const tierTotals = { ok: 0, warning: 0, critical: 0, out: 0 };
  groups.forEach((g) => { for (const t in tierTotals) tierTotals[t] += g.tiers[t]; });
  const shortageCount = tierTotals.warning + tierTotals.critical + tierTotals.out;
  let row = 0;

  return createPortal(
    <div className="rs-print" role="dialog" aria-modal="true" aria-label={title} dir="rtl">
      <div className="rs-print-bar">
        <p>בחלון ההדפסה בחרו ביעד ״שמירה כ‑PDF״ כדי לקבל קובץ.</p>
        <div>
          <button type="button" className="rs-btn rs-btn-light" onClick={print}>הדפסה / שמירה כ‑PDF</button>
          <button type="button" className="rs-btn rs-btn-line" onClick={onClose}>סגירה</button>
        </div>
      </div>

      <div className="rs-sheet" ref={sheet}>
        <div className="rs-doc-head">
          <div className="rs-doc-title">{title}<small>מצב המלאי הנוכחי</small></div>
          <div className="rs-doc-brand">ALFI<small>JEWELRY</small></div>
        </div>
        <div className="rs-doc-meta">
          <span><b>תאריך:</b> <bdi>{fmtDate(today.toISOString())}</bdi></span>
          <span><b>מוצרים:</b> <bdi>{products.length}</bdi></span>
          <span><b>יחידות במלאי:</b> <bdi>{units}</bdi></span>
          {shortageCount > 0 && <span><b>מוצרים בחוסר:</b> <bdi>{shortageCount}</bdi></span>}
        </div>

        <table className="rs-table">
          <thead>
            <tr><th className="rs-num">#</th><th>תמונה</th><th>מוצר</th><th className="rs-c">סטטוס</th><th className="rs-c">כמות במלאי</th></tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <React.Fragment key={g.cat}>
                <tr className="rs-group"><td colSpan={5}>{g.cat} ({g.rows.length})</td></tr>
                {g.rows.map((p) => (
                  <tr key={p.id}>
                    <td className="rs-num">{++row}</td>
                    <td className="rs-ph">
                      <div className="rs-doc-photos is-compact">
                        {p.image ? <img src={p.image} alt="" /> : <span>אין תמונה</span>}
                      </div>
                    </td>
                    <td>
                      <div className="rs-doc-item">
                        {p.name}
                        <small>{[p.category, p.material, p.set_name ? `סט: ${p.set_name}` : ""].filter(Boolean).join(" · ")}</small>
                      </div>
                    </td>
                    <td className="rs-c">
                      <span className="inv-doc-tier" style={{ background: TIER_COLOR[p.tier].bg, color: TIER_COLOR[p.tier].fg }}>{TIER_LABEL[p.tier]}</span>
                    </td>
                    <td className="rs-c rs-qty" style={p.tier === "ok" ? undefined : { color: TIER_COLOR[p.tier].fg }}>{stockOf(p)}</td>
                  </tr>
                ))}
                <tr className="rs-subtotal">
                  <td colSpan={4}>סה״כ {g.cat}</td>
                  <td className="rs-c">{g.units}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div className="inv-doc-summary">
          <div className="inv-doc-summary-title">סיכום מלאי לפי קטגוריה</div>
          <table className="rs-table">
            <thead>
              <tr>
                <th>קטגוריה</th>
                <th className="rs-c">מוצרים</th>
                <th className="rs-c">תקין</th>
                <th className="rs-c">מלאי נמוך</th>
                <th className="rs-c">מלאי קריטי</th>
                <th className="rs-c">אזל</th>
                <th className="rs-c">יחידות</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.cat}>
                  <td><b>{g.cat}</b></td>
                  <td className="rs-c">{g.rows.length}</td>
                  <td className="rs-c">{g.tiers.ok || "—"}</td>
                  <td className="rs-c">{g.tiers.warning || "—"}</td>
                  <td className="rs-c">{g.tiers.critical || "—"}</td>
                  <td className="rs-c">{g.tiers.out || "—"}</td>
                  <td className="rs-c"><b>{g.units}</b></td>
                </tr>
              ))}
              <tr className="rs-subtotal">
                <td>סה״כ</td>
                <td className="rs-c">{products.length}</td>
                <td className="rs-c">{tierTotals.ok}</td>
                <td className="rs-c">{tierTotals.warning}</td>
                <td className="rs-c">{tierTotals.critical}</td>
                <td className="rs-c">{tierTotals.out}</td>
                <td className="rs-c">{units}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rs-doc-total">
          <span>סה״כ במלאי · {products.length} מוצרים</span>
          <span className="rs-doc-sums"><span>יחידות <strong>{units}</strong></span></span>
        </div>
      </div>
    </div>,
    document.body
  );
}
