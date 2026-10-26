"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp, ConfigNotice } from "@/components/AppProvider";
import { ADVANCE_PERCENTS, money, splitPayment, toBdt } from "@/lib/format";

const REQUIRED = {
  fullName: "Enter your full name.",
  email: "Enter a valid email address.",
  phone: "Enter a phone number we can reach you on.",
  address: "Enter your street address.",
  city: "Enter your city.",
  postalCode: "Enter your postal code.",
  country: "Enter your country.",
};

// Radio card used for the payment choices.
const choice = (on) => `mb-2.5 flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 ${on ? "border-brand bg-[#eff6ff]" : "border-line"}`;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile, items, hydrated, subtotal, discount, shipping, total, promo, clearCart, placeOrder, toast } = useApp();

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", address: "", city: "", postalCode: "", country: "", notes: "",
  });
  const [method, setMethod] = useState("cod"); // "cod" | "sslcommerz"
  const [percent, setPercent] = useState(100); // 100 = pay everything now, or an advance percent
  const [saveAddress, setSaveAddress] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [placing, setPlacing] = useState(false);
  const prefilled = useRef(false);

  // Logged-in customers: pre-fill the form from the Firebase account + saved Firestore profile (once).
  // Guests simply fill in the form themselves.
  useEffect(() => {
    if (!user || profile === null || prefilled.current) return;
    prefilled.current = true;
    const a = profile.address || {};
    setForm((f) => ({
      ...f,
      fullName: f.fullName || user.displayName || profile.displayName || "",
      email: f.email || user.email || "",
      phone: f.phone || profile.phone || "",
      address: f.address || a.address || "",
      city: f.city || a.city || "",
      postalCode: f.postalCode || a.postalCode || "",
      country: f.country || a.country || "",
    }));
  }, [user, profile]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  function validate() {
    const er = {};
    Object.entries(REQUIRED).forEach(([key, msg]) => {
      if (!form[key].trim()) er[key] = msg;
    });
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) er.email = REQUIRED.email;
    if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 7) er.phone = "Enter a valid phone number.";
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return toast("Please fix the highlighted fields", "error");
    if (items.length === 0) return;

    setPlacing(true);
    try {
      // The server saves the order (see app/api/checkout/route.js) and, for online payment, opens SSLCommerz.
      const { orderId, gatewayUrl } = await placeOrder({
        customer: { name: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() },
        shippingAddress: {
          address: form.address.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
        },
        paymentMethod: method,
        payPercent: method === "sslcommerz" ? percent : 100,
        notes: form.notes.trim(),
        saveAddress,
      });
      if (gatewayUrl) {
        window.location.href = gatewayUrl; // go to the SSLCommerz payment page; the cart is cleared after a successful payment
        return;
      }
      clearCart();
      router.push(`/order/${orderId}?from=cod`);
    } catch (err) {
      setPlacing(false);
      setSubmitError(err.message || "We couldn't place your order. Please try again.");
    }
  }

  if (!hydrated) return <div className="wrap pt-7 pb-16"><div className="skeleton h-[300px]" /></div>;

  if (placing)
    return (
      <div className="wrap pt-7 pb-16">
        <div className="notice"><p>{method === "sslcommerz" ? "Taking you to the secure payment page..." : "Placing your order..."}</p></div>
      </div>
    );

  if (items.length === 0)
    return (
      <div className="wrap pt-7 pb-16">
        <h1 className="page-title">Checkout</h1>
        <div className="notice"><p>Your cart is empty.</p><Link href="/category/all" className="btn-primary">Browse products</Link></div>
      </div>
    );

  const pay = splitPayment(total, method, percent);

  // A plain function (not a component) so inputs keep focus while typing.
  const field = (id, label, { type = "text", autoComplete, half } = {}) => (
    <div className={`field ${half ? "flex-[1_1_calc(50%-7px)] max-sm:basis-full" : "flex-[1_1_100%]"}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} autoComplete={autoComplete} value={form[id]} onChange={set(id)} aria-invalid={!!errors[id]} />
      {errors[id] && <small className="err">{errors[id]}</small>}
    </div>
  );

  return (
    <div className="wrap pt-7 pb-16">
      <h1 className="page-title">Checkout</h1>
      <ConfigNotice />

      {/* Guests can order without an account */}
      {!user && (
        <div className="mt-4 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e3a8a]">
          You are checking out as a <b>guest</b>. No account is needed.{" "}
          <Link href="/login?next=/checkout" className="font-semibold underline">Log in</Link> or{" "}
          <Link href="/login?tab=register&next=/checkout" className="font-semibold underline">create an account</Link> to track your orders later.
        </div>
      )}

      <form className="mt-6 grid grid-cols-[1fr_380px] items-start gap-8 max-lg:grid-cols-[1fr_320px] max-md:grid-cols-1" onSubmit={onSubmit} noValidate>
        <div className="grid gap-5">
          <section className="panel">
            <h2 className="card-title">Contact</h2>
            <div className="mb-3.5 flex flex-wrap gap-3.5">
              {field("fullName", "Full name", { autoComplete: "name" })}
              {field("email", "Email", { type: "email", autoComplete: "email", half: true })}
              {field("phone", "Phone", { type: "tel", autoComplete: "tel", half: true })}
            </div>
          </section>

          <section className="panel">
            <h2 className="card-title">Shipping address</h2>
            <div className="mb-3.5 flex flex-wrap gap-3.5">
              {field("address", "Street address", { autoComplete: "street-address" })}
              {field("city", "City", { autoComplete: "address-level2", half: true })}
              {field("postalCode", "Postal code", { autoComplete: "postal-code", half: true })}
              {field("country", "Country", { autoComplete: "country-name" })}
            </div>
            {user && (
              <label className="flex items-center gap-2 text-sm text-body">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                Save this address for next time
              </label>
            )}
            <div className="field mt-3.5">
              <label htmlFor="notes">Order notes (optional)</label>
              <textarea id="notes" rows={3} value={form.notes} onChange={set("notes")} />
            </div>
          </section>

          <section className="panel">
            <h2 className="card-title">Payment method</h2>

            <label className={choice(method === "cod")}>
              <input className="mt-1" type="radio" name="payment" value="cod" checked={method === "cod"} onChange={() => setMethod("cod")} />
              <span><b>Cash on delivery</b><small className="mt-0.5 block text-muted">Pay when your order arrives.</small></span>
            </label>

            <label className={choice(method === "sslcommerz")}>
              <input className="mt-1" type="radio" name="payment" value="sslcommerz" checked={method === "sslcommerz"} onChange={() => setMethod("sslcommerz")} />
              <span>
                <b>Pay online with SSLCommerz</b>
                <small className="mt-0.5 block text-muted">Visa, Mastercard, bKash, Nagad, Rocket and internet banking on the secure SSLCommerz page.</small>
              </span>
            </label>

            {method === "sslcommerz" && (
              <div className="mt-1 mb-1 rounded-lg bg-surface p-3.5">
                <p className="mb-2 text-sm font-semibold text-body">How much do you want to pay now?</p>
                <label className={choice(percent === 100)}>
                  <input className="mt-1" type="radio" name="percent" checked={percent === 100} onChange={() => setPercent(100)} />
                  <span><b>Full payment</b><small className="mt-0.5 block text-muted">Pay {money(total)} now.</small></span>
                </label>
                {ADVANCE_PERCENTS.map((p) => {
                  const s = splitPayment(total, "sslcommerz", p);
                  return (
                    <label key={p} className={choice(percent === p)}>
                      <input className="mt-1" type="radio" name="percent" checked={percent === p} onChange={() => setPercent(p)} />
                      <span>
                        <b>{p}% advance</b>
                        <small className="mt-0.5 block text-muted">Pay {money(s.payNow)} now and {money(s.due)} in cash when your order arrives.</small>
                      </span>
                    </label>
                  );
                })}
                <p className="text-xs text-muted">
                  SSLCommerz charges in Bangladeshi Taka: about <b>৳{toBdt(pay.payNow).toLocaleString("en-US")}</b> now.
                  We never see or store your card details.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="sticky top-[90px] rounded-lg border border-line bg-surface p-5 max-md:static">
          <h2 className="card-title pb-3">Order Summary</h2>
          <ul>
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-2.5 py-2 text-sm">
                <img className="h-[42px] w-12 rounded-sm border border-line bg-white object-contain" src={i.thumbnail} alt="" />
                <span className="min-w-0 flex-1">{i.title}<small className="block text-muted">Qty {i.qty}</small></span>
                <b>{money(i.price * i.qty)}</b>
              </li>
            ))}
          </ul>
          <div className="flex justify-between gap-4 py-2 text-body"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          {discount > 0 && (
            <div className="flex justify-between gap-4 py-2 text-ok"><span>Discount ({promo.code})</span><span>&minus;{money(discount)}</span></div>
          )}
          <div className="flex justify-between gap-4 py-2 text-body"><span>Shipping</span><span>{shipping === 0 ? "Free" : money(shipping)}</span></div>
          <div className="mt-2 flex justify-between gap-4 border-t border-line py-2 pt-3.5 text-lg font-bold text-ink"><span>Total</span><span>{money(total)}</span></div>
          {method === "sslcommerz" ? (
            <div className="mb-3 rounded-lg border border-line bg-white px-3 py-2.5 text-sm">
              <div className="flex justify-between gap-4"><span>Pay now</span><b>{money(pay.payNow)}</b></div>
              {pay.due > 0 && <div className="flex justify-between gap-4 text-muted"><span>Due on delivery</span><span>{money(pay.due)}</span></div>}
            </div>
          ) : (
            <p className="mb-3 text-sm text-muted">Pay {money(total)} in cash on delivery.</p>
          )}
          {submitError && <div className="form-error" role="alert">{submitError}</div>}
          <button className="btn-primary w-full" type="submit">
            {method === "sslcommerz" ? `Pay ${money(pay.payNow)} securely` : "Place order"}
          </button>
          <Link href="/cart" className="btn-link mt-3 block text-center">Back to cart</Link>
        </aside>
      </form>
    </div>
  );
}
