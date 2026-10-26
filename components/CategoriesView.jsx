"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductBrowser from "@/components/ProductBrowser";
import { getProductsByCategory } from "@/lib/api";
import { CATEGORY_GROUPS, findGroup } from "@/lib/categories";

// /categories: the category tiles on top, products below.
// Click a tile to filter (/categories?cat=fashion); with no tile selected every product is shown.
export default function CategoriesView() {
  const params = useSearchParams();
  const cat = params.get("cat");
  const group = findGroup(cat);
  const slug = group ? group.slug : "all";

  return (
    <>
      <div className="wrap pt-7">
        <h1 className="page-title">All Categories</h1>
        <p className="mt-1.5 text-muted">Pick a category to filter the products below.</p>
        <div className="grid grid-cols-6 gap-4 pt-8 max-md:grid-cols-3 max-sm:grid-cols-2">
          {CATEGORY_GROUPS.map((c) => (
            <Link
              key={c.slug}
              href={slug === c.slug ? "/categories" : `/categories?cat=${c.slug}`}
              className={`group flex flex-col items-center rounded-lg border px-2 py-6 ${
                slug === c.slug
                  ? "border-brand-dark shadow-[inset_0_0_0_2px_#1e40af]"
                  : "border-line hover:shadow-[0_8px_20px_rgba(0,0,0,.08)]"
              }`}
              aria-current={slug === c.slug ? "true" : undefined}
              scroll={false}
            >
              <img className="size-20 transition-transform group-hover:scale-[1.06]" src={c.img} alt="" />
              <span className="pt-4 text-base leading-6 font-medium transition-colors group-hover:text-brand">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <ProductBrowser
        title={group ? group.name : "All Products"}
        subtitle={group ? `Shop the best of ${group.name.toLowerCase()}.` : "Browse everything in the store."}
        load={() => getProductsByCategory(slug)}
        loadKey={slug}
      />
    </>
  );
}
