"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CircleAlert, CircleCheck, Clock } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { track } from "@/lib/firebase";
import { money, orderNumber, paymentSummary } from "@/lib/format";

// The page the customer lands on after placing an order (and after paying on SSLCommerz).
// It works for guests too: the long random order id in the address is the key to the order.
export default function OrderView() {
  const { id } = useParams();
  const from = useSearchParams().get("from"); // "cod" or "success" right after ordering, "fail"/"cancel" after a bad payment
  const { user, clearCart } = useApp();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [tries, setTries] = useState(0);
  const done = useRef(false);

  // Load the order. While an online payment is still being confirmed, ask again a few times.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) return setError(data.error || "We could not load this order.");
        setOrder(data);
        if (data.paymentMethod === "sslcommerz" && data.paymentStatus === "pending" && tries < 6) {
          setTimeout(() => !cancelled && setTries((t) => t + 1), 3000);
        }
      } catch {
        if (!cancelled) setError("We could not load this order. Please check your connection.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, tries]);

  const ok = order && (order.paymentMethod === "cod" || order.paymentStatus === "paid" || order.paymentStatus === "partial");

  // Just ordered: empty the cart (online payment) and tell analytics once.
  useEffect(() => {
    if (!ok || done.current || (from !== "success" && from !== "cod")) return;
    done.current = true;
    if (from === "success") clearCart();
    track("purchase", { transaction_id: id, currency: "USD", value: order.total });
  }, [ok, from, id, order, clearCart]);

  if (error)
    return (
      <div className="wrap pt-7 pb-16">
        <div className="notice notice-error">
          <p>{error}</p>
          <Link href="/" className="btn-outline">Back to the shop</Link>
        </div>
      </div>
    );
  if (!order) return <div className="wrap pt-7 pb-16"><div className="skeleton h-[240px]" /></div>;

  const waiting = order.paymentMethod === "sslcommerz" && order.paymentStatus === "pending";
  const failed = order.paymentStatus === "failed" || order.paymentStatus === "cancelled";

  let Icon = CircleCheck;
  let tone = "text-[#22c55e]";
  let title = "Order placed!";
  let text = `Thank you${order.firstName ? `, ${order.firstName}` : ""}! Your order is being processed.`;
  if (order.paymentStatus === "paid") title = "Payment received!";
  if (order.paymentStatus === "partial") {
    title = "Advance payment received!";
    text = `Thank you${order.firstName ? `, ${order.firstName}` : ""}! Please keep ${money(order.dueOnDelivery)} ready for delivery.`;
  }
  if (waiting) {
    Icon = Clock;
    tone = "text-brand";
    title = "Confirming your payment...";
    text = "This usually takes a few seconds. You can keep this page open.";
  }
  if (failed) {
    Icon = CircleAlert;
    tone = "text-danger";
    title = order.paymentStatus === "cancelled" ? "Payment cancelled" : "Payment failed";
    text = "No money was taken and this order was not placed. Your cart is still saved, so you can try again.";
  }

  return (
    <div className="wrap pt-7 pb-16">
      <div className="mx-auto max-w-[640px]">
        <div className="text-center">
          <Icon size={56} className={`mx-auto mt-6 mb-2 block ${tone}`} aria-hidden="true" />
          <h1 className="page-title">{title}</h1>
          <p className="mt-1.5 text-muted">{text}</p>
        </div>

        <div className="panel mt-6">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <small className="block text-muted">Order number</small>
              <b className="text-lg">{orderNumber(order.id)}</b>
            </div>
            <span className="text-right text-sm text-muted">{paymentSummary(order)}</span>
          </div>
          <ul>
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-2.5 py-2 text-sm">
                <img className="h-[42px] w-12 rounded-sm border border-line bg-white object-contain" src={i.thumbnail} alt="" />
                <span className="min-w-0 flex-1">{i.title}<small className="block text-muted">Qty {i.qty}</small></span>
                <b>{money(i.price * i.qty)}</b>
              </li>
            ))}
          </ul>
          <div className="mt-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between py-1 text-body"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between py-1 text-ok"><span>Discount ({order.promoCode})</span><span>&minus;{money(order.discount)}</span></div>
            )}
            <div className="flex justify-between py-1 text-body"><span>Shipping</span><span>{order.shipping === 0 ? "Free" : money(order.shipping)}</span></div>
            <div className="flex justify-between py-1 text-base font-bold text-ink"><span>Total</span><span>{money(order.total)}</span></div>
            {order.paymentMethod === "sslcommerz" && order.paidAmount > 0 && (
              <div className="flex justify-between py-1 text-ok"><span>Paid online</span><span>{money(order.paidAmount)}</span></div>
            )}
            {!failed && order.dueOnDelivery > 0 && (
              <div className="flex justify-between py-1 font-semibold text-ink"><span>Due on delivery</span><span>{money(order.dueOnDelivery)}</span></div>
            )}
          </div>
        </div>

        {order.guest && !failed && (
          <p className="mt-4 text-center text-sm text-muted">
            Save your order number <b>{orderNumber(order.id)}</b>. Want to track orders later?{" "}
            <Link href="/login?tab=register" className="font-semibold text-brand underline">Create an account</Link>
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {failed ? (
            <Link href="/checkout" className="btn-primary">Try again</Link>
          ) : user && !order.guest ? (
            <Link href="/dashboard?tab=orders" className="btn-primary">View my orders</Link>
          ) : null}
          <Link href="/products" className="btn-outline">Keep shopping</Link>
        </div>
      </div>
    </div>
  );
}
