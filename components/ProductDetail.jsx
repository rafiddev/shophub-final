"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProduct } from "@/lib/api";
import { money, salePrice } from "@/lib/format";
import { prettyCategory } from "@/lib/categories";
import { Heart } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Stars from "@/components/Stars";

export default function ProductDetail({ id }) {
  const { addToCart, user, wishlist, toggleWishlist, toast } = useApp();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [image, setImage] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setProduct(null);
    setError("");
    setImage(0);
    getProduct(id)
      .then((p) => !cancelled && setProduct(p))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error)
    return (
      <div className="wrap pt-7 pb-16">
        <div className="notice notice-error"><p>{error}</p><Link href="/category/all" className="btn-outline">Back to products</Link></div>
      </div>
    );
  if (!product) return <div className="wrap pt-7 pb-16"><div className="skeleton h-[420px]" /></div>;

  const sale = salePrice(product);
  const hasDiscount = (product.discountPercentage || 0) >= 1;
  const images = product.images?.length ? product.images : [product.thumbnail];
  const liked = wishlist.includes(product.id);
  const inStock = (product.stock ?? 1) > 0;

  async function onWishlist() {
    if (!user) return toast("Log in to save items to your wishlist", "error");
    try {
      toast((await toggleWishlist(product.id)) ? "Added to wishlist" : "Removed from wishlist");
    } catch {
      toast("Could not update wishlist", "error");
    }
  }

  return (
    <div className="wrap pt-7 pb-16">
      <nav className="mb-3.5 flex flex-wrap gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand">Home</Link> <span>/</span>
        <Link href={`/category/${product.category}`} className="hover:text-brand">{prettyCategory(product.category)}</Link> <span>/</span>
        <span>{product.title}</span>
      </nav>

      <div className="mt-3 grid grid-cols-2 gap-10 max-md:grid-cols-1 max-md:gap-5">
        <div>
          <div className="flex h-[440px] items-center justify-center rounded-lg border border-line bg-surface max-md:h-80">
            <img className="max-h-full object-contain" src={images[image]} alt={product.title} />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2.5">
              {images.map((src, i) => (
                <button
                  key={src}
                  className={`size-[72px] rounded-md border-2 bg-surface p-1 ${i === image ? "border-brand" : "border-transparent"}`}
                  onClick={() => setImage(i)} aria-label={`Show image ${i + 1}`}>
                  <img className="h-full w-full object-contain" src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mt-1.5 text-muted">{product.brand || prettyCategory(product.category)}</p>
          <h1 className="page-title">{product.title}</h1>
          <Stars rating={product.rating} className="mt-2 block" />
          <div className="my-3.5 flex items-center gap-2.5">
            <span className="text-[30px] leading-7 font-bold">{money(sale)}</span>
            {hasDiscount && <s className="ml-2 text-sm text-faint">{money(product.price)}</s>}
            {hasDiscount && <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white">-{Math.round(product.discountPercentage)}%</span>}
          </div>
          <p className="my-4 leading-[1.6] text-muted">{product.description}</p>
          <p className={`my-3.5 text-sm font-semibold ${inStock ? "text-ok" : "text-danger"}`}>{inStock ? `In stock${product.stock ? ` (${product.stock} left)` : ""}` : "Out of stock"}</p>

          <div className="my-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex w-fit items-center gap-1 rounded-md border border-line">
              <button className="size-8 bg-transparent text-lg hover:text-brand" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">&minus;</button>
              <span className="min-w-6 text-center text-ink">{qty}</span>
              <button className="size-8 bg-transparent text-lg hover:text-brand" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">+</button>
            </div>
            <button className="btn-primary" disabled={!inStock} onClick={() => addToCart(product, qty)}>Add to cart</button>
            <button className={`btn-outline ${liked ? "!border-[#fecaca] !text-danger" : ""}`} onClick={onWishlist} aria-pressed={liked}>
              <Heart size={20} fill={liked ? "currentColor" : "none"} /> {liked ? "Saved" : "Wishlist"}
            </button>
          </div>

          <ul className="grid gap-1.5 text-sm text-muted">
            {product.shippingInformation && <li className="before:text-ok before:content-['✓_']">{product.shippingInformation}</li>}
            {product.returnPolicy && <li className="before:text-ok before:content-['✓_']">{product.returnPolicy}</li>}
            {product.warrantyInformation && <li className="before:text-ok before:content-['✓_']">{product.warrantyInformation}</li>}
          </ul>
        </div>
      </div>

      {product.reviews?.length > 0 && (
        <section>
          <h2 className="section-h pt-12 text-2xl">Customer reviews</h2>
          <div className="mt-4 grid grid-cols-3 gap-4 max-md:grid-cols-1">
            {product.reviews.map((r, i) => (
              <article key={i} className="rounded-lg border border-line p-4">
                <Stars rating={r.rating} />
                <p className="my-2 text-body">{r.comment}</p>
                <small className="text-muted">{r.reviewerName}</small>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
