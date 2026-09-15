import React from "react";
import { css } from "../lib/css.js";
import { fmt, fmtDate } from "../lib/format.js";
import { thumb, GRAD_CARD } from "../lib/ui.js";
import { Disc } from "../components/Ornaments.jsx";
import { AdminImageField } from "../components/AdminImageField.jsx";
import { AdminGalleryField } from "../components/AdminGalleryField.jsx";
import { useStore } from "../context/StoreContext.jsx";

const ADMIN_TABS = [
  ["products", "מוצרים"],
  ["collections", "קולקציות"],
  ["content", "תוכן האתר"],
  ["orders", "הזמנות"],
  ["users", "משתמשים"],
  ["payments", "בדיקות תשלום"],
];
const STATUS_OPTS = ["התקבלה", "בהכנה", "נשלחה", "בדרך", "נמסר", "בוטלה"];
const CAT_NAMES = ["טבעות", "שרשראות", "עגילים", "צמידים"];

const lbl = "display:block;font-size:13px;font-weight:600;color:#8a766a;margin-bottom:7px;";
const inp = "width:100%;padding:12px 14px;border:1px solid #e7d8cb;border-radius:11px;font-size:15px;background:#fff;";
const ta = inp + "resize:vertical;";

function Field({ label, value, onChange, type, placeholder }) {
  return (
    <div>
      <label style={css(lbl)}>{label}</label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} type={type || "text"} placeholder={placeholder} style={css(inp)} />
    </div>
  );
}
function Area({ label, value, onChange, rows = 3, placeholder }) {
  return (
    <div>
      <label style={css(lbl)}>{label}</label>
      <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} style={css(ta)} />
    </div>
  );
}

