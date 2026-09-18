// Sends order-related emails via Resend (https://resend.com). RESEND_API_KEY
// is a Supabase secret — never hardcoded. If it isn't set yet (e.g. before
// the account is created), these quietly no-op so orders/status changes
// still go through; they just log a warning instead of emailing.
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_ADDRESS = Deno.env.get("ORDER_EMAIL_FROM") || "ALFI <onboarding@resend.dev>";
// The site's public URL, e.g. https://alfi-jewelry.netlify.app — used to build
// the "view your order" link in the email. Edge functions have no reliable
// way to know the frontend's origin on their own (this email can be
// triggered by Takbull's IPN, which carries no browser Origin header), so
// this is a Supabase secret you set once: supabase secrets set SITE_URL=...
const SITE_URL = (Deno.env.get("SITE_URL") || "").replace(/\/+$/, "");

const STATUS_COPY: Record<string, { subject: string; heading: string; body: string }> = {
  "התקבלה": { subject: "ההזמנה שלך התקבלה", heading: "ההזמנה שלך התקבלה", body: "אנחנו כבר מתחילים לטפל בהזמנה שלך." },
  "בהכנה": { subject: "ההזמנה שלך בהכנה", heading: "ההזמנה שלך בהכנה", body: "אנחנו מכינים את התכשיט שלך באהבה ובקפידה." },
  "נשלחה": { subject: "ההזמנה שלך נשלחה", heading: "ההזמנה שלך נשלחה!", body: "החבילה שלך יצאה לדרך ותגיע אליך בקרוב." },
  "בדרך": { subject: "ההזמנה שלך בדרך אליך", heading: "ההזמנה שלך בדרך", body: "השליח כבר בדרך — כדאי לוודא שיש מי שיקבל את החבילה." },
  "נמסר": { subject: "ההזמנה שלך נמסרה", heading: "ההזמנה שלך נמסרה", body: "מקווים שתיהנו מהתכשיט החדש! תודה שקנית ב‑ALFI." },
  "בוטלה": { subject: "ההזמנה שלך בוטלה", heading: "ההזמנה בוטלה", body: "ההזמנה שלך בוטלה. לשאלות ניתן לפנות אלינו בכל עת." },
};

export async function sendOrderConfirmationEmail(order: any) {
  await sendOrderEmail(order, {
    subject: `ALFI · אישור הזמנה ${order.number || ""}`,
    heading: "תודה על ההזמנה!",
    intro: `ההזמנה שלך <strong>${escapeHtml(order.number || "")}</strong> התקבלה בהצלחה.`,
  });
}

export async function sendOrderStatusEmail(order: any, status: string) {
  const copy = STATUS_COPY[status] || { subject: "עדכון הזמנה", heading: "עדכון הזמנה", body: "סטטוס ההזמנה שלך התעדכן." };
  await sendOrderEmail(order, {
    subject: `ALFI · ${copy.subject} · ${order.number || ""}`,
    heading: copy.heading,
    intro: `${escapeHtml(copy.body)}<br/>מספר הזמנה: <strong>${escapeHtml(order.number || "")}</strong>`,
  });
}

export async function sendSignupCouponEmail({ name, email, code, percent }: { name: string; email: string; code: string; percent: number }) {
  if (!email) return;
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping signup coupon email for", email);
    return;
  }

  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#3a2d3d;">
      <h2 style="color:#7a5c86;">ברוכה הבאה ל‑ALFI${name ? `, ${escapeHtml(name)}` : ""}!</h2>
      <p>תודה שנרשמת. הנה קוד ההנחה שלך ל‑${percent}% הנחה על ההזמנה הבאה:</p>
      <div style="background:#ede3ee;border-radius:10px;padding:18px;text-align:center;font-size:22px;font-weight:bold;letter-spacing:.08em;margin:20px 0;">${escapeHtml(code)}</div>
      <p style="font-size:13px;color:#625565;">אפשר להזין את הקוד בעמוד המוצר או בקופה.</p>
      <p style="color:#625565;font-size:13px;margin-top:30px;">ALFI · תכשיטי כסף בעבודת יד</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: email, subject: "ALFI · קוד ההנחה שלך (5%)", html }),
  });
  if (!res.ok) {
    console.error("Resend send failed (signup coupon)", res.status, await res.text());
  }
}

async function sendOrderEmail(order: any, { subject, heading, intro }: { subject: string; heading: string; intro: string }) {
  const email = order?.shipping_address?.email;
  if (!email) {
    console.warn("no customer email on order", order?.id, "— skipping email:", subject);
    return;
  }
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email for order", order?.id, ":", subject);
    return;
  }

  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#3a2d3d;">
      <h2 style="color:#7a5c86;">${escapeHtml(heading)}</h2>
      <p>${intro}</p>
      ${itemsTableHtml(order)}
      <p>סכום ביניים: ₪${Number(order.subtotal || 0).toFixed(2)}</p>
      <p>משלוח: ${order.shipping ? `₪${Number(order.shipping).toFixed(2)}` : "חינם"}</p>
      ${Number(order.discount) > 0 ? `<p>הנחת קופון${order.coupon_code ? ` (${escapeHtml(order.coupon_code)})` : ""}: -₪${Number(order.discount).toFixed(2)}</p>` : ""}
      <p style="font-size:18px;font-weight:bold;">סה״כ: ₪${Number(order.total || 0).toFixed(2)}</p>
      ${trackLinkHtml(order)}
      <p style="color:#625565;font-size:13px;margin-top:30px;">ALFI · תכשיטי כסף בעבודת יד</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: email, subject, html }),
  });
  if (!res.ok) {
    console.error("Resend send failed", res.status, await res.text());
  }
}

function itemsTableHtml(order: any) {
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items.map((it: any) =>
    `<tr>
      <td style="padding:8px 0;">${escapeHtml(it.name)}${it.size ? ` (${escapeHtml(it.size)})` : ""}</td>
      <td style="padding:8px 0;text-align:center;">${it.qty}</td>
      <td style="padding:8px 0;text-align:left;">₪${Number(it.price * it.qty).toFixed(2)}</td>
    </tr>`
  ).join("");
  return `
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <thead>
        <tr style="border-bottom:1px solid #d6ccda;text-align:right;">
          <th style="padding:8px 0;">פריט</th><th style="padding:8px 0;">כמות</th><th style="padding:8px 0;text-align:left;">מחיר</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function trackLinkHtml(order: any) {
  const trackUrl = SITE_URL ? `${SITE_URL}/?order=${order.id}` : "";
  if (!trackUrl) {
    console.warn("SITE_URL not set — email will omit the order-tracking link");
    return "";
  }
  return `<p style="margin-top:24px;"><a href="${trackUrl}" style="display:inline-block;background:#7a5c86;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;">מעקב אחר ההזמנה</a></p>
    <p style="font-size:12px;color:#7d7086;">אפשר לחזור לקישור הזה בכל זמן כדי לראות את הסטטוס המעודכן.</p>`;
}

function escapeHtml(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
