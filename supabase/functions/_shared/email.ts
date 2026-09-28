// Sends customer emails via Resend (https://resend.com). RESEND_API_KEY is a
// Supabase secret — never hardcoded. If it isn't set yet, the automatic
// emails (order confirmation, signup coupon) quietly no-op with a warning so
// checkout still goes through; the admin's manual send reports the error.
//
// Every email shares one branded shell (emailShell): logo, the site's
// current palette (src/styles/tokens.css), and footer. Order emails also
// carry the full order summary and, once paid, a clear "paid" mark — so a
// customer never reads a total as an amount still owed.
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

// Display name shown in the customer's inbox. ORDER_EMAIL_FROM supplies the
// sending ADDRESS (e.g. orders@alfi-jewelry.com, on the domain verified in
// Resend) — with or without a "Name <addr>" wrapper; the name is always
// replaced with this one so it never shows as just "orders".
const FROM_NAME = "ALFI JEWELRY";
const FROM_ADDRESS = (() => {
  const raw = (Deno.env.get("ORDER_EMAIL_FROM") || "onboarding@resend.dev").trim();
  const addr = raw.match(/<([^>]+)>/)?.[1] ?? raw;
  return `${FROM_NAME} <${addr.trim()}>`;
})();

// The site's public URL, e.g. https://alfi-jewelry.com — used for the
// "track your order" link and the logo image. Edge functions have no
// reliable way to know the frontend's origin on their own (the confirmation
// is triggered by Takbull's IPN, which carries no browser Origin header), so
// this is a Supabase secret: supabase secrets set SITE_URL=...
const SITE_URL = (Deno.env.get("SITE_URL") || "").replace(/\/+$/, "");
// Email images live in the public Supabase Storage bucket (not the site), so
// they work regardless of website deploys. Email clients block data: URIs,
// so they must be real https URLs. Sources: supabase/email-assets/ — upload
// a changed image under a NEW -vN name (the files are cached for a year).
const ASSET_BASE = `${(Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "")}/storage/v1/object/public/product-images/email`;
// The website's page background (public/floral-bg.jpg) with the site's
// blur + saturation + cream veil baked in — email clients ignore CSS
// filters and gradient overlays, so the effect has to be in the pixels.
const BG_URL = `${ASSET_BASE}/site-bg-v1.jpg`;
// The "ALFI" wordmark as it appears in the site header (Frank Ruhl Libre,
// .36em tracking, ink colour), rendered to a transparent PNG (source:
// supabase/email-assets/wordmark-v1.png). It sits straight on the floral
// background — as live text, dark mode would recolour it light-on-light;
// as an image it always stays exactly as designed.
const WORDMARK_URL = `${ASSET_BASE}/wordmark-v1.png`;

// Palette — mirrors src/styles/tokens.css.
const C = {
  bg: "#f6f0eb",
  card: "#ffffff",
  surface: "#ffffff",
  ink: "#3a2d3d",
  inkSoft: "#4e4052",
  inkMute: "#625565",
  inkFaint: "#7d7086",
  accent: "#7a5c86",
  accentDark: "#6e4f7a",
  accentSoft: "#ede3ee",
  line: "#e4dee6",
  success: "#4d6636",   // darker than the site token: 4.5:1+ on the email's cream panels
  successBg: "#e3edd6",
};
const FONT = "Arial,Helvetica,sans-serif";

/* ------------------------------------------------------------------ */
/*  Public senders                                                     */
/* ------------------------------------------------------------------ */

// Sent once by takbull-ipn when a payment is confirmed.
export async function sendOrderConfirmationEmail(order: any) {
  const email = order?.shipping_address?.email;
  if (!email) {
    console.warn("no customer email on order", order?.id, "— skipping confirmation email");
    return;
  }
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping confirmation email for order", order?.id);
    return;
  }
  const first = order?.shipping_address?.first;
  const html = emailShell(`
    ${headingHtml("תודה על ההזמנה!")}
    ${paragraphHtml(`${first ? `${escapeHtml(first)}, ` : ""}התשלום התקבל וההזמנה שלך אושרה. אנחנו כבר מתחילים לטפל בה.`)}
    ${orderSummaryHtml(order)}
    ${trackLinkHtml(order)}
  `);
  const result = await sendViaResend(email, `אישור הזמנה ${order.number || ""}`.trim(), html);
  if (!result.ok) console.error("confirmation email failed", order?.id, result.error);
}

