import React from "react";
import { css } from "../../lib/css.js";
import { fmt } from "../../lib/format.js";
import { thumb, GRAD_CARD } from "../../lib/ui.js";
import { Disc } from "../../components/Ornaments.jsx";
import { AdminGalleryField } from "../../components/AdminGalleryField.jsx";
import { useStore } from "../../context/StoreContext.jsx";
import { store } from "../../lib/store.js";
import { Field, Area, Overlay, OverlayHeader, Pager, lbl, inp, CAT_NAMES } from "./shared.jsx";

const PAGE_SIZE = 20;

export function ProductsTab() {
  const {
    content, draft, newProduct, editProduct, setDraft, cancelDraft, saveDraft, deleteProduct, refreshProducts,
  } = useStore();
  const threshold = Number(content.lowStockThreshold ?? 5);

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("הכל");
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState([]);
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [stockEdits, setStockEdits] = React.useState({});

  const reload = React.useCallback(() => {
    setLoading(true);
    store.products
      .list({ search: search.trim() || undefined, category: category === "הכל" ? undefined : category, page, pageSize: PAGE_SIZE })
      .then((r) => { setRows(r.rows); setCount(r.count); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category, page]);

  React.useEffect(() => { setPage(1); }, [search, category]);
  React.useEffect(() => { const t = setTimeout(reload, 250); return () => clearTimeout(t); }, [reload]);
  // Product editor overlay just closed (saved or cancelled) — refresh this view either way.
  React.useEffect(() => { if (!draft) reload(); }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps

  const adjustStock = async (id, value) => {
    const stock = Math.max(0, Number(value) || 0);
    try {
      await store.products.update(id, { stock });
      setStockEdits((s) => { const n = { ...s }; delete n[id]; return n; });
      reload();
      refreshProducts();
    } catch { alert("עדכון המלאי נכשל"); }
  };

  const onDelete = async (id) => { await deleteProduct(id); reload(); };

  return (
    <div>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px;")}>
        <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:24px;")}>מוצרים ({count})</h2>
        <button onClick={newProduct} style={css("padding:11px 22px;background:#bd7355;color:#fff;border:none;border-radius:10px;font-size:14.5px;font-weight:600;cursor:pointer;")}>+ מוצר חדש</button>
      </div>

      <div style={css("display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;")}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי שם…" style={css(inp + "max-width:240px;")} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={css(inp + "max-width:160px;cursor:pointer;")}>
          <option value="הכל">כל הקטגוריות</option>
          {CAT_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={css("text-align:center;padding:40px;color:#8a766a;")}>טוען…</div>
      ) : rows.length === 0 ? (
        <div style={css("background:#fff;border:1px dashed #e0cdbd;border-radius:14px;padding:40px;text-align:center;color:#8a766a;")}>לא נמצאו מוצרים.</div>
      ) : rows.map((p) => {
        const low = Number(p.stock) <= threshold;
        return (
          <div key={p.id} className="r-admin-row" style={css("display:flex;align-items:center;gap:18px;background:#fff;border:1px solid #ecdccd;border-radius:14px;padding:14px 18px;margin-bottom:10px;flex-wrap:wrap;")}>
            <div style={thumb(p.image, GRAD_CARD, "width:54px;height:64px;flex:none;border-radius:10px;")}>
              {!p.image && <Disc style="width:54%;aspect-ratio:1;" />}
            </div>
            <div style={css("flex:1;min-width:140px;")}><div style={css("font-family:'Frank Ruhl Libre',serif;font-size:17px;")}>{p.name}</div><div style={css("font-size:13px;color:#8a766a;")}>{p.category} · {p.material}</div></div>
            <div style={css("font-size:16px;font-weight:600;width:90px;")}>{fmt(p.price)}</div>
            <div style={css("display:flex;align-items:center;gap:6px;")}>
              <input
                type="number" min="0"
                value={stockEdits[p.id] ?? p.stock}
                onChange={(e) => setStockEdits((s) => ({ ...s, [p.id]: e.target.value }))}
                style={css(`width:64px;padding:7px 8px;border:1px solid ${low ? "#e7b7a0" : "#e7d8cb"};border-radius:8px;font-size:13.5px;text-align:center;color:${low ? "#a85a44" : "#3a2c25"};`)}
              />
              {String(stockEdits[p.id] ?? "") !== "" && Number(stockEdits[p.id]) !== p.stock && (
                <button onClick={() => adjustStock(p.id, stockEdits[p.id])} style={css("padding:6px 10px;background:#f3e8dd;border:none;border-radius:8px;font-size:12px;color:#bd7355;font-weight:600;cursor:pointer;")}>עדכון</button>
              )}
            </div>
            {p.featured && <span style={css("font-size:12px;background:#fbf1e9;color:#bd7355;padding:4px 10px;border-radius:100px;white-space:nowrap;")}>מוצג בעמוד הבית</span>}
            {low && <span style={css("font-size:12px;background:#fbeae4;color:#a85a44;padding:4px 10px;border-radius:100px;white-space:nowrap;")}>{p.stock === 0 ? "אזל במלאי" : "מלאי נמוך"}</span>}
            <button onClick={() => editProduct(p)} style={css("padding:8px 16px;background:#f3e8dd;color:#3a2c25;border:none;border-radius:9px;font-size:13.5px;font-weight:600;cursor:pointer;")}>עריכה</button>
            <button onClick={() => onDelete(p.id)} style={css("padding:8px 14px;background:none;color:#a85a44;border:1px solid #e7d0c6;border-radius:9px;font-size:13.5px;cursor:pointer;")}>מחיקה</button>
          </div>
        );
      })}

      <Pager page={page} pageSize={PAGE_SIZE} count={count} onPage={setPage} />

      {draft && (
        <Overlay onClose={cancelDraft}>
          <OverlayHeader title={draft._new ? "מוצר חדש" : "עריכת מוצר"} onClose={cancelDraft} />
          <div style={css("display:flex;flex-direction:column;gap:16px;")}>
            <div>
              <label style={css(lbl)}>תמונות המוצר (עד 5)</label>
              <AdminGalleryField images={draft.images} onChange={(images) => setDraft("images", images)} />
            </div>
            <Field label="שם המוצר" value={draft.name} onChange={(v) => setDraft("name", v)} />
            <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:14px;")}>
              <div>
                <label style={css(lbl)}>קטגוריה</label>
                <select value={draft.category} onChange={(e) => setDraft("category", e.target.value)} style={css(inp + "cursor:pointer;")}>
                  {CAT_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Field label="מחיר (₪)" value={draft.price} onChange={(v) => setDraft("price", v)} type="number" />
            </div>
            <Field label="מלאי (יחידות זמינות)" value={draft.stock} onChange={(v) => setDraft("stock", v)} type="number" />
            <Field label="חומר" value={draft.material} onChange={(v) => setDraft("material", v)} />
            <Field label="מידות (מופרדות בפסיק)" value={draft.sizesText} onChange={(v) => setDraft("sizesText", v)} placeholder="S, M, L, XL" />
            <Area label="תיאור" value={draft.description} onChange={(v) => setDraft("description", v)} />
            <label style={css("display:flex;align-items:center;gap:10px;font-size:15px;cursor:pointer;")}>
              <input type="checkbox" checked={!!draft.featured} onChange={(e) => setDraft("featured", e.target.checked)} style={css("width:18px;height:18px;accent-color:#bd7355;cursor:pointer;")} />הצגה בעמוד הבית (נבחרים)
            </label>
            <div style={css("display:flex;gap:12px;margin-top:8px;")}>
              <button onClick={saveDraft} style={css("flex:1;padding:14px;background:#bd7355;color:#fff;border:none;border-radius:11px;font-size:15.5px;font-weight:600;cursor:pointer;")}>שמירה</button>
              <button onClick={cancelDraft} style={css("padding:14px 24px;background:#fff;color:#3a2c25;border:1px solid #e0cdbd;border-radius:11px;font-size:15px;cursor:pointer;")}>ביטול</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
