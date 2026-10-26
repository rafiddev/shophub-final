# ShopHub (Next.js + Firebase)

E-commerce store built with Next.js (App Router), the DummyJSON products API and Firebase.

## Project layout

```
app/                  pages (each folder has a page.js): about, cart, categories, category/[slug],
                      checkout, dashboard, deals, login (log in + register tabs), product/[id],
                      products, search, plus layout.js, not-found.js, globals.css (Tailwind CSS v4 theme + a few shared classes)
components/           Header, Footer, Hero, Category, Featured, Deals, ProductCard, ProductGrid,
                      ProductBrowser (sorting + filters), ShopPage, ProductDetail, AboutContent,
                      AppProvider (Redux + Firebase listeners + useApp hook), Toast, Stars, RevealItem, SocialIcons
data/extra-products.json   sample books (DummyJSON has no books)
lib/                  api.js, categories.js, firebase.js, format.js, rtdb.js, sorts.js, variants.js
lib/store/            Redux Toolkit: authSlice, cartSlice, ordersSlice, wishlistSlice, uiSlice, storage, store
.env                  your Firebase keys (fill this in)
firestore.rules, storage.rules, database.rules.json, firebase.json   Firebase security rules
```

## Run it

```bash
npm install
# open the .env file and paste your Firebase keys after each = sign (see below)
npm run dev                  # http://localhost:3000
```

The `.env` file is already in the project with empty values. Fill it in and restart `npm run dev`
(Next.js only reads it when it starts). Without keys the shop still browses and sorts products;
login, checkout and newsletter show a "Firebase is not configured" notice.

## Firebase setup (about 5 minutes)

1. Go to https://console.firebase.google.com and **Add project**.
2. **Project settings > General > Your apps > Web (`</>`)**: register an app and copy the config values into `.env`.
3. **Build > Authentication > Get started > Sign-in method**: enable **Email/Password** and **Google**.
   Under Settings > Authorized domains, add your deployed domain (`localhost` is there by default).
4. **Build > Firestore Database > Create database** (production mode). Open the **Rules** tab, paste the contents of `firestore.rules`, then **Publish**.
5. Optional, **Build > Storage > Get started**: Rules tab, paste `storage.rules`, Publish. (Needed for profile photos; may require the Blaze plan.)
6. Optional, **Build > Realtime Database > Create database**: copy its URL into `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, then paste `database.rules.json` into its Rules tab and Publish. This turns on the "shoppers online" counter and an order copy.
7. Optional: **Project settings > Integrations > Google Analytics**, then copy the `measurementId` into `.env`.

Or with the Firebase CLI: `npm i -g firebase-tools && firebase login && firebase use <project-id> && firebase deploy --only firestore:rules,storage,database`.

## Features

| Area | What it does |
| --- | --- |
| Categories page | `/categories` shows the category tiles plus the products; click a tile to filter (`/categories?cat=fashion`) |
| Category page | `/category/[slug]` (and `/products`, `/deals`) load from DummyJSON (`electronics`, `fashion`, `home`, `sports`, `books`, `gaming`, `all`, or any raw DummyJSON category) |
| Sorting | Featured, price low/high, top rated, biggest discount, name A-Z / Z-A. Choice is kept in the URL (`?sort=price-asc`). Also a price range filter and "Load more" |
| Auth | Email/password register and login on one page (`/login`, `/login?tab=register`), **Username or email** login, a **demo account** button, Google sign-in, password reset email, email verification, friendly error messages, redirect back after login |
| Firestore | `users/{uid}` profile, saved address, wishlist and cart (cart syncs across devices); `orders/{id}` created at checkout; `subscribers/{email}` newsletter |
| Checkout | Login required, form validation, address prefilled from your profile, order saved to Firestore, then an "Order placed!" screen |
| Dashboard | Overview (orders, wishlist, cart items, total spent, recent orders), live My Orders list with cancel, wishlist, profile with photo upload |
| Storage | Profile photo upload (`avatars/{uid}`) |
| Analytics | `sign_up`, `login`, `add_to_cart`, `begin_checkout`, `purchase` and more (when a measurement id is set) |
| Security rules | Users can only read and write their own data; orders can only be created as `pending` and cancelled by their owner |
| Offline | Firestore persistent local cache |
| Realtime Database | Optional "shoppers online" counter (presence) and a copy of each order |
| State | Redux Toolkit store in `lib/store` (cart, auth, wishlist, orders, toasts) |

## Notes

- Payment is cash/card **on delivery**. No card details are collected. Use a payment provider (for example Stripe) if you want online payments.
- Order totals are calculated in the browser. For a real store, move this into a Cloud Function so prices can't be tampered with.
- Order status changes beyond "cancel" (processing, shipped, delivered) are meant for an admin panel or the Firebase console.
- DummyJSON has no real "books" category, so a few sample books live in `data/extra-products.json`.
- The Color / Size filters use demo values generated in `lib/variants.js` (DummyJSON has no colours or sizes). Replace `getVariants()` when you have real data.

## Demo login

On `/login`, the demo box signs in as `rafid` / `rafs`. This account is checked inside the app, and a real Firebase
account (`rafid@demo.shophub.app`) is created for it the first time, so orders and the wishlist are saved in Firestore
like for any customer. Any DummyJSON username and password also works in the "Username or email" field (for example
`emilys` / `emilyspass`). Emails ending in `@x.dummyjson.com` or `@demo.shophub.app` cannot be used on the Register form.
Demo accounts are shared by everyone who uses them, so don't put private data in them.

