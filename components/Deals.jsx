import Link from "next/link";
import RevealItem from "@/components/RevealItem";

const DEALS = [
  { title: "Flash Sale", text: "Up to 50% off electronics", cta: "Shop Now", href: "/category/electronics?sort=discount", tone: "bg-linear-to-r from-[#ef4444] to-[#ec4899]", btn: "text-[#ef4444]" },
  { title: "Free Shipping", text: "On orders over $50", cta: "Learn More", href: "/about#shipping", tone: "bg-linear-to-r from-[#22c55e] to-[#14b8a6]", btn: "text-[#16a34a]" },
  { title: "Member Exclusive", text: "Extra 20% off for members", cta: "Join Now", href: "/login?tab=register", tone: "bg-linear-to-r from-[#a855f7] to-[#6366f1]", btn: "text-[#9333ea]" },
];

// The three deal cards ("Today's Deals"), used on the home page and the /deals page.
export default function Deals({ heading = "Today's Deals" }) {
  return (
    <section id="deals">
      <div className="wrap">
        <h2 className="section-h text-center">{heading}</h2>
        <div className="mt-8 grid grid-cols-3 gap-6 pb-[70px] max-md:grid-cols-1 max-md:pb-10">
          {DEALS.map((d, i) => (
            <RevealItem key={d.title} delay={i * 80}>
              <article className={`min-h-[168px] rounded-lg p-6 text-white ${d.tone}`}>
                <h3 className="text-2xl leading-8 font-bold">{d.title}</h3>
                <p className="mt-1 mb-4 text-base leading-6">{d.text}</p>
                <Link
                  href={d.href}
                  className={`inline-block rounded-md bg-white px-6 py-2 text-base font-medium transition-opacity hover:opacity-90 ${d.btn}`}
                >
                  {d.cta}
                </Link>
              </article>
            </RevealItem>
          ))}
        </div>
      </div>
    </section>
  );
}
