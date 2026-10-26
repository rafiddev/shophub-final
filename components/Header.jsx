"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/Avatar";
import { searchProducts } from "@/lib/api";
import { money, salePrice } from "@/lib/format";

// Shared Tailwind class strings for the header.
const ICON_BTN = "relative inline-flex items-center justify-center bg-transparent p-1.5 text-ink transition-colors hover:text-brand";
const DROP_ITEM = "block w-full px-4 py-2.5 text-left text-sm hover:bg-surface";
const PANEL = "overflow-hidden rounded-lg border border-line bg-white shadow-[0_10px_25px_rgba(0,0,0,.12)]";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "Deals", href: "/deals" },
  { label: "About", href: "/about" },
];

function SearchBox({ onDone }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  // Live suggestions, debounced so we don't call the API on every keystroke.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const data = await searchProducts(term, 5);
        if (!cancelled) setResults(data.slice(0, 5));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(e) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
    onDone?.();
  }

  function pick() {
    setOpen(false);
    setQ("");
    onDone?.();
  }

  return (
    <form
      className="relative ml-[81px] w-[480px] max-w-full max-lg:ml-8 max-lg:w-[300px] max-md:order-3 max-md:ml-0 max-md:w-full"
      onSubmit={submit}
      ref={boxRef}
      role="search"
      autoComplete="off"
    >
      <span className="pointer-events-none absolute top-[13px] left-[13px] leading-[0]"><Search size={16} color="#9CA3AF" /></span>
      <input
        className="h-[42px] w-full rounded-lg border border-soft bg-white pr-3 pl-10 text-base text-ink outline-none placeholder:text-soft focus:border-brand"
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search products..."
        aria-label="Search products"
      />
      {open && q.trim().length >= 2 && (
        <div className={`absolute inset-x-0 top-[calc(100%+4px)] z-50 ${PANEL}`}>
          {loading && <p className="px-4 py-3 text-sm text-muted">Searching...</p>}
          {!loading && results.length === 0 && <p className="px-4 py-3 text-sm text-muted">No products found</p>}
          {!loading &&
            results.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-surface" onClick={pick}>
                <img className="h-10 w-11 rounded-sm bg-surface object-contain" src={p.thumbnail} alt="" />
                <span>
                  <b className="block text-sm font-medium">{p.title}</b>
                  <small className="text-xs text-muted">{money(salePrice(p))}</small>
                </span>
              </Link>
            ))}
          {!loading && results.length > 0 && (
            <button type="submit" className="w-full border-t border-line bg-white px-4 py-2.5 text-left text-sm font-semibold text-brand hover:bg-surface">See all results for &quot;{q.trim()}&quot;</button>
          )}
        </div>
      )}
    </form>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, count, hydrated } = useApp();
  const [menu, setMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    setMenu(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Clicking a link to the page you are already on does not scroll up in the Next.js App Router,
  // so for the home page we scroll to the top ourselves.
  const toTopIfHere = (href) => (e) => {
    if (href === pathname) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    if (href === "/categories") return pathname.startsWith("/categories") || pathname.startsWith("/category/");
    return false;
  };

  async function handleLogout() {
    setProfileOpen(false);
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_3px_rgba(0,0,0,.1)]">
      <div className="wrap flex h-[69px] items-center max-md:h-auto max-md:flex-wrap max-md:gap-y-3 max-md:py-3">
        <Link href="/" className="flex-none" aria-label="ShopHub home" onClick={toTopIfHere("/")}>
          <img className="block h-9 w-auto" src="/img/logo.svg" alt="ShopHub" width="135" height="36" />
        </Link>

        <ul
          className={`ml-8 gap-[31px] max-md:order-4 max-md:m-0 max-md:w-full max-md:flex-col max-md:gap-3 max-md:px-1 max-md:pt-1 max-md:pb-2 ${
            menu ? "flex" : "flex max-md:hidden"
          }`}
        >
          {NAV.map((n) => (
            <li key={n.label}>
              <Link
                href={n.href}
                onClick={toTopIfHere(n.href)}
                className={`text-base leading-6 transition-colors ${isActive(n.href) ? "text-brand" : "text-body hover:text-brand"}`}
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>

        <SearchBox onDone={() => setMenu(false)} />

        <div className="ml-auto flex items-center gap-3">
          <Link href="/cart" className={ICON_BTN} aria-label="Cart">
            <ShoppingCart size={26} />
            {hydrated && count > 0 && <span className="absolute -top-1 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-[5px] text-xs font-semibold text-white">
                {count > 99 ? "99+" : count}
              </span>}
          </Link>

          <div className="relative" ref={profileRef}>
            {user ? (
              <button className={ICON_BTN} onClick={() => setProfileOpen((o) => !o)} aria-label="Account menu" aria-expanded={profileOpen}>
                <Avatar user={user} />
              </button>
            ) : (
              <Link href="/login" className={ICON_BTN} aria-label="Login"><User size={24} /></Link>
            )}

            {user && profileOpen && (
              <div className={`absolute top-[calc(100%+8px)] right-0 z-50 w-[230px] ${PANEL}`}>
                <div className="border-b border-line px-4 py-3">
                  <b className="block truncate">{user.displayName || "Customer"}</b>
                  <small className="mt-0.5 block truncate text-xs text-muted">{user.email}</small>
                </div>
                <Link href="/dashboard" className={`${DROP_ITEM} text-body`}>Dashboard</Link>
                <Link href="/dashboard?tab=orders" className={`${DROP_ITEM} text-body`}>My Orders</Link>
                <Link href="/dashboard?tab=wishlist" className={`${DROP_ITEM} text-body`}>Wishlist</Link>
                <button onClick={handleLogout} className={`${DROP_ITEM} border-t border-line text-danger`}>Logout</button>
              </div>
            )}
          </div>

          <button className={`${ICON_BTN} md:hidden`} onClick={() => setMenu((m) => !m)} aria-label="Toggle menu" aria-expanded={menu}>
            {menu ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>
    </header>
  );
}