"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured, track } from "@/lib/firebase";
import { watchOnlineCount } from "@/lib/rtdb";
import { useApp } from "@/components/AppProvider";
import { FacebookIcon, InstagramIcon, TwitterIcon } from "@/components/SocialIcons";

export default function Footer() {
  const { toast } = useApp();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(null);

  // Realtime Database: how many shoppers have the site open right now (optional).
  useEffect(() => watchOnlineCount(setOnline), []);

  // Newsletter signups are saved in Firestore: subscribers/{email}
  async function onSubscribe(e) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(value)) return toast("Please enter a valid email", "error");
    if (!isFirebaseConfigured) return toast("Firebase is not configured yet (see README).", "error");
    setBusy(true);
    try {
      await setDoc(doc(db, "subscribers", value), { email: value, createdAt: serverTimestamp() });
      track("newsletter_signup");
      toast("Subscribed! Thanks for joining.");
      setEmail("");
    } catch {
      toast("Could not subscribe right now. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="bg-ink text-white" id="footer">
      <div className="wrap">
        <div className="grid grid-cols-4 gap-8 border-b border-[#1f2937] pt-12 pb-14 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <div>
            <img className="block h-9 w-auto" src="/img/logo-light.svg" alt="ShopHub" width="135" height="36" />
            <p className="my-4 text-base leading-6 text-faint">Your one-stop shop for everything you need.</p>
            <div className="flex gap-4">
              <a href="#" className="text-white transition-colors hover:text-brand-light" aria-label="Facebook"><FacebookIcon /></a>
              <a href="#" className="text-white transition-colors hover:text-brand-light" aria-label="Twitter"><TwitterIcon /></a>
              <a href="#" className="text-white transition-colors hover:text-brand-light" aria-label="Instagram"><InstagramIcon /></a>
            </div>
          </div>

          <div>
            <h3 className="text-base leading-6 font-semibold">Quick Links</h3>
            <ul className="pt-4">
              <li className="pb-1.5"><Link href="/" className="text-base leading-6 text-faint transition-colors hover:text-white">Home</Link></li>
              <li className="pb-1.5"><Link href="/categories" className="text-base leading-6 text-faint transition-colors hover:text-white">Categories</Link></li>
              <li className="pb-1.5"><Link href="/deals" className="text-base leading-6 text-faint transition-colors hover:text-white">Deals</Link></li>
              <li className="pb-1.5"><Link href="/about" className="text-base leading-6 text-faint transition-colors hover:text-white">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-base leading-6 font-semibold">Customer Service</h3>
            <ul className="pt-4">
              <li className="pb-1.5"><Link href="/about#contact" className="text-base leading-6 text-faint transition-colors hover:text-white">Contact Us</Link></li>
              <li className="pb-1.5"><Link href="/about#shipping" className="text-base leading-6 text-faint transition-colors hover:text-white">Shipping Info</Link></li>
              <li className="pb-1.5"><Link href="/about#returns" className="text-base leading-6 text-faint transition-colors hover:text-white">Returns</Link></li>
              <li className="pb-1.5"><Link href="/about#faq" className="text-base leading-6 text-faint transition-colors hover:text-white">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-base leading-6 font-semibold">Newsletter</h3>
            <p className="my-4 text-base leading-6 text-faint">Subscribe for updates and deals</p>
            <form className="flex" onSubmit={onSubscribe} noValidate>
              <input
                className="h-10 min-w-0 flex-1 rounded-l-lg border border-r-0 border-line bg-white px-4 text-base text-ink outline-none"
                type="email"
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" aria-label="Email address" />
              <button type="submit" className="rounded-r-lg bg-brand-light px-3.5 text-base text-white not-disabled:hover:bg-brand" disabled={busy}>{busy ? "..." : "Subscribe"}</button>
            </form>
          </div>
        </div>
        <p className="mt-[33px] pb-8 text-center text-base text-faint">
          &copy; {new Date().getFullYear()} ShopHub. All rights reserved.
          {online > 0 && <span className="text-[#86efac]"> · {online} {online === 1 ? "shopper" : "shoppers"} online now</span>}
        </p>
      </div>
    </footer>
  );
}
