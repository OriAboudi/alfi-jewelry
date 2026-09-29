import React from "react";
import { css } from "../../lib/css.js";
import { fmt } from "../../lib/format.js";
import { thumb } from "../../lib/ui.js";
import { store } from "../../lib/store.js";
import { useStore } from "../../context/StoreContext.jsx";
import { lbl, inp } from "./shared.jsx";

// Admin "סטים": every set in one place. A set = products sharing a set_name;
// its price is content.setPrices[name]. From here the admin sees each set's
// pieces, the separate total vs. the set price (and the saving), adds or
// removes pieces, sets the price, creates or dissolves a set. A set is live
// on the site once it has 2+ pieces and a price.
const btn = "padding:9px 16px;border-radius:9px;font-size:13.5px;font-weight:600;cursor:pointer;";
const btnPrimary = btn + "background:var(--c-accent-fill);color:#fff;border:none;";
const btnGhost = btn + "background:none;color:var(--c-danger);border:1px solid var(--c-line-strong);";

export function SetsTab() {
  const { products, content, refreshProducts, saveContentPatch } = useStore();
  const prices = content.setPrices || {};
  const [priceDraft, setPriceDraft] = React.useState({});
  const [busy, setBusy] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [newPick, setNewPick] = React.useState([]);
  const [newPrice, setNewPrice] = React.useState("");
  const [query, setQuery] = React.useState("");       // filters the sets list
  const [pickQuery, setPickQuery] = React.useState(""); // filters "סט חדש" pieces
  const [addDraft, setAddDraft] = React.useState({});  // per-set "add a piece" field

  const sets = Object.values(products.reduce((acc, p) => {
    const n = String(p.set_name || "").trim();
    if (n) (acc[n] ||= { name: n, members: [] }).members.push(p);
    return acc;
  }, {})).sort((a, b) => a.name.localeCompare(b.name, "he"));
  const free = products.filter((p) => !String(p.set_name || "").trim());

  // Search: a set matches by its own name or any piece's name; the new-set
  // picker matches a piece by name, category or collection.
  const norm = (s) => String(s || "").toLowerCase().replace(/["״׳']/g, "").trim();
  const q = norm(query);
  const shownSets = q ? sets.filter((s) => norm(s.name).includes(q) || s.members.some((m) => norm(m.name).includes(q))) : sets;
  const pq = norm(pickQuery);
  const shownFree = pq ? free.filter((p) => [p.name, p.category, p.collection].some((v) => norm(v).includes(pq))) : free;
  // The "add a piece" field is a native searchable list (datalist): typing
  // filters it; choosing an entry adds that piece.
  const optionLabel = (p) => `${p.name} · ${fmt(p.price)}`;
  const onAddInput = (name, value) => {
    const hit = free.find((p) => optionLabel(p) === value);
    if (hit) { setAddDraft((d) => ({ ...d, [name]: "" })); addMember(name, hit.id); }
    else setAddDraft((d) => ({ ...d, [name]: value }));
  };

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(""), 2500); };
  const run = async (key, fn, done) => {
    setBusy(key);
    try { await fn(); if (done) flash(done); } catch (e) { alert("השמירה נכשלה: " + (e.message || "")); } finally { setBusy(""); }
  };
  const setMember = (id, name) => store.products.update(id, { set_name: name || null });

  const savePrice = (name) => run(`price:${name}`, async () => {
    const v = Number(priceDraft[name] ?? prices[name]);
    await saveContentPatch({ setPrices: { ...prices, [name]: v > 0 ? v : 0 } });
  }, "מחיר הסט נשמר");
  const addMember = (name, id) => id && run(`add:${name}`, async () => { await setMember(id, name); await refreshProducts(); }, "הפריט נוסף לסט");
  const removeMember = (name, id) => run(`rm:${id}`, async () => { await setMember(id, null); await refreshProducts(); });
  const dissolve = (set) => {
    if (!confirm(`לפרק את סט ״${set.name}״? הפריטים יישארו בחנות, רק בלי הסט.`)) return;
    run(`del:${set.name}`, async () => {
      for (const m of set.members) await setMember(m.id, null);
      const next = { ...prices }; delete next[set.name];
      await saveContentPatch({ setPrices: next });
      await refreshProducts();
    }, "הסט פורק");
  };
  const create = () => {
    const name = newName.trim();
    if (!name) return alert("יש לתת שם לסט");
    if (sets.some((s) => s.name === name)) return alert("כבר קיים סט בשם הזה");
    if (newPick.length < 2) return alert("בחרו לפחות 2 פריטים לסט");
    run("create", async () => {
      for (const id of newPick) await setMember(id, name);
      if (Number(newPrice) > 0) await saveContentPatch({ setPrices: { ...prices, [name]: Number(newPrice) } });
      await refreshProducts();
      setNewName(""); setNewPick([]); setNewPrice("");
    }, "הסט נוצר");
  };

  return (
    <div>
      <div style={css("display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:10px;margin-bottom:6px;")}>
        <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:24px;")}>סטים ({sets.length})</h2>
        {msg && <span role="status" style={css("font-size:13.5px;color:var(--c-success);font-weight:600;")}>✓ {msg}</span>}
      </div>
      <p style={css("font-size:14px;color:var(--c-ink-mute);margin-bottom:22px;line-height:1.6;")}>
        סט מוצג באתר (בעמוד הבית ובעמוד ״סטים״) כשיש בו לפחות 2 פריטים ומחיר. כשלקוח מכניס לעגלה את כל פריטי הסט, מחיר הסט מחושב אוטומטית בעגלה ובתשלום.
      </p>

      {sets.length > 0 && (
        <div style={css("position:relative;max-width:420px;margin-bottom:18px;")}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש סט או פריט…"
            aria-label="חיפוש סטים לפי שם הסט או שם פריט"
            style={css(inp + "padding-left:38px;")}
          />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={css("position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--c-ink-mute);pointer-events:none;")}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          {q && <div role="status" style={css("font-size:12.5px;color:var(--c-ink-mute);margin-top:6px;")}>{shownSets.length ? `${shownSets.length} מתוך ${sets.length} סטים` : "לא נמצא סט מתאים"}</div>}
        </div>
      )}

      {shownSets.map((s) => {
        const regular = s.members.reduce((a, m) => a + (Number(m.price) || 0), 0);
        const price = Number(prices[s.name]) || 0;
        const live = s.members.length >= 2 && price > 0;
        const draft = priceDraft[s.name] ?? (price || "");
        const save = regular - (Number(draft) || 0);
        return (
          <div key={s.name} style={css("background:#fff;border:1px solid var(--c-line);border-radius:14px;padding:18px;margin-bottom:14px;")}>
            <div style={css("display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;")}>
              <div style={css("display:flex;align-items:center;gap:10px;")}>
                <span style={css("font-family:var(--font-serif);font-size:20px;")}>סט {s.name}</span>
                <span style={css(`font-size:12px;padding:4px 10px;border-radius:100px;${live ? "background:var(--c-success-bg);color:var(--c-success);" : "background:var(--c-warning-bg, #f6ecd9);color:var(--c-warning, #8a5a14);"}`)}>
                  {live ? "פעיל באתר" : s.members.length < 2 ? "חסר פריט נוסף" : "חסר מחיר"}
                </span>
              </div>
              <button type="button" onClick={() => dissolve(s)} disabled={!!busy} style={css(btnGhost)}>פירוק הסט</button>
            </div>

            <div style={css("display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px;")}>
              {s.members.map((m) => (
                <div key={m.id} style={css("display:flex;align-items:center;gap:10px;border:1px solid var(--c-line);border-radius:12px;padding:6px 8px 6px 12px;")}>
                  <div style={thumb(m.image, undefined, "width:44px;height:44px;flex:none;border-radius:8px;")} />
                  <div style={css("font-size:14px;line-height:1.3;")}>{m.name}<div style={css("font-size:12.5px;color:var(--c-ink-mute);")}>{fmt(m.price)}</div></div>
                  <button type="button" onClick={() => removeMember(s.name, m.id)} disabled={!!busy} aria-label={`הסרת ${m.name} מהסט`} title="הסרה מהסט" style={css("width:30px;height:30px;border:none;border-radius:8px;background:var(--c-line-soft);cursor:pointer;color:var(--c-danger);")}>✕</button>
                </div>
              ))}
              <input
                list="sets-free-products"
                value={addDraft[s.name] || ""}
                onChange={(e) => onAddInput(s.name, e.target.value)}
                disabled={!!busy || !free.length}
                placeholder={free.length ? "+ הוספת פריט (הקלידי לחיפוש)" : "אין פריטים פנויים"}
                aria-label={`הוספת פריט לסט ${s.name}, הקלידי לחיפוש`}
                style={css(inp + "width:auto;min-width:240px;")}
              />
            </div>

            <div style={css("display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;")}>
              <div>
                <label style={css(lbl)}>מחיר הסט (₪)</label>
                <input type="number" min="0" value={draft} onChange={(e) => setPriceDraft((d) => ({ ...d, [s.name]: e.target.value }))} style={css(inp + "width:140px;")} />
              </div>
              <button type="button" onClick={() => savePrice(s.name)} disabled={!!busy} style={css(btnPrimary + "height:46px;")}>{busy === `price:${s.name}` ? "שומר…" : "שמירת מחיר"}</button>
              <div style={css("font-size:13.5px;color:var(--c-ink-mute);padding-bottom:12px;")}>
                בנפרד {fmt(regular)}
                {Number(draft) > 0 && (save > 0
                  ? <span style={css("color:var(--c-success);font-weight:600;")}> · חיסכון ללקוח {fmt(save)}</span>
                  : <span style={css("color:var(--c-danger);")}> · מחיר הסט לא נמוך מהמחיר בנפרד</span>)}
              </div>
            </div>
          </div>
        );
      })}

      <datalist id="sets-free-products">
        {free.map((p) => <option key={p.id} value={optionLabel(p)} />)}
      </datalist>

      <div style={css("background:var(--c-line-soft);border-radius:14px;padding:18px;margin-top:22px;")}>
        <div style={css("font-size:16px;font-weight:700;margin-bottom:12px;")}>סט חדש</div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:12px;")}>
          <div><label style={css(lbl)}>שם הסט</label><input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="לדוגמה: פרח" style={css(inp)} /></div>
          <div><label style={css(lbl)}>מחיר הסט (₪)</label><input type="number" min="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={css(inp)} /></div>
        </div>
        <label style={css(lbl)}>פריטים ({newPick.length} נבחרו · בנפרד {fmt(newPick.reduce((a, id) => a + (Number(products.find((p) => String(p.id) === String(id))?.price) || 0), 0))})</label>
        <input
          type="search"
          value={pickQuery}
          onChange={(e) => setPickQuery(e.target.value)}
          placeholder="חיפוש פריט לפי שם, קטגוריה או קולקציה…"
          aria-label="חיפוש פריטים לסט החדש"
          style={css(inp + "max-width:420px;margin-bottom:10px;")}
        />
        <div style={css("display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;max-height:220px;overflow:auto;")}>
          {pq && shownFree.length === 0 && <span style={css("font-size:13px;color:var(--c-ink-mute);")}>לא נמצא פריט מתאים</span>}
          {/* Picked pieces stay visible even when the search hides them. */}
          {[...free.filter((p) => newPick.includes(p.id) && !shownFree.includes(p)), ...shownFree].map((p) => {
            const on = newPick.includes(p.id);
            return (
              <button key={p.id} type="button" aria-pressed={on} onClick={() => setNewPick((l) => (on ? l.filter((x) => x !== p.id) : [...l, p.id]))} style={css(`display:flex;align-items:center;gap:8px;padding:6px 12px 6px 8px;border-radius:100px;cursor:pointer;font-size:13.5px;border:1.5px solid ${on ? "var(--c-accent)" : "var(--c-line-strong)"};background:${on ? "#fff" : "transparent"};`)}>
                <span style={thumb(p.image, undefined, "width:26px;height:26px;border-radius:50%;flex:none;")} />
                {p.name}
              </button>
            );
          })}
        </div>
        <button type="button" onClick={create} disabled={!!busy} style={css(btnPrimary)}>{busy === "create" ? "יוצר…" : "יצירת הסט"}</button>
      </div>
    </div>
  );
}
