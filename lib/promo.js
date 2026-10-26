// Promo codes. This file is shared: the cart uses it to show the discount right away,
// and the server (app/api/checkout) uses it again so nobody can fake a discount in the browser.
//
// type: "percent"  -> value% off the subtotal
//       "fixed"    -> value dollars off the subtotal
//       "shipping" -> free shipping
// min: the subtotal must be at least this much.
export const PROMOS = {
  WELCOME10: { label: "10% off your order", type: "percent", value: 10, min: 0 },
  SAVE5: { label: "$5 off orders over $30", type: "fixed", value: 5, min: 30 },
  FREESHIP: { label: "Free shipping", type: "shipping", value: 0, min: 0 },
};

export const normalizeCode = (code) => String(code || "").trim().toUpperCase();

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Checks a code against a subtotal.
// Returns { ok: true, code, label, discount, freeShipping } or { ok: false, message }.
export function evaluatePromo(rawCode, subtotal) {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, message: "Enter a promo code." };
  const promo = PROMOS[code];
  if (!promo) return { ok: false, message: "This promo code is not valid." };
  if (subtotal < promo.min) {
    return { ok: false, message: `${code} needs an order of at least $${promo.min}.` };
  }
  let discount = 0;
  if (promo.type === "percent") discount = round2((subtotal * promo.value) / 100);
  if (promo.type === "fixed") discount = Math.min(promo.value, subtotal);
  return { ok: true, code, label: promo.label, discount, freeShipping: promo.type === "shipping" };
}
