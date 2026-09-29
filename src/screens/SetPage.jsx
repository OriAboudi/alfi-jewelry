import React, { useEffect, useRef, useState } from "react";
import { css } from "../lib/css.js";
import { fmt, productDetailsText } from "../lib/format.js";
import { buildSets, setTitle, setInStock } from "../lib/pricing.js";
import { pathFor, slugify } from "../lib/routes.js";
import { useStore } from "../context/StoreContext.jsx";
import { useSeoTags } from "../hooks/useSeoTags.js";

/**
 * SetDeck — the set's pieces as a stack of cards: the selected piece in
 * front, the others fanned out behind it. Tapping a card behind, the arrows,
 * a swipe or the arrow keys bring the next piece forward (the front card
 * goes to the back of the deck).
 */
function SetDeck({ members, active, onSelect, setName }) {
  const n = members.length;
  const startX = useRef(null);
  const swiped = useRef(false);
  const step = (dir) => onSelect((active + dir + n) % n);

  const onPointerDown = (e) => { startX.current = e.clientX; swiped.current = false; };
  const onPointerUp = (e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    // A swipe that ends over a card must not also count as a tap on it.
    swiped.current = Math.abs(dx) > 10;
    // RTL: the next piece waits on the left, so a swipe to the right brings it.
    if (Math.abs(dx) > 40) step(dx > 0 ? 1 : -1);
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); step(1); }
    if (e.key === "ArrowRight") { e.preventDefault(); step(-1); }
  };

  return (
    <div
      className="rd-deck"
      role="region"
      aria-roledescription="קרוסלה"
      aria-label={`פריטי ${setTitle(setName)}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { startX.current = null; }}
    >
      {members.map((m, i) => {
        const depth = (i - active + n) % n;
        const front = depth === 0;
        return (
          <button
            key={m.id}
            type="button"
            className={`rd-deck-card${front ? " is-front" : ""}`}
            style={{ "--d": Math.min(depth, 3), zIndex: n - depth }}
            data-hidden={depth > 3 ? "" : undefined}
            onClick={() => { if (!front && !swiped.current) onSelect(i); }}
            tabIndex={front ? -1 : 0}
            aria-label={front ? `${m.name} — מוצג` : `הצגת ${m.name}`}
            aria-current={front ? "true" : undefined}
          >
            {m.image
              ? <img src={m.image} alt={front ? m.name : ""} loading={depth < 2 ? "eager" : "lazy"} decoding="async" draggable="false" />
              : <span className="rd-deck-empty" />}
          </button>
        );
      })}
      <span className="rd-deck-count" aria-hidden="true">{active + 1} מתוך {n}</span>
    </div>
  );
}

/**
 * /סט/<name> — a product set on its own page, laid out like a product page:
 * the pieces as a card deck + thumbnails on one side; on the other the set
 * name, the set price vs. buying separately, every piece, the selected piece's own description, and one "add the set"
 * button.
 */
export function SetPage() {
  const { products, loaded, content: C, pid, go, openProduct, openSet, addToCart } = useStore();
  const sets = Object.values(buildSets(products, C));
  const key = String(pid || "");
  const set = sets.find((s) => s.name === key || slugify(s.name) === key) || null;
  const members = set ? set.members : [];

  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(false);
  useEffect(() => { setActive(0); setAdded(false); }, [set?.name]);

  const piece = members[active] || members[0] || null;
  // No size choice on the set page: each piece goes in with its default size.
  const sizeOf = (m) => (m.sizes && m.sizes[0]) || "יחיד";
  const inStock = members.length > 0 && members.every((m) => Number(m.stock) > 0);
  const save = set ? set.regular - set.price : 0;
  const pct = set && set.regular > 0 ? Math.round((save / set.regular) * 100) : 0;
  const freeShipFrom = Number(C.freeShipFrom || 500);
  const shipFee = Number(C.shipFee || 39);

  const path = set ? pathFor("set", { pid: set.name }) : "/סטים";
  useSeoTags({
    title: set ? `${setTitle(set.name)} · ${members.length} תכשיטי כסף 925 · ALFI` : undefined,
    description: set ? `${setTitle(set.name)}: ${members.map((m) => m.name).join(", ")}. מחיר הסט ${fmt(set.price)} במקום ${fmt(set.regular)}.` : undefined,
    canonical: set ? path : undefined,
    image: members[0]?.image,
    type: "product",
    jsonLd: set ? [{
      "@context": "https://schema.org",
      "@type": "Product",
      name: setTitle(set.name),
      image: members.map((m) => m.image).filter(Boolean),
      brand: { "@type": "Brand", name: "ALFI Jewelry" },
      offers: {
        "@type": "Offer",
        price: set.price,
        priceCurrency: "ILS",
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: `https://alfi-jewelry.com${path}`,
      },
    }] : undefined,
  });

  const addSet = () => {
    if (!inStock) return;
    for (const m of members) addToCart(m.id, 1, sizeOf(m));
    setAdded(true);
    setTimeout(() => setAdded(false), 2600);
  };

  const [openInfo, setOpenInfo] = useState(null);
  const INFO = [
    { key: "how", title: "איך עובד מחיר הסט", body: `כשכל ${members.length} פריטי הסט בעגלה, מחיר הסט מחושב אוטומטית בעגלה ובתשלום.` },
    { key: "shipping", title: "משלוח והחזרות", body: `משלוח חינם בהזמנה מעל ${fmt(freeShipFrom)} (אחרת ${fmt(shipFee)}). ניתן להחזיר תוך 14 יום מקבלת המשלוח, באריזה המקורית.` },
    { key: "care", title: "טיפוח התכשיט", body: "יש להימנע ממגע עם מים, בשמים וכימיקלים. לאחסן בנפרד, בשקית סגורה, הרחק מאור שמש ישיר." },
  ];

  const crumbs = (
    <nav aria-label="ניווט" style={css("font-size:13px;color:var(--c-ink-faint);display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-height:var(--tap);margin-bottom:var(--sp-4);")}>
      <a href={pathFor("home")} onClick={(e) => { e.preventDefault(); go("home"); }}>בית</a>
      <span aria-hidden="true">/</span>
      <a href={pathFor("sets")} onClick={(e) => { e.preventDefault(); go("sets"); }}>סטים</a>
      {set && <><span aria-hidden="true">/</span><span aria-current="page">{setTitle(set.name)}</span></>}
    </nav>
  );

  if (!set || !piece) {
    return (
      <div className="r-container glass-card" style={css("max-width:1240px;margin:30px auto;padding:26px var(--sp-5) 64px;")}>
        {crumbs}
        <div style={css("text-align:center;padding:60px 0;")} aria-live="polite">
          {!loaded ? (
            <p style={css("color:var(--c-ink-mute);")}>טוען את הסט…</p>
          ) : (
            <>
              <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:var(--fs-h1);margin-bottom:12px;")}>הסט לא נמצא</h1>
              <p style={css("color:var(--c-ink-mute);margin-bottom:24px;")}>ייתכן שהוא כבר לא זמין באתר.</p>
              <button type="button" onClick={() => go("sets")} className="btn btn-primary">לכל הסטים</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const otherSets = sets.filter((s) => s.name !== set.name && setInStock(s));

  return (
    <div className="r-container glass-card" style={css("max-width:1240px;margin:30px auto;padding:26px var(--sp-5) 64px;")}>
      {crumbs}
      <div className="r-product-grid rd-setpage-grid">
        {/* ---- the deck + every piece at a glance ---- */}
        <div style={css("min-width:0;")}>
          <SetDeck members={members} active={active} onSelect={setActive} setName={set.name} />
          <div className="rd-deck-thumbs" role="tablist" aria-label="בחירת פריט">
            {members.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={`rd-deck-thumb${i === active ? " is-on" : ""}`}
              >
                <span className="rd-deck-thumb-img">{m.image ? <img src={m.image} alt="" loading="lazy" decoding="async" /> : null}</span>
                <span className="rd-deck-thumb-name">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ---- set info ---- */}
        <div className="r-sticky" style={css("position:sticky;top:100px;min-width:0;")}>
          <div style={css("font-size:12.5px;letter-spacing:.16em;color:var(--c-accent-dark);font-weight:600;margin-bottom:6px;")}>סט · {members.length} פריטים</div>
          <h1 style={css("font-family:var(--font-serif);font-weight:300;font-size:clamp(30px, 3vw, 40px);line-height:1.15;margin:0 0 12px;")}>{setTitle(set.name)}</h1>
          <div style={css("display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 12px;margin-bottom:6px;")}>
            <span style={css("font-size:26px;color:var(--c-accent);font-weight:700;")}>{fmt(set.price)}</span>
            {save > 0 && <s style={css("font-size:17px;color:var(--c-ink-faint);")}>{fmt(set.regular)}</s>}
            {save > 0 && <span style={css("font-size:12.5px;font-weight:700;color:var(--c-success);background:var(--c-success-bg);padding:3px 10px;border-radius:100px;")}>חיסכון {fmt(save)} ({pct}%)</span>}
          </div>
          <div style={css("font-size:13.5px;color:var(--c-ink-mute);margin-bottom:20px;")}>מחיר לכל הסט · בנפרד {fmt(set.regular)}</div>

          <div style={css("font-size:12.5px;font-weight:700;color:var(--c-ink-mute);margin-bottom:8px;letter-spacing:.04em;")}>מה בסט</div>
          <ul className="rd-setpage-list">
            {members.map((m, i) => {
              const out = Number(m.stock) <= 0;
              return (
                <li key={m.id} className={i === active ? "is-on" : undefined}>
                  <button type="button" onClick={() => setActive(i)} className="rd-setpage-row" aria-pressed={i === active}>
                    <span className="rd-setpage-row-img">{m.image ? <img src={m.image} alt="" loading="lazy" decoding="async" /> : null}</span>
                    <span style={css("display:flex;flex-direction:column;gap:2px;min-width:0;")}>
                      <span style={css("font-size:15px;color:var(--c-ink);")}>{m.name}</span>
                      <span style={css(`font-size:12.5px;color:${out ? "var(--c-danger)" : "var(--c-ink-mute)"};`)}>{out ? "אזל במלאי" : `בנפרד ${fmt(m.price)}`}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* The selected piece's own story — changes with the deck. */}
          <div key={piece.id} className="rd-setpage-piece" aria-live="polite">
            <div style={css("display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:6px;")}>
              <h2 className="serif" style={css("margin:0;font-weight:400;font-size:20px;")}>{piece.name}</h2>
              <a href={pathFor("product", { pid: piece.id, products })} onClick={(e) => { e.preventDefault(); openProduct(piece.id); }} style={css("font-size:13px;color:var(--c-accent-dark);text-decoration:underline;text-underline-offset:3px;")}>לעמוד הפריט</a>
            </div>
            {piece.description && <p style={css("font-family:var(--font-serif);font-weight:300;font-size:16px;line-height:1.65;color:var(--c-ink-soft);margin:0 0 8px;max-width:46ch;")}>{piece.description}</p>}
            <p style={css("font-size:13.5px;line-height:1.6;color:var(--c-ink-mute);margin:0;")}>{productDetailsText(piece)}</p>
          </div>

          <button type="button" onClick={addSet} disabled={!inStock} className="btn btn-primary" style={css(`width:100%;font-size:16px;margin:18px 0 14px;${!inStock ? "background:var(--c-danger-bg);color:var(--c-danger);" : ""}`)}>
            {!inStock ? "אחד מפריטי הסט אזל" : added ? "✓ הסט נוסף לעגלה" : `הוספת הסט לעגלה · ${fmt(set.price)}`}
          </button>
          <div aria-live="polite" style={css("position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);")}>{added ? "הסט נוסף לעגלה" : ""}</div>

          <div style={css("display:flex;flex-wrap:wrap;gap:6px 16px;")}>
            {["תשלום מאובטח", "14 יום החזרות", "כסף סטרלינג 925"].map((t) => (
              <span key={t} style={css("font-size:12.5px;color:var(--c-ink-mute);")}>✓ {t}</span>
            ))}
          </div>

          <div style={css("border-top:1px solid var(--c-line);margin-top:16px;")}>
            {INFO.map((s) => {
              const open = openInfo === s.key;
              return (
                <div key={s.key} style={css("border-bottom:1px solid var(--c-line);")}>
                  <button onClick={() => setOpenInfo(open ? null : s.key)} aria-expanded={open} className="tap-target" style={css("width:100%;background:none;border:none;padding:14px 0;display:flex;justify-content:space-between;align-items:center;font-size:14.5px;font-weight:500;cursor:pointer;color:var(--c-ink);text-align:right;")}>
                    {s.title}<span style={css(`color:var(--c-accent);font-size:20px;line-height:1;transition:transform var(--dur) var(--ease);transform:rotate(${open ? "45deg" : "0"});`)}>+</span>
                  </button>
                  {open && <p style={css("padding:0 0 14px;font-size:14px;color:var(--c-ink-soft);line-height:1.7;")}>{s.body}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {otherSets.length > 0 && (
        <div style={css("margin-top:64px;")}>
          <h2 style={css("font-family:var(--font-serif);font-weight:400;font-size:var(--fs-h1);margin-bottom:var(--sp-5);")}>סטים נוספים</h2>
          <div style={css("display:flex;flex-wrap:wrap;gap:14px;")}>
            {otherSets.map((s) => (
              <a key={s.name} href={pathFor("set", { pid: s.name })} onClick={(e) => { e.preventDefault(); openSet(s.name); }} className="rd-setpage-other glass-strong">
                <span className="rd-setpage-row-img">{s.members[0]?.image ? <img src={s.members[0].image} alt="" loading="lazy" decoding="async" /> : null}</span>
                <span>{setTitle(s.name)}<br /><b style={css("color:var(--c-accent);")}>{fmt(s.price)}</b></span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
