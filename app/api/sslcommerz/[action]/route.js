import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/server/admin";
import { paymentUpdate } from "@/lib/server/checkout";
import { siteOrigin } from "@/lib/server/http";
import { judgePayment, sslConfig, validatePayment } from "@/lib/server/sslcommerz";

export const runtime = "nodejs";

// SSLCommerz calls these URLs (see buildInitParams):
//   POST /api/sslcommerz/success  the customer paid and is sent back here
//   POST /api/sslcommerz/fail     the payment failed
//   POST /api/sslcommerz/cancel   the customer pressed Cancel on the payment page
//   POST /api/sslcommerz/ipn      server-to-server notice (backup in case the customer closes the browser)
async function handle(action, form) {
  const orderId = String(form.value_a || "");
  if (!orderId) return null;

  const admin = getAdmin();
  const ref = admin.db.collection("orders").doc(orderId);
  const first = await ref.get();
  if (!first.exists) return orderId;
  const order = first.data();
  if (order.paymentMethod !== "sslcommerz" || !order.gateway || form.tran_id !== order.gateway.tranId) return orderId;

  // Success: ask SSLCommerz to confirm the payment before trusting it (done outside the transaction).
  let info = null;
  if (action === "success" || action === "ipn") {
    const cfg = sslConfig();
    if (!cfg || !["VALID", "VALIDATED"].includes(form.status) || !form.val_id) return orderId;
    const validation = await validatePayment(cfg, String(form.val_id));
    if (!judgePayment(order, validation).ok) return orderId;
    info = { valId: String(form.val_id), bankTranId: validation.bank_tran_id, cardType: validation.card_type };
  } else if (action !== "fail" && action !== "cancel") {
    return orderId;
  }

  // The success page and the IPN can both arrive: the transaction makes sure the order is updated only once.
  await admin.db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const update = paymentUpdate(snap.data(), info ? "success" : action, info || {});
    if (update) tx.update(ref, update);
  });
  return orderId;
}

export async function POST(request, { params }) {
  const { action } = await params;
  if (!["success", "fail", "cancel", "ipn"].includes(action)) return new Response("Not found", { status: 404 });

  let orderId = null;
  try {
    const form = Object.fromEntries(await request.formData());
    orderId = await handle(action, form);
  } catch (err) {
    console.error("SSLCommerz callback error:", err);
  }

  if (action === "ipn") return new Response("OK");
  const origin = siteOrigin(request);
  // 303 turns the POST into a normal GET page visit.
  return NextResponse.redirect(new URL(orderId ? `/order/${orderId}?from=${action}` : "/cart", origin), 303);
}

// Someone opened the URL directly: just go home.
export async function GET(request) {
  return NextResponse.redirect(new URL("/", siteOrigin(request)), 303);
}
