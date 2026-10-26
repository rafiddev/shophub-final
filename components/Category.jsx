import Link from "next/link";
import { CATEGORY_GROUPS } from "@/lib/categories";

// "Shop by Category" row on the home page.
export default function Category() {
  return (
    <section id="categories">
      <div className="wrap">
        <h2 className="section-h text-center">Shop by Category</h2>
        <div className="flex justify-between gap-4 pt-8 pb-12 max-md:grid max-md:grid-cols-3 max-sm:grid-cols-2">
          {CATEGORY_GROUPS.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="group flex w-[182px] flex-col items-center max-md:w-auto">
              <img className="size-20 transition-transform group-hover:scale-[1.06]" src={c.img} alt="" />
              <span className="pt-4 text-base leading-6 font-medium transition-colors group-hover:text-brand">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
