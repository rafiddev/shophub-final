// Checks what the browser sent and builds the order. Prices, discounts and the amount to pay
// are always worked out here from the real product prices, never taken from the browser.
import { ADVANCE_PERCENTS, orderTotals, round2, salePrice, splitPayment, toBdt } from "../format.js";
import { evaluatePromo } from "../promo.js";
import { HttpError } from "./http.js";

const text = (v, max) => String(v ?? "").trim().slice(0, max);

// Cleans the request body. Throws HttpError(400) with a friendly message when something is wrong.
export function parseCheckoutBody(body) {
  if (!body || typeof body !== "object") throw new HttpError(400, "Invalid request.");

  // items: [{ id, qty }], the same product twice is merged
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 40) {
    throw new HttpError(400, "Your cart is empty.");
  }
  const qtyById = new Map();
  for (const raw of body.items) {
    const id = Number(raw?.id);
    const qty = Number(raw?.qty);
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      throw new HttpError(400, "Your cart has an item we could not understand.");
    }
    qtyById.set(id, Math.min(20, (qtyById.get(id) || 0) + qty));
  }

  const c = body.customer || {};
  const a = body.shippingAddress || {};
  const customer = { name: text(c.name, 80), email: text(c.email, 120), phone: text(c.phone, 30) };
  const shippingAddress = {
    address: text(a.address, 200),
    city: text(a.city, 80),
    postalCode: text(a.postalCode, 20),
    country: text(a.country, 80),
  };
  if (customer.name.length < 2) throw new HttpError(400, "Enter your full name.");
  if (!/^\S+@\S+\.\S+$/.test(customer.email)) throw new HttpError(400, "Enter a valid email address.");
  if (customer.phone.replace(/\D/g, "").length < 7) throw new HttpError(400, "Enter a valid phone number.");
  for (const [key, label] of [["address", "street address"], ["city", "city"], ["postalCode", "postal code"], ["country", "country"]]) {
    if (!shippingAddress[key]) throw new HttpError(400, `Enter your ${label}.`);
  }

  const paymentMethod = body.paymentMethod;
  if (paymentMethod !== "cod" && paymentMethod !== "sslcommerz") throw new HttpError(400, "Choose a payment method.");
  let payPercent = 100;
  if (paymentMethod === "sslcommerz") {
    payPercent = Number(body.payPercent) || 100;
    if (payPercent !== 100 && !ADVANCE_PERCENTS.includes(payPercent)) throw new HttpError(400, "Choose a valid advance payment option.");
  }

  return {
    qtyById,
    customer,
    shippingAddress,
    notes: text(body.notes, 500),
    paymentMethod,
    payPercent,
    promoCode: text(body.promo, 40) || null,
  };
}

// products: Map of id -> product from the catalogue (the real prices).
// Returns the order document (without createdAt). uid is null for guests.
export function buildOrder(input, products, uid, tranId = null) {
  const items = [];
  for (const [id, qty] of input.qtyById) {
    const p = products.get(id);
    if (!p) throw new HttpError(400, "One of the products in your cart is no longer available.");
    items.push({ id, title: p.title, thumbnail: p.thumbnail, price: salePrice(p), qty });
  }

  const totals = orderTotals(items, input.promoCode);
  if (input.promoCode && !totals.promo) {
    const r = evaluatePromo(input.promoCode, totals.subtotal);
    throw new HttpError(400, r.message || "This promo code is not valid.");
  }

  const pay = splitPayment(totals.total, input.paymentMethod, input.payPercent);
  const order = {
    uid: uid || null,
    guest: !uid,
    customer: input.customer,
    shippingAddress: input.shippingAddress,
    notes: input.notes,
    items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    promoCode: totals.promo ? totals.promo.code : null,
    shipping: totals.shipping,
    total: totals.total,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === "sslcommerz" ? "pending" : "unpaid",
    payPercent: pay.percent,
    payNow: pay.payNow,
    dueOnDelivery: pay.due,
    paidAmount: 0,
    status: "pending",
  };
  if (input.paymentMethod === "sslcommerz") {
    order.gateway = { tranId, currency: "BDT", amountBdt: toBdt(pay.payNow) };
  }
  return order;
}

// What the public order page may show (no address, email or phone).
export function publicOrderView(id, o) {
  return {
    id,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    payPercent: o.payPercent || 0,
    items: (o.items || []).map((i) => ({ id: i.id, title: i.title, thumbnail: i.thumbnail, price: i.price, qty: i.qty })),
    subtotal: o.subtotal,
    discount: o.discount || 0,
    promoCode: o.promoCode || null,
    shipping: o.shipping,
    total: o.total,
    payNow: o.payNow || 0,
    paidAmount: o.paidAmount || 0,
    dueOnDelivery: o.dueOnDelivery ?? o.total,
    guest: Boolean(o.guest),
    firstName: String(o.customer?.name || "").split(" ")[0],
    createdAt: o.createdAt?.toMillis?.() ?? null,
  };
}

// Decides what to store after SSLCommerz reported on a payment. Pure function, easy to test.
// result: "success" (already validated) | "fail" | "cancel"
export function paymentUpdate(order, result, info = {}) {
  if (order.paymentStatus === "paid" || order.paymentStatus === "partial") return null; // already settled
  if (result === "success") {
    return {
      paymentStatus: order.dueOnDelivery > 0 ? "partial" : "paid",
      paidAmount: order.payNow,
      gateway: { ...order.gateway, valId: info.valId || null, bankTranId: info.bankTranId || null, cardType: info.cardType || null },
    };
  }
  // Payment not completed: the order is closed so it does not stay waiting forever. The cart is kept so the customer can retry.
  return { paymentStatus: result === "cancel" ? "cancelled" : "failed", status: "cancelled" };
}
