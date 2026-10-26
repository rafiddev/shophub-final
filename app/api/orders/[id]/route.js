import { getAdmin } from "@/lib/server/admin";
import { publicOrderView } from "@/lib/server/checkout";
import { HttpError, errorResponse, json } from "@/lib/server/http";

export const runtime = "nodejs";

// GET /api/orders/{id}: what the order page shows. The order id is a long random code,
// so only the person who placed the order knows it (guests included).
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    if (!/^[A-Za-z0-9]{10,40}$/.test(id)) throw new HttpError(404, "Order not found.");
    const admin = getAdmin();
    const snap = await admin.db.collection("orders").doc(id).get();
    if (!snap.exists) throw new HttpError(404, "Order not found.");
    return json(publicOrderView(id, snap.data()));
  } catch (err) {
    return errorResponse(err);
  }
}
