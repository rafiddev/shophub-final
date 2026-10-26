import Link from "next/link";
import RevealItem from "@/components/RevealItem";

const FAQ = [
  ["How do I place an order?", "Add items to your cart, log in, and press Checkout. Fill in your shipping details and press Place order."],
  ["Which payment methods do you accept?", "Cash on delivery and card on delivery. We never ask for card details on the website."],
  ["Can I cancel my order?", "Yes. While an order is still Pending you can cancel it from Dashboard > My Orders."],
  ["Do I need an account?", "You can browse and fill a cart as a guest, but you need a free account to check out and track orders."],
];

// The About page: story, shipping, returns, contact and FAQ. Footer links point at the #ids.
export default function AboutContent() {
  return (
    <div className="wrap pt-7 pb-16">
      <RevealItem>
        <h1 className="page-title">About ShopHub</h1>
        <p className="mt-2 mb-6 max-w-[720px] text-lg leading-7 text-muted">
          ShopHub is your one-stop shop for electronics, fashion, home, sports, books and gaming. We keep prices fair,
          shipping simple and returns easy.
        </p>
      </RevealItem>

      <RevealItem>
        <section id="shipping" className="panel mb-5 scroll-mt-22.5">
          <h2 className="card-title text-[22px]">Shipping info</h2>
          <ul className="grid gap-1.5 text-sm text-muted">
            <li className="before:text-ok before:content-['✓_']">Free shipping on orders over $50, otherwise a flat $4.99.</li>
            <li className="before:text-ok before:content-['✓_']">Orders are packed within 1-2 business days.</li>
            <li className="before:text-ok before:content-['✓_']">Delivery usually takes 3-7 business days.</li>
          </ul>
        </section>
      </RevealItem>

      <RevealItem>
        <section id="returns" className="panel mb-5 scroll-mt-[90px]">
          <h2 className="card-title text-[22px]">Returns</h2>
          <p className="mb-3.5">Not happy? Return unused items within 30 days for a full refund. Contact us with your order number to start a return.</p>
        </section>
      </RevealItem>

      <RevealItem>
        <section id="faq" className="panel mb-5 scroll-mt-[90px]">
          <h2 className="card-title text-[22px]">FAQ</h2>
          {FAQ.map(([q, a]) => (
            <details key={q} className="border-t border-line py-3">
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-2 text-muted">{a}</p>
            </details>
          ))}
        </section>
      </RevealItem>

      <RevealItem>
        <section id="contact" className="panel mb-5 scroll-mt-[90px]">
          <h2 className="card-title text-[22px]">Contact us</h2>
          <p className="mb-3.5">Email <a href="mailto:support@shophub.example">support@shophub.example</a> and we reply within one business day.</p>
          <Link href="/products" className="btn-primary">Start shopping</Link>
        </section>
      </RevealItem>
    </div>
  );
}
