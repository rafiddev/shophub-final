import { createPrivateKey } from "node:crypto";
import { getAdmin } from "@/lib/server/admin";
import { normalizePrivateKey } from "@/lib/server/pem";
import { json, siteOrigin } from "@/lib/server/http";
import { sslConfig } from "@/lib/server/sslcommerz";

export const runtime = "nodejs";

// GET /api/health: a safe checklist to find out why orders or payments fail after deploying.
// It only says yes/no. It never shows a password, key or any other secret value.
export async function GET(request) {
  const ssl = sslConfig();
  const result = {
    siteUrlUsedForPaymentReturn: siteOrigin(request),
    sslcommerz: ssl ? (ssl.live ? "configured (LIVE mode)" : "configured (sandbox mode)") : "MISSING: set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD",
    firebasePrivateKey: "MISSING: set FIREBASE_PRIVATE_KEY",
    firebaseAdmin: "unknown",
    firestore: "unknown",
    usdToBdt: Number(process.env.NEXT_PUBLIC_USD_TO_BDT) || 120,
  };

  if (process.env.FIREBASE_PRIVATE_KEY) {
    try {
      createPrivateKey(normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY));
      result.firebasePrivateKey = "valid";
    } catch {
      result.firebasePrivateKey = "INVALID: copy the private_key value from the service account .json file again";
    }
  }

  try {
    const admin = getAdmin();
    result.firebaseAdmin = "configured";
    try {
      await admin.db.collection("orders").limit(1).get();
      result.firestore = "ok (can read and write orders)";
    } catch (err) {
      result.firestore = `ERROR: ${String(err.message || err).slice(0, 160)}`;
    }
  } catch (err) {
    result.firebaseAdmin = `MISSING: ${err.message}`;
  }

  return json(result);
}