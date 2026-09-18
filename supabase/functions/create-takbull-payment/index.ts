// Supabase Edge Function: create-takbull-payment
//
// Called by the storefront when a guest submits the checkout form. Prices
// are NEVER trusted from the client — this function looks up the real price
// for every item from the `products` table itself, creates the order
// (status "pending payment"), then asks Takbull for a payment-page redirect
// URL for the verified total. Takbull hosts the actual payment page, so no
// card data ever reaches this app.
//
// Exception: an authenticated admin may pass `testAmount` to create a
// single-line test order of an arbitrary amount (Takbull's own sandbox caps
// real test charges at ₪5, which is below every real product's price).
// Verified server-side via isAdminRequest — ignored for non-admin callers.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isAdminRequest } from "../_shared/adminAuth.ts";

const TAKBULL_API_KEY = Deno.env.get("TAKBULL_API_KEY") ?? "";
const TAKBULL_API_SECRET = Deno.env.get("TAKBULL_API_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

const supabase = createClient(
  SUPABASE_URL,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { items, shipping_address, testAmount, couponCode } = await req.json();

    let verified: any[];
    let isTest = false;
    if (testAmount != null && (await isAdminRequest(req))) {
      const amount = Math.max(0.01, Number(testAmount) || 0);
      verified = [{ id: "test", name: "בדיקת תשלום (אדמין)", price: amount, qty: 1, size: "" }];
      isTest = true;
    } else {
      if (!Array.isArray(items) || items.length === 0) {
        return json({ error: "העגלה ריקה" });
      }

      // Required fields are validated client-side too, but the client can't
      // be trusted — re-check here. Zip is intentionally optional.
      const required = { first: "שם פרטי", last: "שם משפחה", address: "כתובת", city: "עיר" };
      for (const [key, label] of Object.entries(required)) {
        if (!String(shipping_address?.[key] || "").trim()) return json({ error: `שדה חובה חסר: ${label}` });
      }
      const email = String(shipping_address?.email || "").trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "כתובת אימייל לא תקינה" });
      const phoneDigits = String(shipping_address?.phone || "").replace(/[^\d]/g, "");
      if (!/^0\d{8,9}$/.test(phoneDigits)) return json({ error: "מספר טלפון לא תקין" });

      const ids = items.map((it: any) => it.id);
      const { data: products, error: prodErr } = await supabase
        .from("products")
        .select("id, name, price, image, stock")
        .in("id", ids);
      if (prodErr) throw prodErr;

      verified = items.map((it: any) => {
        const p = products.find((x: any) => String(x.id) === String(it.id));
        if (!p) throw new Error("מוצר לא נמצא: " + it.id);
        const qty = Math.max(1, Math.min(50, Number(it.qty) || 1));
        if (Number(p.stock) < qty) throw new Error(`אזל במלאי: ${p.name}`);
        return { id: p.id, name: p.name, price: Number(p.price) || 0, qty, size: it.size || "" };
      });
    }

    const { data: contentRow } = await supabase.from("content").select("data").eq("id", 1).single();
    const cfg = contentRow?.data || {};
    const subtotal = verified.reduce((a: number, it: any) => a + it.price * it.qty, 0);
    const freeShipFrom = Number(cfg.freeShipFrom || 500);
    const shipFee = Number(cfg.shipFee || 39);
    const shipping = isTest ? 0 : (subtotal >= freeShipFrom ? 0 : shipFee);

    // Coupon discount is validated and computed here, server-side, never
    // trusted from the client. An invalid/redeemed/expired code is silently
    // ignored rather than failing checkout — validate-coupon already gave
    // the shopper feedback client-side before they got this far.
    let discount = 0;
    let appliedCouponCode: string | null = null;
    if (!isTest && couponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", String(couponCode).trim().toUpperCase())
        .maybeSingle();
      if (coupon && coupon.status === "active" && (!coupon.expires_at || new Date(coupon.expires_at) > new Date())) {
        discount = Math.round(subtotal * (Number(coupon.percent) || 0)) / 100;
        appliedCouponCode = coupon.code;
      }
    }
    const total = Math.max(0, subtotal + shipping - discount);

    const number = (isTest ? "#TEST-" : "#ALF‑") + (2400 + Math.floor(Math.random() * 9000));
    const fullName = [shipping_address?.first, shipping_address?.last].filter(Boolean).join(" ");

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        number,
        user_id: null,
        items: verified,
        subtotal,
        shipping,
        total,
        discount,
        coupon_code: appliedCouponCode,
        shipping_address: { city: "תל אביב", ...shipping_address },
        payment_status: "pending",
        payment_method: "takbull",
        is_test: isTest,
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    const origin = req.headers.get("origin") || "";

    const takbullBody = {
      order_reference: String(order.id),
      OrderTotalSum: total,
      Currency: "ILS",
      Language: "he",
      DealType: 1,
      DisplayType: "redirect",
      PostProcessMethod: 0,
      CustomerFullName: fullName,
      CustomerPhoneNumber: shipping_address?.phone || "",
      City: shipping_address?.city || "",
      Country: "Israel",
      Customer: {
        CustomerFullName: fullName,
        Email: shipping_address?.email || "",
        PhoneNumber: shipping_address?.phone || "",
        Address: {
          Address1: shipping_address?.address || "",
          City: shipping_address?.city || "",
          Country: "Israel",
          Zip: shipping_address?.zip || "",
        },
      },
      IPNAddress: `${SUPABASE_URL}/functions/v1/takbull-ipn`,
      RedirectAddress: `${origin}/?paid=${order.id}`,
      CancelReturnAddress: `${origin}/?canceled=1`,
      Products: verified.map((it: any) => ({
        SKU: String(it.id),
        ProductName: it.name + (it.size ? ` (${it.size})` : ""),
        Price: it.price,
        Quantity: it.qty,
      })),
    };

    // Logged both to the Supabase function logs AND returned to the caller
    // on failure (see the debug field below) — asked for by Takbull support
    // to diagnose "internal error" responses. The API_Secret itself is never
    // logged, only which key was used (first/last 4 chars) for identification.
    const maskedKey = TAKBULL_API_KEY ? `${TAKBULL_API_KEY.slice(0, 4)}…${TAKBULL_API_KEY.slice(-4)}` : "(missing)";
    console.log("Takbull request →", JSON.stringify({ url: "GetTakbullPaymentPageRedirectUrl", API_Key: maskedKey, body: takbullBody }));

    const takbullRes = await fetch("https://api.takbull.co.il/api/ExtranalAPI/GetTakbullPaymentPageRedirectUrl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        API_Key: TAKBULL_API_KEY,
        API_Secret: TAKBULL_API_SECRET,
      },
      body: JSON.stringify(takbullBody),
    });
    const takbullData = await takbullRes.json();
    console.log("Takbull response ←", JSON.stringify({ httpStatus: takbullRes.status, body: takbullData }));

    if (!takbullRes.ok || takbullData.responseCode !== 0) {
      return json({
        error: takbullData.description || "פתיחת עמוד תשלום Takbull נכשלה",
        debug: {
          request: { API_Key: maskedKey, body: takbullBody },
          response: { httpStatus: takbullRes.status, body: takbullData },
        },
      });
    }

    await supabase.from("orders").update({ takbull_uniq_id: takbullData.uniqId }).eq("id", order.id);

    return json({
      url: takbullData.url || `https://api.takbull.co.il/PaymentGateway?orderUniqId=${takbullData.uniqId}`,
      order: { id: order.id, number: order.number, total, subtotal, shipping, discount, coupon_code: appliedCouponCode, shipping_address: order.shipping_address },
    });
  } catch (e) {
    console.error(e);
    return json({ error: e.message || "יצירת ההזמנה נכשלה" });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
