import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Values come from .env.local (see .env.example). NEXT_PUBLIC_ variables must be
// written out in full like this so Next.js can inline them into the browser bundle.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app = null;
let auth = null;
let db = null;
let storage = null;
let rtdb = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  if (config.storageBucket) storage = getStorage(app);
  if (config.databaseURL) rtdb = getDatabase(app); // Realtime Database (optional)

  if (typeof window !== "undefined") {
    try {
      // Offline cache: orders, cart and profile keep working with a flaky connection.
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      // Already initialised (hot reload) -> reuse the existing instance.
      db = getFirestore(app);
    }
  } else {
    db = getFirestore(app);
  }
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export { app, auth, db, storage, rtdb };

// Google Analytics (only runs in the browser when a measurement id is set).
export async function track(eventName, params) {
  if (typeof window === "undefined" || !app || !config.measurementId) return;
  try {
    const { getAnalytics, isSupported, logEvent } = await import("firebase/analytics");
    if (await isSupported()) logEvent(getAnalytics(app), eventName, params);
  } catch {
    /* analytics must never break the shop */
  }
}
