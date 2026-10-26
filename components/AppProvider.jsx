"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { auth, db, isFirebaseConfigured, track } from "@/lib/firebase";
import { startPresence } from "@/lib/rtdb";
import { orderTotals } from "@/lib/format";
import { evaluatePromo } from "@/lib/promo";
import { makeStore } from "@/lib/store/store";
import { KEYS, read, write } from "@/lib/store/storage";
import {
  DEMO_ACCOUNT,
  loginWithGoogle,
  loginWithIdentifier,
  logoutUser,
  registerUser,
  resendVerification,
  saveProfile,
  sendReset,
  serializeUser,
  setAuthReady,
  setProfile,
  setUser,
  uploadAvatar,
} from "@/lib/store/authSlice";
import { addItem, clearCart, mergeItems, removeItem, setItems, setPromo, setQty } from "@/lib/store/cartSlice";
import { cancelOrder, clearOrders, placeOrder, setOrders, setOrdersError } from "@/lib/store/ordersSlice";
import { setHydrated, showToast } from "@/lib/store/uiSlice";
import { setWishlist, toggleWishlist } from "@/lib/store/wishlistSlice";
import Toast from "@/components/Toast";


function Bootstrap() {
  const dispatch = useDispatch();
  const uid = useSelector((s) => s.auth.user?.uid);
  const ready = useSelector((s) => s.auth.ready);
  const hydrated = useSelector((s) => s.ui.hydrated);
  const items = useSelector((s) => s.cart.items);
  const promo = useSelector((s) => s.cart.promo);
  const syncedUid = useRef(null);

  // 1. Load the guest cart from localStorage, then mark the app as hydrated.
  useEffect(() => {
    dispatch(setItems(read(KEYS.cart, [])));
    dispatch(setPromo(read(KEYS.promo, null)));
    dispatch(setHydrated());
  }, [dispatch]);

  // 2. Keep localStorage up to date.
  useEffect(() => {
    if (hydrated) write(KEYS.cart, items);
  }, [items, hydrated]);
  useEffect(() => {
    if (hydrated) write(KEYS.promo, promo);
  }, [promo, hydrated]);

  // 3. Firebase Auth: stay in sync with the signed-in user.
  useEffect(() => {
    if (!auth) {
      dispatch(setAuthReady());
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      dispatch(setUser(serializeUser(u)));
      dispatch(setAuthReady());
    });
  }, [dispatch]);

  // 4. Firestore
  useEffect(() => {
    if (!uid || !db) {
      dispatch(setProfile(null));
      dispatch(setWishlist([]));
      dispatch(clearOrders());
      return;
    }
    const stopProfile = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        dispatch(setProfile({ ...data, wishlist: undefined, cart: undefined }));
        dispatch(setWishlist(data.wishlist || []));
      },
      () => dispatch(setProfile({}))
    );
    // Realtime listener: the order list updates by itself when an order changes.
    const stopOrders = onSnapshot(
      query(collection(db, "orders"), where("uid", "==", uid)),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          // Timestamps are not serialisable, so store them as milliseconds.
          return { id: d.id, ...data, createdAt: data.createdAt?.toMillis?.() ?? Date.now(), cancelledAt: data.cancelledAt?.toMillis?.() ?? null };
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        dispatch(setOrders(list));
      },
      () => dispatch(setOrdersError("Could not load your orders. Check that firestore.rules is published."))
    );
    return () => {
      stopProfile();
      stopOrders();
    };
  }, [uid, dispatch]);

  // 5. When a customer logs in, merge the guest cart with the cart saved in Firestore.
  useEffect(() => {
    if (!hydrated || !ready) return;
    if (!uid) {
      if (syncedUid.current) {
        syncedUid.current = null;
        dispatch(clearCart()); // logged out: don't leave the previous customer's cart behind
      }
      return;
    }
    if (syncedUid.current === uid || !db) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        const remote = snap.exists() ? snap.data().cart || [] : [];
        if (!cancelled) dispatch(mergeItems(remote));
      } catch {
        /* offline or rules not deployed yet: keep the local cart */
      }
      if (!cancelled) syncedUid.current = uid;
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, hydrated, ready, dispatch]);

  // 6. Save every cart change back to Firestore (debounced).
  useEffect(() => {
    if (!uid || !db || syncedUid.current !== uid) return;
    const t = setTimeout(() => {
      setDoc(doc(db, "users", uid), { cart: items }, { merge: true }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [items, uid]);

  // 7. Realtime Database presence ("shoppers online"), only when a database URL is set.
  useEffect(() => startPresence(), []);

  return null;
}

/* ------------------------------------------------------------------ *
 * Provider + the useApp() hook used by every component.
 * ------------------------------------------------------------------ */
export default function AppProvider({ children }) {
  const storeRef = useRef(null);
  if (!storeRef.current) storeRef.current = makeStore();

  return (
    <Provider store={storeRef.current}>
      <Bootstrap />
      {children}
      <Toast />
    </Provider>
  );
}

// One hook that gives components the state and the actions they need.
export function useApp() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const profile = useSelector((s) => s.auth.profile);
  const authReady = useSelector((s) => s.auth.ready);
  const items = useSelector((s) => s.cart.items);
  const promo = useSelector((s) => s.cart.promo);
  const wishlist = useSelector((s) => s.wishlist.ids);
  const orders = useSelector((s) => s.orders.list);
  const ordersError = useSelector((s) => s.orders.error);
  const hydrated = useSelector((s) => s.ui.hydrated);

  const toast = useCallback((message, type = "success") => dispatch(showToast(message, type)), [dispatch]);

  const actions = useMemo(
    () => ({
      toast,
      register: (v) => dispatch(registerUser(v)),
      // v = { identifier, password }: identifier is a username or an email
      login: (v) => dispatch(loginWithIdentifier(v)),
      demoLogin: () => dispatch(loginWithIdentifier({ identifier: DEMO_ACCOUNT.username, password: DEMO_ACCOUNT.password })),
      loginWithGoogle: () => dispatch(loginWithGoogle()),
      logout: () => dispatch(logoutUser()),
      resetPassword: (email) => dispatch(sendReset(email)),
      resendVerification: () => dispatch(resendVerification()),
      updateProfileInfo: (v) => dispatch(saveProfile(v)),
      uploadAvatar: (file) => dispatch(uploadAvatar(file)),
      toggleWishlist: (id) => dispatch(toggleWishlist(id)),
      addToCart: (product, qty = 1) => {
        dispatch(addItem(product, qty));
        toast(`${product.title} added to cart`);
        track("add_to_cart", { currency: "USD", item_id: String(product.id), item_name: product.title, quantity: qty });
      },
      setQty: (id, qty) => dispatch(setQty({ id, qty })),
      removeItem: (id) => dispatch(removeItem(id)),
      clearCart: () => dispatch(clearCart()),
      removePromo: () => dispatch(setPromo(null)),
      placeOrder: (details) => dispatch(placeOrder(details)),
      cancelOrder: (id) => dispatch(cancelOrder(id)),
    }),
    [dispatch, toast]
  );

  const totals = useMemo(() => orderTotals(items, promo), [items, promo]);

  // Checks a promo code against the current cart and saves it when it applies. Returns { ok, message }.
  const applyPromo = useCallback(
    (code) => {
      const r = evaluatePromo(code, totals.subtotal);
      if (r.ok) dispatch(setPromo(r.code));
      return r;
    },
    [dispatch, totals.subtotal]
  );

  return {
    user,
    profile,
    authReady,
    isConfigured: isFirebaseConfigured,
    items,
    hydrated,
    // Number of different products in the cart (the badge shows this, not the total quantity).
    count: items.length,
    // Total quantity of all items, in case it is needed.
    totalQty: items.reduce((n, i) => n + i.qty, 0),
    ...totals,
    applyPromo,
    wishlist,
    orders,
    ordersError,
    ...actions,
  };
}

// Yellow notice shown on login / checkout until the Firebase keys are added.
export function ConfigNotice() {
  if (isFirebaseConfigured) return null;
  return (
    <div className="notice notice-warn">
      <p>
        <b>Firebase is not configured yet.</b> Open the <code>.env</code> file, paste your Firebase web app keys
        into it, and restart <code>npm run dev</code>.
      </p>
    </div>
  );
}
