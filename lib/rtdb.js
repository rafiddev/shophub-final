// Firebase Realtime Database helpers. Everything here is optional: when
// NEXT_PUBLIC_FIREBASE_DATABASE_URL is not set, `rtdb` is null and these do nothing.
import { onDisconnect, onValue, ref, remove, set } from "firebase/database";
import { rtdb } from "@/lib/firebase";

// Realtime Database keys cannot contain . # $ [ ]
export function sanitizeKey(key) {
  return key ? String(key).replace(/[.#$[\]/]/g, "_") : "guest";
}

// A copy of every order (id, status, total...) at orders/{id} and users/{uid}/orders/{id}.
export async function rtdbSaveOrder(order) {
  try {
    if (!rtdb || !order?.id) return;
    await set(ref(rtdb, `orders/${sanitizeKey(order.id)}`), order);
  } catch (err) {
    console.warn("Realtime Database: could not save order:", err?.message);
  }
}

// "Shoppers online" counter. Each open tab adds presence/{id} = true, and the server
// removes it automatically (onDisconnect) when the tab closes or loses connection.
export function startPresence() {
  if (!rtdb || typeof window === "undefined") return () => {};
  const id = sanitizeKey(`${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const me = ref(rtdb, `presence/${id}`);
  const connected = ref(rtdb, ".info/connected");
  const stop = onValue(connected, (snap) => {
    if (snap.val() === true) {
      onDisconnect(me).remove();
      set(me, true).catch(() => {});
    }
  });
  return () => {
    stop();
    remove(me).catch(() => {});
  };
}

// Calls back with the number of shoppers online right now. Returns an unsubscribe function.
export function watchOnlineCount(callback) {
  if (!rtdb) return () => {};
  return onValue(
    ref(rtdb, "presence"),
    (snap) => callback(snap.exists() ? Object.keys(snap.val()).length : 0),
    () => callback(null)
  );
}
