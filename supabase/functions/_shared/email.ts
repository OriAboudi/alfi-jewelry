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

// Palette — mirrors src/styles/tokens.css.
const C = {
  bg: "#f6f0eb",
  surface: "#ffffff",
  ink: "#3a2d3d",
  inkSoft: "#4e4052",
  inkMute: "#625565",
  inkFaint: "#7d7086",
  accent: "#7a5c86",
  accentDark: "#6e4f7a",
  accentSoft: "#ede3ee",
  line: "#e4dee6",
  success: "#5f7a45",
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
    <div style="background:${C.accentSoft};border-radius:12px;padding:18px;text-align:center;font-size:22px;font-weight:bold;letter-spacing:.08em;color:${C.accent};margin:20px 0;">${escapeHtml(code)}</div>
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
function emailShell(inner: string) {
  // Text wordmark, styled like the site header's "ALFI" (serif, wide
  // letter-spacing; padding-right balances the trailing letter-space so it
  // stays optically centred). Georgia stands in for the site's web font,
  // which email clients can't load.
  const logo = `<tr><td align="center" dir="ltr" style="padding:32px 24px 10px;font-family:Georgia,'Times New Roman',serif;font-size:34px;letter-spacing:.36em;padding-right:.36em;color:${C.ink};">ALFI</td></tr>`;
  return `<!doctype html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:${C.bg};">
  <!-- Same painted background as the website. The background attribute and
       inline background-image cover Gmail/Apple Mail; clients that drop
       images (e.g. Outlook desktop) fall back to the cream background-color. -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" background="${BG_URL}" style="background-color:${C.bg};background-image:url(${BG_URL});background-size:cover;background-position:center top;background-repeat:repeat;">
    <tr><td align="center" style="padding:36px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" style="max-width:560px;">
        ${logo}
        <tr><td dir="rtl" style="padding:8px 24px 24px;font-family:${FONT};color:${C.ink};text-align:right;font-size:15px;line-height:1.7;">
          ${inner}
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr><td align="center" style="padding:18px 12px 0;">
          <span style="display:inline-block;background-color:${C.bg};border-radius:100px;padding:6px 14px;font-family:${FONT};font-size:12px;color:${C.inkMute};">ALFI JEWELRY · תכשיטי כסף סטרלינג 925 לאישה</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function headingHtml(text: string) {
  return `<h1 style="margin:12px 0 14px;font-family:${FONT};font-size:22px;font-weight:bold;color:${C.accentDark};text-align:center;">${escapeHtml(text)}</h1>`;
}

function paragraphHtml(html: string, extraStyle = "") {
  return `<p style="margin:0 0 18px;${extraStyle}">${html}</p>`;
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
      <td style="padding:10px 0;border-bottom:1px solid ${C.line};text-align:right;">
        ${escapeHtml(it.name)}${it.size ? ` <span style="color:${C.inkMute};">(${escapeHtml(it.size)})</span>` : ""}
        <span style="color:${C.inkMute};"> × ${Number(it.qty) || 1}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${C.line};text-align:left;white-space:nowrap;" dir="ltr">${money(Number(it.price) * (Number(it.qty) || 1))}</td>
    </tr>`).join("");

  const line = (label: string, value: string, style = "") => `
    <tr>
      <td style="padding:5px 0;text-align:right;color:${C.inkSoft};${style}">${label}</td>
      <td style="padding:5px 0;text-align:left;white-space:nowrap;${style}" dir="ltr">${value}</td>
    </tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" bgcolor="${C.bg}" style="background-color:rgba(246,240,235,.8);border-radius:14px;margin:0 0 20px;">
      <tr><td style="padding:18px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" style="font-family:${FONT};font-size:14.5px;color:${C.ink};">
          <tr><td colspan="2" style="padding:0 0 8px;text-align:right;font-weight:bold;color:${C.inkMute};font-size:13px;">
            סיכום הזמנה ${ltr(order.number)}
          </td></tr>
          ${itemRows}
          ${line("סכום ביניים", money(order.subtotal))}
          ${line("משלוח", Number(order.shipping) ? money(order.shipping) : "חינם")}
          ${Number(order.discount) > 0 ? line(`הנחת קופון${order.coupon_code ? ` (${ltr(order.coupon_code)})` : ""}`, `-${money(order.discount)}`, `color:${C.success};`) : ""}
          <tr>
            <td style="padding:12px 0 0;border-top:1px solid ${C.line};text-align:right;font-weight:bold;font-size:16px;">
              ${paid ? `סה״כ <span style="color:${C.success};">· שולם ✓</span>` : "סה״כ"}
            </td>
            <td style="padding:12px 0 0;border-top:1px solid ${C.line};text-align:left;font-weight:bold;font-size:16px;white-space:nowrap;" dir="ltr">${money(order.total)}</td>
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
      <a href="${trackUrl}" style="display:inline-block;background:${C.accent};color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:12px;font-weight:bold;font-family:${FONT};">מעקב אחר ההזמנה</a>
    </div>
    <p style="margin:10px 0 0;text-align:center;font-size:12.5px;color:${C.inkSoft};">אפשר לחזור לקישור הזה בכל זמן כדי לראות את הסטטוס המעודכן.</p>`;
}

// Latin identifiers (order numbers like "#ALF-2419", coupon codes) inside
// RTL text: without an explicit direction the "#" jumps to the wrong end.
function ltr(s: unknown) {
  return `<span dir="ltr" style="unicode-bidi:embed;">${escapeHtml(s)}</span>`;
}

function escapeHtml(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
