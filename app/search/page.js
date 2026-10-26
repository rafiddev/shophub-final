"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductBrowser from "@/components/ProductBrowser";
import { searchProducts } from "@/lib/api";

function SearchView() {
  const q = useSearchParams().get("q") || "";
  return (
    <ProductBrowser
      title={q ? `Results for "${q}"` : "Search"}
      load={() => searchProducts(q, 100)}
      loadKey={q}
    />
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="wrap pt-7 pb-16"><p>Loading...</p></div>}>
      <SearchView />
    </Suspense>
  );
}
