"use client";

import { Suspense } from "react";
import ProductBrowser from "@/components/ProductBrowser";
import { getProductsByCategory } from "@/lib/api";
import { findGroup, prettyCategory } from "@/lib/categories";

function ShopView({ slug }) {
  const group = findGroup(slug);
  const title = slug === "all" ? "All Products" : group ? group.name : prettyCategory(decodeURIComponent(slug));

  return (
    <ProductBrowser
      title={title}
      subtitle={slug === "all" ? "Browse everything in the store." : `Shop the best of ${title.toLowerCase()}.`}
      load={() => getProductsByCategory(slug)}
      loadKey={slug}
    />
  );
}

// The category page (/category/[slug]) and the all-products page (/products) both use this.
// `slug` is a home category ("electronics"), a DummyJSON category ("smartphones") or "all".
export default function ShopPage({ slug = "all" }) {
  return (
    <Suspense fallback={<div className="wrap pt-7 pb-16"><p>Loading...</p></div>}>
      <ShopView slug={slug} />
    </Suspense>
  );
}
