"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { FREE_SHIPPING_MIN, money } from "@/lib/format";

export default function CartPage() {
  const { items, hydrated, subtotal, discount, shipping, total, promo, promoError, applyPromo, removePromo, setQty, removeItem, clearCart } = useApp();
  const [code, setCode] = useState("");
  const [promoMsg, setPromoMsg] = useState("");

  function onApply(e) {
    e.preventDefault();
    const r = applyPromo(code);
    setPromoMsg(r.ok ? "" : r.message);
    if (r.ok) setCode("");
  }

  if (!hydrated) return <div className="wrap pt-7 pb-16"><div className="skeleton h-60" /></div>;

  if (items.length === 0)
    return (
      <div className="wrap pt-7 pb-16">
        <h1 className="page-title">Your Cart</h1>
        <div className="notice">
          <p>Your cart is empty.</p>
          <Link href="/category/all" className="btn-primary">Start shopping</Link>
        </div>
      </div>
    );

  return (
    <div className="wrap pt-7 pb-16">
      <h1 className="page-title">Your Cart</h1>
      <div className="mt-6 grid grid-cols-[1fr_380px] items-start gap-8 max-lg:grid-cols-[1fr_320px] max-md:grid-cols-1">
        <div>
          {items.map((i) => (
            <div className="flex gap-3.5 border-b border-[#f3f4f6] py-4" key={i.id}>
              <Link href={`/product/${i.id}`}><img className="h-[76px] w-[88px] rounded-md bg-surface object-contain" src={i.thumbnail} alt={i.title} /></Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/product/${i.id}`}><b>{i.title}</b></Link>
                <span className="text-sm text-muted">{money(i.price)}</span>
                <div className="inline-flex w-fit items-center gap-1 rounded-md border border-line">
                  <button className="size-8 bg-transparent text-lg hover:text-brand" onClick={() => setQty(i.id, i.qty - 1)} aria-label="Decrease quantity">&minus;</button>
                  <span className="min-w-6 text-center text-ink">{i.qty}</span>
                  <button className="size-8 bg-transparent text-lg hover:text-brand" onClick={() => setQty(i.id, i.qty + 1)} aria-label="Increase quantity">+</button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <b>{money(i.price * i.qty)}</b>
                <button className="link-danger" onClick={() => removeItem(i.id)}>Remove</button>
              </div>
            </div>
          ))}
          <button className="btn-link" onClick={clearCart}>Clear cart</button>
        </div>

        <aside className="sticky top-[90px] rounded-lg border border-line bg-surface p-5 max-md:static">
          <h2 className="card-title pb-3">Order Summary</h2>

          {/* promo code */}
          <div className="mb-3 border-b border-line pb-4">
            {promo ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2.5 text-sm">
                <span>
                  <b className="text-ok">{promo.code}</b> applied
                  <small className="block text-muted">{promo.label}</small>
                </span>
                <button className="link-danger" onClick={removePromo}>Remove</button>
              </div>
            ) : (
              <form onSubmit={onApply} className="flex gap-2" noValidate>
                <label htmlFor="promo" className="sr-only">Promo code</label>
                <input
                  id="promo"
                  className="h-[42px] min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-base uppercase text-ink outline-none placeholder:normal-case placeholder:text-soft focus:border-brand focus:ring-3 focus:ring-tint"
                  placeholder="Promo code"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setPromoMsg(""); }}
                  autoComplete="off"
                />
                <button className="btn-outline" type="submit">Apply</button>
              </form>
            )}
            {(promoMsg || promoError) && <small className="err">{promoMsg || promoError}</small>}
            {!promo && <p className="mt-2 text-xs text-muted">Try <b>WELCOME10</b> for 10% off.</p>}
          </div>
          <div className="flex justify-between gap-4 py-2 text-body"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          {discount > 0 && (
            <div className="flex justify-between gap-4 py-2 text-ok"><span>Discount ({promo.code})</span><span>&minus;{money(discount)}</span></div>
          )}
          <div className="flex justify-between gap-4 py-2 text-body"><span>Shipping</span><span>{shipping === 0 ? "Free" : money(shipping)}</span></div>
          {shipping > 0 && <p className="mb-2 text-[13px] text-brand">Add {money(FREE_SHIPPING_MIN - subtotal)} more for free shipping.</p>}
          <div className="mt-2 flex justify-between gap-4 border-t border-line py-2 pt-3.5 text-lg font-bold text-ink"><span>Total</span><span>{money(total)}</span></div>
          <Link href="/checkout" className="btn-primary w-full">Proceed to checkout</Link>
          <p className="mt-2 text-center text-xs text-muted">No account needed. You can check out as a guest.</p>
          <Link href="/category/all" className="btn-link mt-3 block text-center">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
