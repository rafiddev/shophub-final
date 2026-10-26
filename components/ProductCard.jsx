"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { money, salePrice } from "@/lib/format";
import { prettyCategory } from "@/lib/categories";
import { Heart } from "lucide-react";
import Stars from "@/components/Stars";

export default function ProductCard({ product }) {
  const { addToCart, user, wishlist, toggleWishlist, toast } = useApp();

  const sale = salePrice(product);
  const hasDiscount = (product.discountPercentage || 0) >= 1;
  const liked = wishlist.includes(product.id);

  async function onWishlist() {
    if (!user) return toast("Log in to save items to your wishlist", "error");
    try {
      const added = await toggleWishlist(product.id);
      toast(added ? "Added to wishlist" : "Removed from wishlist");
    } catch {
      toast("Could not update wishlist", "error");
    }
  }

  return (
    <article className="relative flex flex-col rounded-lg border border-[#f3f4f6] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.05)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,.08)]">
      <Link href={`/product/${product.id}`} className="relative flex h-[200px] items-center justify-center overflow-hidden rounded-md bg-surface" aria-label={product.title}>
        <img className="h-full w-full object-contain" src={product.thumbnail} alt={product.title} loading="lazy" />
        {hasDiscount && <span className="absolute top-2 left-2 rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white">-{Math.round(product.discountPercentage)}%</span>}
      </Link>
      <button
        className={`absolute top-6 right-6 flex size-[34px] items-center justify-center rounded-full border bg-white ${
          liked ? "border-[#fecaca] text-danger" : "border-line text-muted hover:text-danger"
        }`}
        onClick={onWishlist} aria-label={liked ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={liked}>
        <Heart size={20} fill={liked ? "currentColor" : "none"} />
      </button>

      <Link href={`/product/${product.id}`}>
        <h3 className="mt-3.5 line-clamp-1 text-base font-semibold">{product.title}</h3>
      </Link>
      <p className="mt-1.5 mb-1 text-sm text-muted">{product.brand || prettyCategory(product.category)}</p>
      <Stars rating={product.rating} />

      <div className="mt-auto flex items-center justify-between pt-3.5">
        <div>
          <span className="text-xl leading-7 font-bold">{money(sale)}</span>
          {hasDiscount && <s className="ml-2 text-sm text-faint">{money(product.price)}</s>}
        </div>
        <button className="rounded-md leading-[0] transition hover:brightness-90 active:scale-[.93]" onClick={() => addToCart(product)} aria-label={`Add ${product.title} to cart`}>
          <img className="h-10 w-[50px]" src="/img/cart-btn.png" alt="" width="50" height="40" />
        </button>
      </div>
    </article>
  );
}
