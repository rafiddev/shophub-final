"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductGrid, { ErrorState, ProductSkeletons } from "@/components/ProductGrid";
import { SORT_OPTIONS, sortProducts } from "@/lib/sorts";
import { salePrice } from "@/lib/format";
import { COLORS, SIZES, colorHex, getVariants } from "@/lib/variants";

const PAGE_SIZE = 12;

// Shared by the category page and the search page:
// loads products with `load()`, then offers sorting, a price filter and "load more".
export default function ProductBrowser({ title, subtitle, load, loadKey, defaultSort = "featured" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  // The chosen sort lives in the URL (?sort=price-asc) so it survives refresh and can be shared.
  const sortParam = params.get("sort");
  const sort = SORT_OPTIONS.some((o) => o.value === sortParam) ? sortParam : defaultSort;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await load());
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);

  useEffect(() => {
    fetchProducts();
    setVisible(PAGE_SIZE);
    setMinPrice("");
    setMaxPrice("");
    setColor("");
    setSize("");
  }, [fetchProducts]);

  function changeSort(value) {
    const next = new URLSearchParams(params.toString());
    if (value === defaultSort) next.delete("sort");
    else next.set("sort", value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setVisible(PAGE_SIZE);
  }

  const filtered = useMemo(() => {
    const min = minPrice === "" ? 0 : Number(minPrice);
    const max = maxPrice === "" ? Infinity : Number(maxPrice);
    return products.filter((p) => {
      const price = salePrice(p);
      if (price < min || price > max) return false;
      if (color || size) {
        const v = getVariants(p); // demo variants, see lib/variants.js
        if (color && !v.colors.includes(color)) return false;
        if (size && !v.sizes.includes(size)) return false;
      }
      return true;
    });
  }, [products, minPrice, maxPrice, color, size]);

  const sorted = useMemo(() => sortProducts(filtered, sort), [filtered, sort]);
  const shown = sorted.slice(0, visible);

  return (
    <div className="wrap pt-7 pb-16">
      <nav className="mb-3.5 flex flex-wrap gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand">Home</Link> <span>/</span> <span>{title}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
        </div>
      </div>

      <div className="my-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface px-4 py-3">
        <p className="text-[15px] text-muted" aria-live="polite">
          {loading ? "Loading products..." : `${sorted.length} ${sorted.length === 1 ? "product" : "products"}`}
        </p>

        <div className="flex flex-wrap items-center gap-5 max-sm:w-full">
          <div className="flex items-center gap-2 text-sm text-muted">
            <label htmlFor="minPrice">Price</label>
            <input className="w-20 h-[38px] rounded-md border border-line bg-white px-2.5 text-sm text-ink focus:border-brand focus:outline-2 focus:outline-tint" id="minPrice" type="number" min="0" inputMode="decimal" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            <span>–</span>
            <input className="w-20 h-[38px] rounded-md border border-line bg-white px-2.5 text-sm text-ink focus:border-brand focus:outline-2 focus:outline-tint" id="maxPrice" type="number" min="0" inputMode="decimal" placeholder="Max" aria-label="Maximum price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted">
            <label htmlFor="sortBy">Sort by</label>
            <select className="h-[38px] rounded-md border border-line bg-white px-2.5 text-sm text-ink focus:border-brand focus:outline-2 focus:outline-tint" id="sortBy" value={sort} onChange={(e) => changeSort(e.target.value)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Filter by colour and size">
        <span className="mr-0.5 text-sm font-semibold text-body">Color</span>
        {COLORS.map((c) => (
          <button
            key={c.name}
            type="button"
            className={`size-6 rounded-full border-2 border-white p-0 ${
              color === c.name ? "shadow-[0_0_0_2px_#2563eb]" : "shadow-[0_0_0_1px_#e5e7eb]"
            }`}
            style={{ background: colorHex(c.name) }}
            title={c.name}
            aria-label={c.name}
            aria-pressed={color === c.name}
            onClick={() => { setColor(color === c.name ? "" : c.name); setVisible(PAGE_SIZE); }}
          />
        ))}
        <span className="mr-0.5 ml-3.5 text-sm font-semibold text-body">Size</span>
        {SIZES.map((sz) => (
          <button
            key={sz}
            type="button"
            className={`rounded-md border px-2.5 py-1 text-sm ${
              size === sz ? "border-brand bg-brand text-white" : "border-line bg-white"
            }`}
            aria-pressed={size === sz}
            onClick={() => { setSize(size === sz ? "" : sz); setVisible(PAGE_SIZE); }}
          >
            {sz}
          </button>
        ))}
        {(color || size) && (
          <button type="button" className="btn-link !text-[13px] !text-brand" onClick={() => { setColor(""); setSize(""); }}>Clear</button>
        )}
      </div>

      {loading && <ProductSkeletons count={8} />}

      {error && !loading && (
        <ErrorState message={error} onRetry={fetchProducts} />
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className="notice"><p>No products match your filters.</p></div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <>
          <ProductGrid products={shown} />
          {visible < sorted.length && (
            <div className="mt-8 flex justify-center">
              <button className="btn-outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Load more ({sorted.length - visible} left)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
