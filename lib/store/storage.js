// localStorage helpers. Every call is wrapped in try/catch so private mode or a
// full disk never crashes the shop.

export const KEYS = {
  cart: "shophub:cart",
  promo: "shophub:promo",
};

export function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
