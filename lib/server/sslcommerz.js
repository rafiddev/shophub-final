// SSLCommerz (Bangladesh payment gateway) helpers: start a payment session and verify the result.
// Docs: https://developer.sslcommerz.com/doc/v4/
//
// Flow: 1) we create the order, 2) ask SSLCommerz for a payment page URL (initSession),
// 3) the customer pays there, 4) SSLCommerz sends the customer back to our /api/sslcommerz/success URL,
// 5) we ask SSLCommerz to confirm the payment (validatePayment) before we mark the order as paid.

export function sslConfig() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storeId || !storePassword) return null;
  const live = String(process.env.SSLCOMMERZ_IS_LIVE).toLowerCase() === "true";
  const host = live ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com";
  return {
    storeId,
    storePassword,
    live,
    initUrl: `${host}/gwprocess/v4/api.php`,
    validateUrl: `${host}/validator/api/validationserverAPI.php`,
  };
}

// The form fields SSLCommerz needs to open a payment page.
export function buildInitParams({ cfg, orderId, tranId, amountBdt, order, origin }) {
  const c = order.customer;
  const a = order.shippingAddress;
  return {
    store_id: cfg.storeId,
    store_passwd: cfg.storePassword,
    total_amount: amountBdt.toFixed(2),
    currency: "BDT",
    tran_id: tranId,
    success_url: `${origin}/api/sslcommerz/success`,
    fail_url: `${origin}/api/sslcommerz/fail`,
    cancel_url: `${origin}/api/sslcommerz/cancel`,
    ipn_url: `${origin}/api/sslcommerz/ipn`,
    shipping_method: "Courier",
    num_of_item: String(order.items.reduce((n, i) => n + i.qty, 0)),
    product_name: `ShopHub order ${orderId.slice(0, 8).toUpperCase()}`,
    product_category: "General",
    product_profile: "physical-goods",
    cus_name: c.name,
    cus_email: c.email,
    cus_add1: a.address,
    cus_city: a.city,
    cus_postcode: a.postalCode,
    cus_country: a.country,
    cus_phone: c.phone,
    ship_name: c.name,
    ship_add1: a.address,
    ship_city: a.city,
    ship_postcode: a.postalCode,
    ship_country: a.country,
    value_a: orderId, // comes back to us unchanged
  };
}

// Asks SSLCommerz for a payment page. Resolves to { ok: true, url } or { ok: false, reason }.
export async function initSession(cfg, params, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(cfg.initUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    });
    const data = await res.json();
    if (data.status === "SUCCESS" && data.GatewayPageURL) return { ok: true, url: data.GatewayPageURL };
    return { ok: false, reason: data.failedreason || "SSLCommerz did not start the payment." };
  } catch (err) {
    return { ok: false, reason: "Could not reach SSLCommerz. Please try again." };
  }
}

// Asks SSLCommerz whether a payment really happened (never trust the browser for this).
export async function validatePayment(cfg, valId, fetchImpl = fetch) {
  const qs = new URLSearchParams({ val_id: valId, store_id: cfg.storeId, store_passwd: cfg.storePassword, format: "json" });
  const res = await fetchImpl(`${cfg.validateUrl}?${qs}`);
  return res.json();
}

// Compares SSLCommerz's answer with our order. Returns { ok: true } or { ok: false, reason }.
export function judgePayment(order, validation) {
  const g = order.gateway || {};
  if (!validation || (validation.status !== "VALID" && validation.status !== "VALIDATED")) {
    return { ok: false, reason: "Payment was not validated." };
  }
  if (validation.tran_id !== g.tranId) return { ok: false, reason: "Transaction id does not match." };
  const paid = Number(validation.amount);
  const alsoPaid = Number(validation.currency_amount);
  const expected = Number(g.amountBdt);
  const matches = (n) => Number.isFinite(n) && Math.abs(n - expected) < 0.01;
  if (!matches(paid) && !matches(alsoPaid)) return { ok: false, reason: "Paid amount does not match the order." };
  return { ok: true };
}
