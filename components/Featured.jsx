"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProductGrid, { ErrorState, ProductSkeletons } from "@/components/ProductGrid";
import { getFeaturedProducts } from "@/lib/api";

// Featured products on the home page: a random selection of top rated items (DummyJSON API).
export default function Featured() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await getFeaturedProducts(4));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section id="featured" className="bg-surface pb-16">
      <div className="wrap">
        <div className="flex items-end justify-between">
          <h2 className="section-h">Featured Products</h2>
          <Link href="/products" className="pb-1.5 text-base font-medium text-brand hover:underline">View All</Link>
        </div>
        <div className="mt-8">
          {loading && <ProductSkeletons count={4} />}
          {error && !loading && <ErrorState message={error} onRetry={load} />}
          {!loading && !error && <ProductGrid products={products} />}
        </div>
      </div>
    </section>
  );
}