// Admin-written message about an order (send-order-email). Unlike the
// automatic emails, this reports failure instead of swallowing it — the
// admin clicked "send" and needs to know whether the customer got it.
// Recipient is always the order's own email, never caller-supplied, and
// the message is plain text: HTML-escaped, newlines kept as line breaks.
export async function sendCustomOrderEmail(order: any, subject: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const email = order?.shipping_address?.email;
  if (!email) return { ok: false, error: "אין כתובת אימייל בהזמנה" };
  if (!RESEND_API_KEY) return { ok: false, error: "שירות המייל לא מוגדר (RESEND_API_KEY חסר)" };

  const cleanSubject = subject.replace(/[\r\n]+/g, " ");
  const html = emailShell(`
    ${headingHtml(cleanSubject)}
    ${paragraphHtml(escapeHtml(message).replace(/\r?\n/g, "<br/>"))}
    ${orderSummaryHtml(order)}
    ${trackLinkHtml(order)}
  `);
  return sendViaResend(email, cleanSubject, html);
}

export async function sendSignupCouponEmail({ name, email, code, percent }: { name: string; email: string; code: string; percent: number }) {
  if (!email) return;
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping signup coupon email for", email);
    return;
  }
  const html = emailShell(`
    ${headingHtml(`ברוכה הבאה ל‑ALFI${name ? `, ${name}` : ""}!`)}
    ${paragraphHtml(`תודה שנרשמת. הנה קוד ההנחה שלך ל‑${Number(percent)}% הנחה על ההזמנה הבאה:`)}
    <div class="em-code" style="background-color:${C.card};border:1.5px dashed ${C.accent};border-radius:12px;padding:18px;text-align:center;font-size:22px;font-weight:bold;letter-spacing:.08em;color:${C.accent};margin:20px 0;">${escapeHtml(code)}</div>
    ${paragraphHtml("אפשר להזין את הקוד בעמוד המוצר או בקופה. הקוד תקף להזמנה אחת.", `font-size:13px;color:${C.inkMute};`)}
  `);
  const result = await sendViaResend(email, `קוד ההנחה שלך (${Number(percent)}%)`, html);
  if (!result.ok) console.error("signup coupon email failed", email, result.error);
}

/* ------------------------------------------------------------------ */
/*  Building blocks                                                    */
/* ------------------------------------------------------------------ */

async function sendViaResend(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject: `ALFI · ${subject}`, html }),
  });
  if (!res.ok) {
    console.error("Resend send failed", res.status, await res.text());
    return { ok: false, error: "שליחת המייל נכשלה בצד ספק המייל" };
  }
  return { ok: true };
}