export function Admin() {
  const {
    adminTab, products, collections, content: C, allOrders, users, cdraft, contentSaved,
    draft, draftCol, user, BACKEND, createTestPayment, testPaymentBusy,
    setTab, newProduct, editProduct, deleteProduct, setDraft, saveDraft, cancelDraft,
    newCollection, editCollection, deleteCollection, setDraftCol, saveCol, cancelCol,
    setCdraft, saveContent, setOrderStatus, logout,
  } = useStore();

  const cd = cdraft || C;
  const [testAmount, setTestAmount] = React.useState("5");
  const [orderView, setOrderView] = React.useState(null);

  return (
    <div className="r-container" style={css("max-width:1180px;margin:30px auto;padding:40px;background:rgba(250,245,239,.82);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);border-radius:22px;box-shadow:0 24px 70px rgba(70,50,40,.12);")}>
      <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:10px;")}>
        <h1 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:300;font-size:38px;")}>מערכת ניהול</h1>
        <span style={css("font-size:13.5px;color:#8a766a;")}>מחובר כ‑{user ? user.name : ""} · <span onClick={logout} style={css("color:#a85a44;cursor:pointer;")}>יציאה</span></span>
      </div>
      <p style={css("font-size:14.5px;color:#8a766a;margin-bottom:24px;")}>כל שינוי נשמר מיידית. במצב מסד אמיתי — נשמר בענן.</p>

      <div style={css("display:flex;gap:8px;margin-bottom:28px;border-bottom:1px solid #ecdccd;padding-bottom:0;overflow-x:auto;")}>
        {ADMIN_TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={css(`border:none;background:none;cursor:pointer;font-size:15px;font-weight:600;padding:12px 18px;color:${adminTab === k ? "#bd7355" : "#8a766a"};border-bottom:2px solid ${adminTab === k ? "#bd7355" : "transparent"};`)}>{label}</button>
        ))}
      </div>

      {/* PRODUCTS */}
      {adminTab === "products" && (
        <div>
          <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;")}>
            <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:24px;")}>מוצרים ({products.length})</h2>
            <button onClick={newProduct} style={css("padding:11px 22px;background:#bd7355;color:#fff;border:none;border-radius:10px;font-size:14.5px;font-weight:600;cursor:pointer;")}>+ מוצר חדש</button>
          </div>
          {products.map((p) => (
            <div key={p.id} className="r-admin-row" style={css("display:flex;align-items:center;gap:18px;background:#fff;border:1px solid #ecdccd;border-radius:14px;padding:14px 18px;margin-bottom:10px;")}>
              <div style={thumb(p.image, GRAD_CARD, "width:54px;height:64px;flex:none;border-radius:10px;")}>
                {!p.image && <Disc style="width:54%;aspect-ratio:1;" />}
              </div>
              <div style={css("flex:1;")}><div style={css("font-family:'Frank Ruhl Libre',serif;font-size:17px;")}>{p.name}</div><div style={css("font-size:13px;color:#8a766a;")}>{p.category} · {p.material}</div></div>
              <div style={css("font-size:16px;font-weight:600;width:90px;")}>{fmt(p.price)}</div>
              {p.featured && <span style={css("font-size:12px;background:#fbf1e9;color:#bd7355;padding:4px 10px;border-radius:100px;")}>מוצג בעמוד הבית</span>}
              <button onClick={() => editProduct(p)} style={css("padding:8px 16px;background:#f3e8dd;color:#3a2c25;border:none;border-radius:9px;font-size:13.5px;font-weight:600;cursor:pointer;")}>עריכה</button>
              <button onClick={() => deleteProduct(p.id)} style={css("padding:8px 14px;background:none;color:#a85a44;border:1px solid #e7d0c6;border-radius:9px;font-size:13.5px;cursor:pointer;")}>מחיקה</button>
            </div>
          ))}
        </div>
      )}

      {/* COLLECTIONS */}
      {adminTab === "collections" && (
        <div>
          <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;")}>
            <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:24px;")}>קולקציות ({collections.length})</h2>
            <button onClick={newCollection} style={css("padding:11px 22px;background:#bd7355;color:#fff;border:none;border-radius:10px;font-size:14.5px;font-weight:600;cursor:pointer;")}>+ קולקציה חדשה</button>
          </div>
          {collections.map((c) => (
            <div key={c.id} className="r-admin-row" style={css("display:flex;align-items:center;gap:18px;background:#fff;border:1px solid #ecdccd;border-radius:14px;padding:14px 18px;margin-bottom:10px;")}>
              <div style={thumb(c.image, GRAD_CARD, "width:60px;height:48px;flex:none;border-radius:10px;")}>
                {!c.image && <Disc style="width:50%;aspect-ratio:1;" />}
              </div>
              <div style={css("flex:1;")}><div style={css("font-family:'Frank Ruhl Libre',serif;font-size:17px;")}>{c.title}</div><div style={css("font-size:13px;color:#8a766a;")}>{c.subtitle}</div></div>
              <button onClick={() => editCollection(c)} style={css("padding:8px 16px;background:#f3e8dd;color:#3a2c25;border:none;border-radius:9px;font-size:13.5px;font-weight:600;cursor:pointer;")}>עריכה</button>
              <button onClick={() => deleteCollection(c.id)} style={css("padding:8px 14px;background:none;color:#a85a44;border:1px solid #e7d0c6;border-radius:9px;font-size:13.5px;cursor:pointer;")}>מחיקה</button>
            </div>
          ))}
        </div>
      )}

      {/* CONTENT */}
      {adminTab === "content" && (
        <div style={css("max-width:760px;")}>
          <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:24px;margin-bottom:20px;")}>תוכן האתר</h2>
          <div style={css("display:flex;flex-direction:column;gap:18px;")}>
            <Field label="תווית באנר (Hero)" value={cd.heroBadge} onChange={(v) => setCdraft("heroBadge", v)} />
            <Field label="טקסט כפתור הבאנר" value={cd.heroCtaLabel} onChange={(v) => setCdraft("heroCtaLabel", v)} />
            <div><label style={css(lbl)}>תמונת באנר עמוד הבית</label><AdminImageField value={cd.heroImage} onChange={(v) => setCdraft("heroImage", v)} /></div>
            <div style={css("height:1px;background:#ecdccd;margin:6px 0;")} />
            <Field label="כותרת מקטע נבחרים" value={cd.featuredTitle} onChange={(v) => setCdraft("featuredTitle", v)} />
            <Field label="כותרת מקטע ״הסיפור שלנו״" value={cd.aboutTitle} onChange={(v) => setCdraft("aboutTitle", v)} />
            <Area label="טקסט ״הסיפור שלנו״ (תקציר בעמוד הבית)" value={cd.aboutText} onChange={(v) => setCdraft("aboutText", v)} />

            <div style={css("height:1px;background:#ecdccd;margin:6px 0;")} />
            <div style={css("font-size:15px;font-weight:700;color:#bd7355;")}>עמוד ״הסיפור שלנו״</div>
            <Field label="כותרת ראשית" value={cd.storyTitle} onChange={(v) => setCdraft("storyTitle", v)} />
            <div><label style={css(lbl)}>תמונת ראש העמוד</label><AdminImageField value={cd.storyHeroImage} onChange={(v) => setCdraft("storyHeroImage", v)} /></div>
            <Area label="פסקת פתיחה" value={cd.storyLead} onChange={(v) => setCdraft("storyLead", v)} rows={2} />
            <Area label="גוף הסיפור" value={cd.storyBody} onChange={(v) => setCdraft("storyBody", v)} />
            <Field label="ציטוט" value={cd.storyQuote} onChange={(v) => setCdraft("storyQuote", v)} />
            <div className="r-grid3" style={css("display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;")}>
              {[1, 2, 3].map((n) => (
                <div key={n}>
                  <label style={css(lbl)}>ערך {n} · כותרת</label>
                  <input value={cd["value" + n + "Title"] ?? ""} onChange={(e) => setCdraft("value" + n + "Title", e.target.value)} style={css(inp + "margin-bottom:8px;")} />
                  <textarea value={cd["value" + n + "Text"] ?? ""} onChange={(e) => setCdraft("value" + n + "Text", e.target.value)} rows={3} placeholder="תיאור" style={css(ta)} />
                </div>
              ))}
            </div>
            <Field label="כותרת ״התהליך״" value={cd.processTitle} onChange={(v) => setCdraft("processTitle", v)} />
            <Area label="טקסט ״התהליך״" value={cd.processText} onChange={(v) => setCdraft("processText", v)} rows={2} />
            <div style={css("height:1px;background:#ecdccd;margin:6px 0;")} />

            <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
              <Field label="משלוח חינם מעל (₪)" value={cd.freeShipFrom} onChange={(v) => setCdraft("freeShipFrom", v)} type="number" />
              <Field label="דמי משלוח (₪)" value={cd.shipFee} onChange={(v) => setCdraft("shipFee", v)} type="number" />
            </div>
            <div style={css("display:flex;gap:12px;margin-top:8px;")}>
              <button onClick={saveContent} style={css("padding:13px 28px;background:#bd7355;color:#fff;border:none;border-radius:11px;font-size:15px;font-weight:600;cursor:pointer;")}>שמירת שינויים</button>
              {contentSaved && <span style={css("align-self:center;color:#6f8556;font-size:14px;font-weight:600;")}>✓ נשמר</span>}
            </div>
          </div>
        </div>
      )}

      {/* ORDERS */}
      {adminTab === "orders" && (
        <div>
          <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:24px;margin-bottom:20px;")}>הזמנות ({allOrders.length})</h2>
          {allOrders.length === 0 && <div style={css("background:#fff;border:1px dashed #e0cdbd;border-radius:14px;padding:40px;text-align:center;color:#8a766a;")}>אין הזמנות עדיין.</div>}
          {allOrders.map((o) => {
            const qty = (o.items || []).reduce((a, it) => a + (it.qty || 0), 0);
            const cust = (o.shipping_address && ((o.shipping_address.first || "") + " " + (o.shipping_address.last || "")).trim()) || "אורח";
            return (
              <div key={o.id} className="r-admin-row" style={css(`background:#fff;border:1px solid ${o.is_test ? "#e0cdbd" : "#ecdccd"};border-radius:14px;padding:18px 20px;margin-bottom:10px;display:flex;align-items:center;gap:18px;${o.is_test ? "opacity:.7;" : ""}`)}>
                {o.is_test && <span style={css("font-size:11px;font-weight:700;padding:4px 9px;border-radius:100px;background:#f3e8dd;color:#8a766a;white-space:nowrap;")}>TEST</span>}
                <div style={css("flex:1;")}><div style={css("font-weight:600;font-size:15.5px;")}>{o.number}</div><div style={css("font-size:13px;color:#8a766a;")}>{fmtDate(o.created_at)} · {cust}</div></div>
                <div style={css("font-size:14px;color:#6e5648;")}>{qty} פריטים</div>
                <span style={css(`font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:100px;white-space:nowrap;background:${o.payment_status === "paid" ? "#eaf0e3" : "#fbeae4"};color:${o.payment_status === "paid" ? "#6f8556" : "#a85a44"};`)}>
                  {o.payment_status === "paid" ? "שולם" : "טרם שולם"}
                </span>
                <div style={css("font-size:16px;font-weight:600;width:90px;")}>{fmt(o.total)}</div>
                <select value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)} style={css("padding:8px 12px;border:1px solid #e7d8cb;border-radius:9px;font-size:13.5px;background:#fff;cursor:pointer;color:#3a2c25;")}>
                  {STATUS_OPTS.map((sname) => <option key={sname} value={sname}>{sname}</option>)}
                </select>
                <button onClick={() => setOrderView(o)} style={css("padding:8px 14px;background:#f3e8dd;border:none;border-radius:9px;font-size:13.5px;color:#bd7355;font-weight:600;cursor:pointer;white-space:nowrap;")}>פרטים</button>
              </div>
            );
          })}
        </div>
      )}

      {/* USERS */}
      {adminTab === "users" && (
        <div>
          <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:24px;margin-bottom:20px;")}>משתמשים רשומים ({users.length})</h2>
          {users.map((u) => (
            <div key={u.id || u.email} className="r-admin-row" style={css("background:#fff;border:1px solid #ecdccd;border-radius:14px;padding:16px 20px;margin-bottom:10px;display:flex;align-items:center;gap:16px;")}>
              <div style={css("width:42px;height:42px;border-radius:50%;background:#f3e8dd;color:#bd7355;display:flex;align-items:center;justify-content:center;font-size:17px;font-family:'Frank Ruhl Libre',serif;")}>{(u.name || u.email || "?").trim().charAt(0)}</div>
              <div style={css("flex:1;")}><div style={css("font-weight:600;font-size:15px;")}>{u.name || "—"}</div><div style={css("font-size:13px;color:#8a766a;")}>{u.email || ""}</div></div>
              <span style={css(`font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:100px;background:${u.role === "admin" ? "#fbf1e9" : "#f3e8dd"};color:${u.role === "admin" ? "#bd7355" : "#8a766a"};`)}>{u.role === "admin" ? "מנהל" : "לקוח"}</span>
            </div>
          ))}
        </div>
      )}

      {/* PAYMENT TESTS */}
      {adminTab === "payments" && (
        <div>
          <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:24px;margin-bottom:12px;")}>בדיקות תשלום</h2>
          {BACKEND !== "supabase" ? (
            <div style={css("background:#fff;border:1px dashed #e0cdbd;border-radius:14px;padding:40px;text-align:center;color:#8a766a;")}>
              זמין רק כשה‑backend הוא Supabase (יש חיבור לשערי תשלום אמיתיים).
            </div>
          ) : (
            <div style={css("background:#fff;border:1px solid #ecdccd;border-radius:14px;padding:24px;max-width:420px;")}>
              <p style={css("font-size:13.5px;color:#8a766a;margin-bottom:18px;line-height:1.6;")}>
                יוצר הזמנת בדיקה אמיתית בסכום חופשי (לא לפי מחירי המוצרים) ופותח את דף
                התשלום בלשונית חדשה. שימושי כי מחירי המוצרים גבוהים ממגבלת ה‑₪5 של
                סביבת הבדיקות של Takbull. פעולה זו זמינה רק למנהל מחובר.
              </p>
              <div style={css("display:flex;flex-direction:column;gap:14px;")}>
                <div>
                  <label style={css(lbl)}>סכום (₪)</label>
                  <input type="number" min="0.01" step="0.01" value={testAmount} onChange={(e) => setTestAmount(e.target.value)} style={css(inp)} />
                </div>
                <button
                  onClick={() => createTestPayment(Number(testAmount))}
                  disabled={testPaymentBusy || !(Number(testAmount) > 0)}
                  style={css(`padding:13px;background:#bd7355;color:#fff;border:none;border-radius:11px;font-size:15px;font-weight:600;cursor:pointer;opacity:${testPaymentBusy || !(Number(testAmount) > 0) ? 0.6 : 1};`)}
                >
                  {testPaymentBusy ? "יוצר…" : "פתיחת דף תשלום בדיקה"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRODUCT EDITOR OVERLAY */}
      {draft && (
        <div onClick={cancelDraft} style={css("position:fixed;inset:0;z-index:80;background:rgba(58,44,37,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;")}>
          <div onClick={(e) => e.stopPropagation()} dir="rtl" style={css("background:#faf5ef;border-radius:20px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;padding:32px;box-shadow:0 30px 80px rgba(0,0,0,.3);")}>
            <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;")}>
              <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:26px;")}>{draft._new ? "מוצר חדש" : "עריכת מוצר"}</h2>
              <span onClick={cancelDraft} style={css("cursor:pointer;font-size:24px;color:#8a766a;")}>×</span>
            </div>
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
          </div>
        </div>
      )}

      {/* COLLECTION EDITOR OVERLAY */}
      {draftCol && (
        <div onClick={cancelCol} style={css("position:fixed;inset:0;z-index:80;background:rgba(58,44,37,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;")}>
          <div onClick={(e) => e.stopPropagation()} dir="rtl" style={css("background:#faf5ef;border-radius:20px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;padding:32px;box-shadow:0 30px 80px rgba(0,0,0,.3);")}>
            <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;")}>
              <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:26px;")}>{draftCol._new ? "קולקציה חדשה" : "עריכת קולקציה"}</h2>
              <span onClick={cancelCol} style={css("cursor:pointer;font-size:24px;color:#8a766a;")}>×</span>
            </div>
            <div style={css("display:flex;flex-direction:column;gap:16px;")}>
              <div style={css("display:flex;gap:16px;align-items:flex-start;")}>
                <div style={thumb(draftCol.image, GRAD_CARD, "width:80px;height:80px;flex:none;border-radius:14px;")}>
                  {!draftCol.image && <Disc style="width:54%;aspect-ratio:1;" />}
                </div>
                <div style={css("flex:1;")}><label style={css(lbl)}>תמונת קולקציה</label><AdminImageField value={draftCol.image} onChange={(v) => setDraftCol("image", v)} placeholder="קישור לתמונה או העלאה ←" /></div>
              </div>
              <Field label="שם הקולקציה" value={draftCol.title} onChange={(v) => setDraftCol("title", v)} />
              <Field label="תווית (subtitle)" value={draftCol.subtitle} onChange={(v) => setDraftCol("subtitle", v)} placeholder="הקולקציה החדשה" />
              <Area label="תיאור" value={draftCol.description} onChange={(v) => setDraftCol("description", v)} />
              <div style={css("display:flex;gap:12px;margin-top:8px;")}>
                <button onClick={saveCol} style={css("flex:1;padding:14px;background:#bd7355;color:#fff;border:none;border-radius:11px;font-size:15.5px;font-weight:600;cursor:pointer;")}>שמירה</button>
                <button onClick={cancelCol} style={css("padding:14px 24px;background:#fff;color:#3a2c25;border:1px solid #e0cdbd;border-radius:11px;font-size:15px;cursor:pointer;")}>ביטול</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAIL OVERLAY */}
      {orderView && (() => {
        const o = allOrders.find((x) => x.id === orderView.id) || orderView;
        const addr = o.shipping_address || {};
        const fullName = [addr.first, addr.last].filter(Boolean).join(" ") || "אורח";
        return (
          <div onClick={() => setOrderView(null)} style={css("position:fixed;inset:0;z-index:80;background:rgba(58,44,37,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;")}>
            <div onClick={(e) => e.stopPropagation()} dir="rtl" style={css("background:#faf5ef;border-radius:20px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;padding:32px;box-shadow:0 30px 80px rgba(0,0,0,.3);")}>
              <div style={css("display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;")}>
                <h2 style={css("font-family:'Frank Ruhl Libre',serif;font-weight:400;font-size:26px;")}>{o.number}</h2>
                <span onClick={() => setOrderView(null)} style={css("cursor:pointer;font-size:24px;color:#8a766a;")}>×</span>
              </div>
              <div style={css("display:flex;flex-direction:column;gap:18px;")}>
                <div>
                  <label style={css(lbl)}>סטטוס הזמנה</label>
                  <select value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)} style={css(inp + "cursor:pointer;")}>
                    {STATUS_OPTS.map((sname) => <option key={sname} value={sname}>{sname}</option>)}
                  </select>
                </div>
                <div style={css("background:#fff;border:1px solid #ecdccd;border-radius:14px;padding:18px;")}>
                  <div style={css("font-size:13px;font-weight:700;color:#8a766a;margin-bottom:10px;")}>פרטי לקוח</div>
                  <div className="r-fields2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:14px;")}>
                    <div><div style={css("color:#8a766a;font-size:12px;")}>שם</div><div>{fullName}</div></div>
                    <div><div style={css("color:#8a766a;font-size:12px;")}>אימייל</div><div>{addr.email || "—"}</div></div>
                    <div><div style={css("color:#8a766a;font-size:12px;")}>טלפון</div><div>{addr.phone || "—"}</div></div>
                    <div><div style={css("color:#8a766a;font-size:12px;")}>תשלום</div><div>{o.payment_status === "paid" ? "שולם" : "טרם שולם"}</div></div>
                    <div style={css("grid-column:1/3;")}><div style={css("color:#8a766a;font-size:12px;")}>כתובת</div><div>{[addr.address, addr.city, addr.zip].filter(Boolean).join(", ") || "—"}</div></div>
                  </div>
                </div>
                <div style={css("background:#fff;border:1px solid #ecdccd;border-radius:14px;padding:18px;")}>
                  <div style={css("font-size:13px;font-weight:700;color:#8a766a;margin-bottom:10px;")}>פריטים</div>
                  {(o.items || []).map((it, i) => (
                    <div key={i} style={css("display:flex;justify-content:space-between;font-size:14px;margin-bottom:8px;")}>
                      <span>{it.name}{it.size ? ` (${it.size})` : ""} × {it.qty}</span>
                      <span style={css("font-weight:600;")}>{fmt(it.price * it.qty)}</span>
                    </div>
                  ))}
                  <div style={css("height:1px;background:#ecdccd;margin:10px 0;")} />
                  <div style={css("display:flex;justify-content:space-between;font-size:13.5px;color:#8a766a;margin-bottom:4px;")}><span>משלוח</span><span>{o.shipping ? fmt(o.shipping) : "חינם"}</span></div>
                  <div style={css("display:flex;justify-content:space-between;font-size:16px;font-weight:700;")}><span>סה״כ</span><span>{fmt(o.total)}</span></div>
                </div>
                <button onClick={() => setOrderView(null)} style={css("padding:13px;background:#fff;color:#3a2c25;border:1px solid #e0cdbd;border-radius:11px;font-size:15px;cursor:pointer;")}>סגירה</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
