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

## Deploy (GitHub + Vercel)

1. Push the project to a new GitHub repository (`.env` is git-ignored, so your keys are not uploaded).
2. On https://vercel.com choose **Add New > Project**, import the repository, and keep the default Next.js settings.
3. Before pressing Deploy, open **Environment Variables** and add every `NEXT_PUBLIC_FIREBASE_*` value from your `.env`
   (you can paste the whole file into the first field). Variables are baked in at build time, so after changing them use **Redeploy**.
4. In the Firebase console go to **Authentication > Settings > Authorized domains** and add your Vercel domain
   (for example `shophub.vercel.app`). Without this, Google sign-in is blocked on the live site.
5. Make sure Email/Password and Google are enabled under **Authentication > Sign-in method**, and that `firestore.rules`
   is published. Then anyone can register, log in and place orders.

## Styling (Tailwind CSS v4)

The whole site is styled with Tailwind CSS. Most styling is utility classes written directly in the components
(`className="flex items-center gap-4 ..."`). `app/globals.css` holds only:

- the colour tokens in `@theme` (`brand`, `brand-dark`, `ink`, `muted`, `line`, `surface`, `danger`, ...) and the
  breakpoints (`max-lg` = below 1100px, `max-md` = below 860px, `max-sm` = below 560px),
- a few shared classes built from Tailwind utilities: `wrap`, `btn-primary`, `btn-outline`, `btn-link`, `field`,
  `panel`, `notice`, `skeleton`, `page-title`, `section-h`.

Tailwind is wired up through `postcss.config.mjs` (`@tailwindcss/postcss`), so there is nothing extra to run:
`npm install` then `npm run dev`.

## Guest checkout, online payment (SSLCommerz), advance payment, promo codes

- **Guest checkout:** customers can order without registering or logging in. The cart button always goes to `/checkout`;
  logged-in customers get their details pre-filled.
- **How orders are saved:** the browser sends only product ids and quantities to `POST /api/checkout`
  (`app/api/checkout/route.js`). The server looks up the real prices, applies the promo code, saves the order in
  Firestore with the Firebase Admin SDK (`lib/server/`) and, for online payment, opens SSLCommerz.
  Because of this `firestore.rules` no longer lets browsers create orders; publish the updated rules.
- **Payment options:** cash on delivery, or pay online with SSLCommerz: full payment, or a 30% / 50% advance with the rest
  paid in cash on delivery (`ADVANCE_PERCENTS` in `lib/format.js`). SSLCommerz sends the customer back to
  `/api/sslcommerz/success|fail|cancel` and also calls `/api/sslcommerz/ipn`. The server asks SSLCommerz to confirm
  every payment (and checks the amount) before an order is marked paid.
- **Order page:** `/order/{id}` shows the result for guests and customers (it is also where SSLCommerz sends people back).
- **Promo codes:** edit `lib/promo.js` (`WELCOME10`, `SAVE5`, `FREESHIP` to start with). They are checked again on the server.
- **Settings:** see the "SERVER-ONLY settings" block at the bottom of `.env`.

## Logo, category icons and favicon

All of them are SVG files in `public/`: `img/logo.svg` and `img/logo-light.svg` (footer), `img/categories/*.svg`
and the browser tab icon `app/icon.svg`. The current logo and category icons are placeholders: export your Figma
designs as SVG and replace the files with the same names.
