"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { authErrorMessage } from "@/lib/store/authSlice";
import Avatar from "@/components/Avatar";
import ProductGrid from "@/components/ProductGrid";
import { getProduct } from "@/lib/api";
import { formatDate, formatDay, money, orderNumber, paymentSummary, statusLabel } from "@/lib/format";
import { Heart, LayoutDashboard, LogOut, Package, ShoppingCart, User, Wallet } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "orders", label: "My Orders", Icon: Package },
  { id: "wishlist", label: "Wishlist", Icon: Heart },
  { id: "profile", label: "Profile", Icon: User },
];

// Colours for the small order status badge. Pending orders are blue inside the order lists, amber elsewhere.
function statusClass(status, inOrder = false) {
  const colour =
    status === "delivered" || status === "shipped"
      ? "bg-[#dcfce7] text-[#166534]"
      : status === "cancelled"
        ? "bg-[#fee2e2] text-[#991b1b]"
        : status === "pending" && inOrder
          ? "bg-tint text-brand-dark"
          : "bg-[#fef3c7] text-[#92400e]";
  return `inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${colour}`;
}

const ORDER = "rounded-lg border border-line px-5 py-4";

// The products of one order, one per row (a list, not side by side).
function OrderItems({ items }) {
  return (
    <ul className="divide-y divide-[#f3f4f6]">
      {items.map((i) => (
        <li key={i.id} className="flex items-center gap-3 py-2.5 text-sm">
          <img className="h-[42px] w-12 flex-none rounded-sm border border-line bg-white object-contain" src={i.thumbnail} alt="" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{i.title}</span>
            <small className="text-muted">Qty {i.qty} · {money(i.price)} each</small>
          </span>
          <b>{money(i.price * i.qty)}</b>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- overview: stat cards + recent orders ---------------- */
function Overview() {
  const { orders, ordersError, wishlist, count } = useApp();

  // Cancelled orders are not counted as money spent.
  const spent = (orders || []).filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { Icon: Package, value: orders ? orders.length : "–", label: "Orders" },
    { Icon: Heart, value: wishlist.length, label: "Wishlist" },
    { Icon: ShoppingCart, value: count, label: "Items in cart" },
    { Icon: Wallet, value: orders ? money(spent) : "–", label: "Total spent" },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
        {stats.map(({ Icon, value, label }) => (
          <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-5" key={label}>
            <Icon size={20} className="mb-2 text-brand" />
            <b className="text-[28px] leading-8">{value}</b>
            <span className="text-[15px] text-muted">{label}</span>
          </div>
        ))}
      </div>

      <h2 className="mb-3 pt-7 text-lg leading-7 font-bold">Recent orders</h2>
      {ordersError && <div className="notice notice-error"><p>{ordersError}</p></div>}
      {!ordersError && !orders && <div className="skeleton h-[120px]" />}
      {!ordersError && orders && orders.length === 0 && (
        <div className="notice"><p>You haven&apos;t placed any orders yet.</p><Link href="/products" className="btn-primary">Start shopping</Link></div>
      )}
      {orders && orders.length > 0 && (
        <div className="grid gap-4">
          {orders.slice(0, 3).map((o) => (
            <article className={ORDER} key={o.id}>
              <header className="mb-3 flex items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <b className="text-base">{orderNumber(o.id)}</b>
                  <small className="block text-muted">{formatDay(o.createdAt)} · {paymentSummary(o)}</small>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className={statusClass(o.status, true)}>{statusLabel(o.status)}</span>
                  <b className="text-base">{money(o.total)}</b>
                </div>
              </header>
              <OrderItems items={o.items} />
            </article>
          ))}
          {orders.length > 3 && <Link href="/dashboard?tab=orders" className="btn-link">View all {orders.length} orders</Link>}
        </div>
      )}
    </>
  );
}

/* ---------------- orders (live from Firestore) ---------------- */
function Orders() {
  // `orders` comes from the Redux store; AppProvider keeps it in sync with Firestore in real time.
  const { orders, ordersError: error, cancelOrder, toast } = useApp();

  async function cancel(id) {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await cancelOrder(id);
      toast("Order cancelled");
    } catch {
      toast("Could not cancel this order", "error");
    }
  }

  if (error) return <div className="notice notice-error"><p>{error}</p></div>;
  if (!orders) return <div className="skeleton h-40" />;
  if (orders.length === 0)
    return (
      <div className="notice"><p>You haven&apos;t placed any orders yet.</p><Link href="/category/all" className="btn-primary">Start shopping</Link></div>
    );

  return (
    <div className="grid gap-4">
      {orders.map((o) => (
        <article className={ORDER} key={o.id}>
          <header className="flex items-center justify-between gap-3">
            <div>
              <b>{orderNumber(o.id)}</b>
              <small className="block text-muted">{formatDate(o.createdAt)} · {paymentSummary(o)}</small>
            </div>
            <span className={statusClass(o.status, true)}>{statusLabel(o.status)}</span>
          </header>
          <OrderItems items={o.items} />
          <footer className="mt-1 flex items-center justify-between gap-3 border-t border-line pt-3">
            <span>
              Total <b>{money(o.total)}</b>
              {o.discount > 0 && <small className="ml-2 text-ok">({o.promoCode} saved {money(o.discount)})</small>}
              {o.dueOnDelivery > 0 && o.paymentStatus === "partial" && <small className="ml-2 text-muted">Due on delivery: {money(o.dueOnDelivery)}</small>}
            </span>
            {o.status === "pending" && (!o.paymentStatus || o.paymentStatus === "unpaid") && (
              <button className="link-danger" onClick={() => cancel(o.id)}>Cancel order</button>
            )}
          </footer>
        </article>
      ))}
    </div>
  );
}

/* ---------------- wishlist ---------------- */
function Wishlist() {
  const { wishlist } = useApp();
  const [products, setProducts] = useState(null);
  const key = wishlist.join(",");

  useEffect(() => {
    let cancelled = false;
    Promise.all(wishlist.map((id) => getProduct(id).catch(() => null))).then((list) => {
      if (!cancelled) setProducts(list.filter(Boolean));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (wishlist.length === 0)
    return <div className="notice"><p>Your wishlist is empty. Tap the heart on any product to save it.</p><Link href="/category/all" className="btn-primary">Browse products</Link></div>;
  if (!products) return <div className="skeleton h-40" />;
  return <ProductGrid products={products} />;
}

/* ---------------- profile ---------------- */
function Profile() {
  const { user, profile, updateProfileInfo, uploadAvatar, resendVerification, resetPassword, toast } = useApp();
  const [form, setForm] = useState({ displayName: "", phone: "", address: "", city: "", postalCode: "", country: "" });
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fill the form once the Firestore profile has arrived.
  useEffect(() => {
    if (profile === null || loaded) return;
    const a = profile.address || {};
    setForm({
      displayName: user.displayName || profile.displayName || "",
      phone: profile.phone || "",
      address: a.address || "",
      city: a.city || "",
      postalCode: a.postalCode || "",
      country: a.country || "",
    });
    setLoaded(true);
  }, [profile, loaded, user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfileInfo({
        displayName: form.displayName.trim(),
        phone: form.phone.trim(),
        address: { address: form.address.trim(), city: form.city.trim(), postalCode: form.postalCode.trim(), country: form.country.trim() },
      });
      toast("Profile saved");
    } catch (err) {
      toast(authErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      await uploadAvatar(file);
      toast("Profile photo updated");
    } catch (err) {
      toast(authErrorMessage(err), "error");
    } finally {
      setUploading(false);
    }
  }

  async function act(fn, ok) {
    try {
      await fn();
      toast(ok);
    } catch (err) {
      toast(authErrorMessage(err), "error");
    }
  }

  return (
    <div className="grid grid-cols-[2fr_1fr] items-start gap-6 max-md:grid-cols-1">
      <form className="panel" onSubmit={save}>
        <h2 className="card-title">Your details</h2>
        <div className="mb-3.5 flex flex-wrap gap-3.5">
          <div className="field flex-[1_1_100%]"><label htmlFor="pn">Full name</label><input id="pn" value={form.displayName} onChange={set("displayName")} /></div>
          <div className="field flex-[1_1_calc(50%-7px)] max-sm:basis-full"><label>Email</label><input value={user.email || ""} disabled /></div>
          <div className="field flex-[1_1_calc(50%-7px)] max-sm:basis-full"><label htmlFor="pp">Phone</label><input id="pp" type="tel" value={form.phone} onChange={set("phone")} /></div>
          <div className="field flex-[1_1_100%]"><label htmlFor="pa">Street address</label><input id="pa" value={form.address} onChange={set("address")} /></div>
          <div className="field flex-[1_1_calc(50%-7px)] max-sm:basis-full"><label htmlFor="pc">City</label><input id="pc" value={form.city} onChange={set("city")} /></div>
          <div className="field flex-[1_1_calc(50%-7px)] max-sm:basis-full"><label htmlFor="pz">Postal code</label><input id="pz" value={form.postalCode} onChange={set("postalCode")} /></div>
          <div className="field flex-[1_1_100%]"><label htmlFor="pk">Country</label><input id="pk" value={form.country} onChange={set("country")} /></div>
        </div>
        <button className="btn-primary" type="submit" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
      </form>

      <div className="panel">
        <h2 className="card-title">Profile photo</h2>
        <div className="mb-2 flex items-center gap-4">
          <Avatar user={user} className="size-[72px] text-[28px]" alt="Your profile" />
          <label className="btn-outline flex-1 cursor-pointer">
            {uploading ? "Uploading..." : "Upload photo"}
            <input type="file" accept="image/*" onChange={onPhoto} disabled={uploading} hidden />
          </label>
        </div>

        <h2 className="card-title mt-6">Account security</h2>
        <p className="mt-1.5 text-muted">
          Email status:{" "}
          {user.emailVerified ? <span className={statusClass("delivered")}>verified</span> : <span className={statusClass("pending")}>not verified</span>}
        </p>
        {!user.emailVerified && (
          <button className="btn-outline w-full" onClick={() => act(resendVerification, "Verification email sent")}>Resend verification email</button>
        )}
        <button className="btn-outline mt-2.5 w-full" onClick={() => act(() => resetPassword(user.email), "Password reset email sent")}>
          Send password reset email
        </button>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
function Dashboard() {
  const router = useRouter();
  const tabParam = useSearchParams().get("tab");
  const tab = TABS.some((t) => t.id === tabParam) ? tabParam : "overview";
  const { user, authReady, logout } = useApp();

  useEffect(() => {
    if (authReady && !user) router.replace("/login?next=/dashboard");
  }, [authReady, user, router]);

  const first = useMemo(() => (user?.displayName || "").split(" ")[0] || "there", [user]);

  if (!authReady || !user) return <div className="wrap pt-7 pb-16"><div className="skeleton h-60" /></div>;

  return (
    <div className="wrap pt-7 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar user={user} className="size-14 text-[22px]" />
          <div>
            <h1 className="page-title">Hello, {first}</h1>
            <p className="mt-0.5 text-muted">{user.email}</p>
          </div>
        </div>
        <button className="btn-outline" onClick={async () => { await logout(); router.push("/"); }}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="my-6 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map(({ id, label, Icon }) => (
          <Link key={id} href={`/dashboard?tab=${id}`} role="tab" aria-selected={tab === id} className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium whitespace-nowrap ${tab === id ? "border-brand text-brand" : "border-transparent text-muted hover:text-brand"}`} replace>
            <Icon size={16} /> {label}
          </Link>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "orders" && <Orders />}
      {tab === "wishlist" && <Wishlist />}
      {tab === "profile" && <Profile />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="wrap pt-7 pb-16"><div className="skeleton h-60" /></div>}>
      <Dashboard />
    </Suspense>
  );
}