// Table-based layout: the only structure email clients (Outlook especially)
// render consistently. All styles inline for the same reason.
//
// Dark mode: mail apps recolour text for dark mode but never recolour a
// background IMAGE — text sitting on the painted background turned light-on-
// light and unreadable (iOS Mail, dark mode). So:
//  1. The floral painting is used wherever there's no text: a wide frame
//     around the card, with the ALFI wordmark (an image) on it. Every word
//     sits on the plain white card (bgcolor + background-color), which an
//     app that recolours will recolour together with its text.
//  2. color-scheme "light only" (meta + CSS) — Apple Mail and others then
//     don't recolour at all.
//  3. prefers-color-scheme:dark + Outlook.com's [data-ogsc]/[data-ogsb]
//     overrides pin the designed colours where a client applies its own.
function emailShell(inner: string) {
  // The site's "ALFI" wordmark, on the floral background above the card.
  const logo = `<tr><td align="center" style="padding:6px 0 30px;"><img src="${WORDMARK_URL}" width="190" alt="ALFI" style="display:block;width:190px;height:auto;border:0;margin:0 auto;" /></td></tr>`;
  const footer = `<tr><td align="center" class="em-mute" style="padding:18px 24px 26px;border-top:1px solid ${C.line};font-family:${FONT};font-size:12px;color:${C.inkMute};">ALFI JEWELRY · תכשיטי כסף סטרלינג 925 לאישה</td></tr>`;
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<style>
  :root { color-scheme: light only; supported-color-schemes: light only; }
  @media (prefers-color-scheme: dark) {
    .em-card { background-color: ${C.card} !important; }
    .em-soft { background-color: ${C.card} !important; }
    .em-ink { color: ${C.ink} !important; }
    .em-soft-ink { color: ${C.inkSoft} !important; }
    .em-mute { color: ${C.inkMute} !important; }
    .em-accent { color: ${C.accentDark} !important; }
    .em-success { color: ${C.success} !important; }
    .em-btn { background-color: ${C.accent} !important; color: #ffffff !important; }
    .em-code { background-color: ${C.card} !important; color: ${C.accent} !important; }
  }
  [data-ogsc] .em-ink { color: ${C.ink} !important; }
  [data-ogsc] .em-soft-ink { color: ${C.inkSoft} !important; }
  [data-ogsc] .em-mute { color: ${C.inkMute} !important; }
  [data-ogsc] .em-accent { color: ${C.accentDark} !important; }
  [data-ogsc] .em-success { color: ${C.success} !important; }
  [data-ogsc] .em-btn { color: #ffffff !important; }
  [data-ogsb] .em-card { background-color: ${C.card} !important; }
  [data-ogsb] .em-soft { background-color: ${C.card} !important; }
  [data-ogsb] .em-btn { background-color: ${C.accent} !important; }
  [data-ogsc] .em-code { color: ${C.accent} !important; }
  [data-ogsb] .em-code { background-color: ${C.card} !important; }
  [data-ogsc] .em-card span:not([class]) { color: inherit !important; }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};">
  <!-- Painted background as a frame only (see note above). The background
       attribute + inline background-image cover Gmail/Apple Mail; clients
       that drop images (e.g. Outlook desktop) show the cream colour. -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" background="${BG_URL}" style="background-color:${C.bg};background-image:url(${BG_URL});background-size:cover;background-position:center top;background-repeat:repeat;">
    <tr><td align="center" style="padding:48px 30px 60px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:500px;">
        ${logo}
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" class="em-card" bgcolor="${C.card}" style="max-width:500px;background-color:${C.card};border-radius:20px;box-shadow:0 18px 40px rgba(58,45,61,.18);">
        <tr><td dir="rtl" class="em-ink" style="padding:30px 26px 26px;font-family:${FONT};color:${C.ink};text-align:right;font-size:15px;line-height:1.7;">
          ${inner}
        </td></tr>
        ${footer}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function headingHtml(text: string) {
  return `<h1 class="em-accent" style="margin:12px 0 14px;font-family:${FONT};font-size:22px;font-weight:bold;color:${C.accentDark};text-align:center;">${escapeHtml(text)}</h1>`;
}

function paragraphHtml(html: string, extraStyle = "") {
  return `<p class="em-ink" style="margin:0 0 18px;color:${C.ink};${extraStyle}">${html}</p>`;
}

const money = (n: unknown) => `₪${Number(n || 0).toFixed(2)}`;

// Items + totals. When the order is paid the total line reads "סה״כ · שולם ✓",
// so it can't be mistaken for an amount still due.
function orderSummaryHtml(order: any) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) return "";
  const paid = order.payment_status === "paid";

  const itemRows = items.map((it: any) => `
    <tr>
      <td class="em-ink" style="padding:10px 0;border-bottom:1px solid ${C.line};text-align:right;color:${C.ink};">
        ${escapeHtml(it.name)} <span class="em-mute" style="color:${C.inkMute};white-space:nowrap;">${it.size ? `(${escapeHtml(it.size)}) ` : ""}× ${Number(it.qty) || 1}</span>
      </td>
      <td class="em-ink" style="padding:10px 0;border-bottom:1px solid ${C.line};text-align:left;white-space:nowrap;color:${C.ink};" dir="ltr">${money(Number(it.price) * (Number(it.qty) || 1))}</td>
    </tr>`).join("");

  const line = (label: string, value: string, style = "", cls = "em-soft-ink") => `
    <tr>
      <td class="${cls}" style="padding:5px 0;text-align:right;color:${C.inkSoft};${style}">${label}</td>
      <td class="${cls}" style="padding:5px 0;text-align:left;white-space:nowrap;color:${C.ink};${style}" dir="ltr">${value}</td>
    </tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" class="em-soft" bgcolor="${C.card}" style="background-color:${C.card};border:1px solid ${C.line};border-radius:14px;margin:0 0 20px;">
      <tr><td style="padding:16px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" class="em-ink" style="font-family:${FONT};font-size:14.5px;color:${C.ink};">
          <tr><td colspan="2" class="em-mute" style="padding:0 0 8px;text-align:right;font-weight:bold;color:${C.inkMute};font-size:13px;">
            סיכום הזמנה ${ltr(order.number)}
          </td></tr>
          ${itemRows}
          ${line("סכום ביניים", money(order.subtotal))}
          ${order.delivery_method === "pickup"
            ? line("איסוף עצמי", "חינם") + `<tr><td colspan="2" class="em-soft-ink" style="padding:0 0 6px;text-align:right;color:${C.inkSoft};font-size:13.5px;">כתובת לאיסוף: ${escapeHtml(order.pickup_address || "")}</td></tr>`
            : line("משלוח", Number(order.shipping) ? money(order.shipping) : "חינם")}
          ${Number(order.discount) > 0 ? line(`הנחת קופון${order.coupon_code ? ` (${ltr(order.coupon_code)})` : ""}`, `-${money(order.discount)}`, `color:${C.success};`, "em-success") : ""}
          <tr>
            <td class="em-ink" style="padding:12px 0 0;border-top:1px solid ${C.line};text-align:right;font-weight:bold;font-size:16px;color:${C.ink};">
              ${paid ? `סה״כ <span class="em-success" style="color:${C.success};">· שולם ✓</span>` : "סה״כ"}
            </td>
            <td class="em-ink" style="padding:12px 0 0;border-top:1px solid ${C.line};text-align:left;font-weight:bold;font-size:16px;white-space:nowrap;color:${C.ink};" dir="ltr">${money(order.total)}</td>
          </tr>
        </table>
      </td></tr>
    </table>`;
}

function trackLinkHtml(order: any) {
  const trackUrl = SITE_URL ? `${SITE_URL}/?order=${encodeURIComponent(order.id)}` : "";
  if (!trackUrl) {
    console.warn("SITE_URL not set — email will omit the order-tracking link");
    return "";
  }
  return `<div style="text-align:center;margin:26px 0 6px;">
      <a href="${trackUrl}" class="em-btn" style="display:inline-block;background-color:${C.accent};color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:12px;font-weight:bold;font-family:${FONT};">מעקב אחר ההזמנה</a>
    </div>
    <p class="em-soft-ink" style="margin:10px 0 0;text-align:center;font-size:12.5px;color:${C.inkSoft};">אפשר לחזור לקישור הזה בכל זמן כדי לראות את הסטטוס המעודכן.</p>`;
}

// Latin identifiers (order numbers like "#ALF-2419", coupon codes) inside
// RTL text: without an explicit direction the "#" jumps to the wrong end.
function ltr(s: unknown) {
  return `<span dir="ltr" style="unicode-bidi:embed;">${escapeHtml(s)}</span>`;
}

function escapeHtml(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
