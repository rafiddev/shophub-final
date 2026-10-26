import { evaluatePromo } from "./promo.js";

export const FREE_SHIPPING_MIN = 50;
export const SHIPPING_FEE = 4.99;

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const money = (n) => usd.format(Number(n) || 0);

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Price after the DummyJSON discount percentage.
export function salePrice(p) {
  const d = Number(p.discountPercentage) || 0;
  return round2(p.price * (1 - d / 100));
}

// Currency used by the payment gateway (SSLCommerz works in BDT). The shop prices are in USD.
export const USD_TO_BDT = Number(process.env.NEXT_PUBLIC_USD_TO_BDT) || 120;
export const toBdt = (usd) => round2(usd * USD_TO_BDT);

// Advance (partial) payment choices, in percent of the order total.
export const ADVANCE_PERCENTS = [30, 50];

// subtotal / discount / shipping / total for a list of cart items ({ price, qty }) and an optional promo code.
// promoError is set when a code is in the cart but does not apply (for example the order is too small).
export function orderTotals(items, promoCode = null) {
  const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  let discount = 0;
  let freeShipping = false;
  let promo = null;
  let promoError = "";
  if (promoCode && subtotal > 0) {
    const r = evaluatePromo(promoCode, subtotal);
    if (r.ok) {
      discount = r.discount;
      freeShipping = r.freeShipping;
      promo = { code: r.code, label: r.label };
    } else promoError = r.message;
  }
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_MIN || freeShipping ? 0 : SHIPPING_FEE;
  return { subtotal, discount, shipping, total: round2(subtotal - discount + shipping), promo, promoError };
}

// How much is paid now and how much on delivery. method: "cod" | "sslcommerz", percent: 100 or an advance percent.
export function splitPayment(total, method, percent = 100) {
  if (method !== "sslcommerz") return { payNow: 0, due: total, percent: 0 };
  const pct = Math.min(100, Math.max(1, percent));
  const payNow = pct === 100 ? total : round2((total * pct) / 100);
  return { payNow, due: round2(total - payNow), percent: pct };
}

export function formatDate(ts) {
  const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
  if (!d || Number.isNaN(d.getTime())) return "Just now";
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

// "SH-MVBBQJH6": the short, friendly order number shown to customers.
export const orderNumber = (id = "") => `SH-${String(id).slice(0, 8).toUpperCase()}`;

export const PAYMENT_LABELS = { cod: "Cash on delivery", card: "Card on delivery", sslcommerz: "Online payment (SSLCommerz)" };

// One short line about the payment of an order, for the dashboard and the order page.
export function paymentSummary(o) {
  if (o.paymentMethod === "sslcommerz") {
    if (o.paymentStatus === "paid") return "Paid online";
    if (o.paymentStatus === "partial") return `Advance paid, ${money(o.dueOnDelivery)} due on delivery`;
    if (o.paymentStatus === "failed") return "Payment failed";
    if (o.paymentStatus === "cancelled") return "Payment cancelled";
    return "Waiting for payment";
  }
  return PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod || "";
}

// What the customer sees for each order status stored in Firestore.
const STATUS_LABELS = { pending: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
export const statusLabel = (status) => STATUS_LABELS[status] || status;

// "17 Oct 2026"
export function formatDay(ts) {
  const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
  if (!d || Number.isNaN(d.getTime())) return "Just now";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
