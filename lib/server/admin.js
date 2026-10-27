// Firebase Admin SDK: used only on the server (API routes). It can write orders for guests and
// update the payment status, which the browser must never be allowed to do.
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpError } from "./http.js";
import { normalizePrivateKey } from "./pem.js";

function credentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  if (!projectId || !clientEmail || !process.env.FIREBASE_PRIVATE_KEY) {
    const missing = [!projectId && "FIREBASE_PROJECT_ID", !clientEmail && "FIREBASE_CLIENT_EMAIL", !process.env.FIREBASE_PRIVATE_KEY && "FIREBASE_PRIVATE_KEY"].filter(Boolean);
    console.error("Firebase Admin env vars missing on the server:", missing.join(", "));
    return null;
  }
  return { projectId, clientEmail, privateKey };
}

export function getAdmin() {
  const c = credentials();
  if (!c) {
    throw new HttpError(503, "The server is not set up for orders yet. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (see README).");
  }
  let app;
  try {
    app = getApps().length ? getApp() : initializeApp({ credential: cert(c) });
  } catch (err) {
    console.error("Firebase Admin init failed:", err.message);
    throw new HttpError(503, "The server could not connect to the database. The Firebase service account key looks wrong.");
  }
  return { db: getFirestore(app), FieldValue };
}

// Returns the uid of the logged-in customer, or null for a guest.
// Token is checked via Google's REST API (firebase-admin/auth crashes on Vercel with ERR_REQUIRE_ESM).
export async function uidFromRequest(request) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const expired = new HttpError(401, "Your login has expired. Please log in again, or continue as a guest.");
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw expired;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: header.slice(7) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw expired;
    const data = await res.json();
    const uid = data?.users?.[0]?.localId;
    if (!uid) throw expired;
    return uid;
  } catch {
    throw expired;
  }
}