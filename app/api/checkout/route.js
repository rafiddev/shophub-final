import { buildOrder, parseCheckoutBody } from "@/lib/server/checkout";
import { getAdmin, uidFromRequest } from "@/lib/server/admin";
import { HttpError, errorResponse, json, siteOrigin } from "@/lib/server/http";
import { buildInitParams, initSession, sslConfig } from "@/lib/server/sslcommerz";

export const runtime = "nodejs";

// Real prices come from the same catalogue the shop shows (DummyJSON), never from the browser.
async function fetchProduct(id) {
  const res = await fetch(`https://dummyjson.com/products/${id}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new HttpError(502, "We could not check the product prices. Please try again.");
  return res.json();
}

// POST /api/checkout  ->  creates the order (guest or logged in) and, for online payment, the SSLCommerz payment page.
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      throw new HttpError(400, "Invalid request.");
    }
    const input = parseCheckoutBody(body);

    const ssl = input.paymentMethod === "sslcommerz" ? sslConfig() : null;
    if (input.paymentMethod === "sslcommerz" && !ssl) {
      throw new HttpError(503, "Online payment is not set up yet. Please choose cash on delivery.");
    }

    const admin = getAdmin();
    const uid = await uidFromRequest(request, admin);

    const ids = [...input.qtyById.keys()];
    const found = await Promise.all(ids.map((id) => fetchProduct(id)));
    const products = new Map(ids.map((id, n) => [id, found[n]]));

    const tranId = `SH${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const order = buildOrder(input, products, uid, tranId);

    const ref = await admin.db.collection("orders").add({ ...order, createdAt: admin.FieldValue.serverTimestamp() });

    if (input.paymentMethod === "cod") return json({ orderId: ref.id });

    const params = buildInitParams({ cfg: ssl, orderId: ref.id, tranId, amountBdt: order.gateway.amountBdt, order, origin: siteOrigin(request) });
    const session = await initSession(ssl, params);
    if (!session.ok) {
      await ref.update({ paymentStatus: "failed", status: "cancelled" });
      throw new HttpError(502, session.reason);
    }
    return json({ orderId: ref.id, gatewayUrl: session.url });
  } catch (err) {
    return errorResponse(err);
  }
}
