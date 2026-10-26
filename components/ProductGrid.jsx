import ProductCard from "@/components/ProductCard";

const GRID = "grid grid-cols-4 gap-6 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1";

export function ProductSkeletons({ count = 8 }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-lg border border-[#f3f4f6] bg-white p-4">
          <div className="skeleton h-[190px]" />
          <div className="skeleton mt-4 h-[18px] w-[70%]" />
          <div className="skeleton mt-2.5 h-3.5 w-[40%]" />
          <div className="skeleton mt-5 h-9" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="notice notice-error">
      <p>{message}</p>
      {onRetry && <button className="btn-outline" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export default function ProductGrid({ products }) {
  return (
    <div className={GRID}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
