// Firebase Admin SDK: used only on the server (API routes). It can write orders for guests and
// update the payment status, which the browser must never be allowed to do.
//
// Needs three values (see README): the project id (already in NEXT_PUBLIC_FIREBASE_PROJECT_ID),
// FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY from a Firebase "service account" key file.
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { HttpError } from "./http.js";

function credentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // On Vercel the key is pasted on one line with \n; turn those back into real new lines.
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

export function getAdmin() {
  const c = credentials();
  if (!c) {
    throw new HttpError(
      503,
      "The server is not set up for orders yet. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (see README)."
    );
  }
  const app = getApps().length ? getApp() : initializeApp({ credential: cert(c) });
  return { db: getFirestore(app), auth: getAuth(app), FieldValue };
}

// Returns the uid of the logged-in customer, or null for a guest. Throws when a token is sent but is not valid.
export async function uidFromRequest(request, admin) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    const decoded = await admin.auth.verifyIdToken(header.slice(7));
    return decoded.uid;
  } catch {
    throw new HttpError(401, "Your login has expired. Please log in again, or continue as a guest.");
  }
}
