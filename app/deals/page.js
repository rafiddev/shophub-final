"use client";

import { Suspense } from "react";
import Deals from "@/components/Deals";
import ProductBrowser from "@/components/ProductBrowser";
import { getProductsByCategory } from "@/lib/api";

// Deal cards on top, then every product with the biggest discounts first.
export default function DealsPage() {
  return (
    <>
      <Deals heading="Today's Deals" />
      <Suspense fallback={null}>
        <ProductBrowser
          title="All deals"
          subtitle="Sorted by the biggest discount."
          load={() => getProductsByCategory("all")}
          loadKey="deals"
          defaultSort="discount"
        />
      </Suspense>
    </>
  );
}
