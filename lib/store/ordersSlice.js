import { createSlice } from "@reduxjs/toolkit";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth as fbAuth, db, track } from "@/lib/firebase";
import { rtdbSaveOrder } from "@/lib/rtdb";
import { orderTotals } from "@/lib/format";

// `list` is filled in real time by AppProvider (Firestore query on orders where uid == user).
const ordersSlice = createSlice({
  name: "orders",
  initialState: { list: null, error: "" },
  reducers: {
    setOrders: (state, action) => {
      state.list = action.payload;
      state.error = "";
    },
    setOrdersError: (state, action) => {
      state.error = action.payload;
    },
    clearOrders: (state) => {
      state.list = null;
      state.error = "";
    },
  },
});

export const { setOrders, setOrdersError, clearOrders } = ordersSlice.actions;

// Thunk: send the order to our server (/api/checkout). Works for guests and for logged-in customers.
// The server works out the real prices, saves the order in Firestore and, for online payment,
// returns the SSLCommerz payment page address. Resolves to { orderId, gatewayUrl? }.
// `details` = { customer, shippingAddress, paymentMethod, payPercent, notes, saveAddress }
export const placeOrder = (details) => async (dispatch, getState) => {
  const { auth, cart } = getState();
  const user = auth.user; // null for a guest
  if (cart.items.length === 0) throw new Error("Your cart is empty.");

  const { total } = orderTotals(cart.items, cart.promo);
  track("begin_checkout", { currency: "USD", value: total });

  const headers = { "Content-Type": "application/json" };
  if (user && fbAuth?.currentUser) headers.Authorization = `Bearer ${await fbAuth.currentUser.getIdToken()}`;

  let res;
  try {
    res = await fetch("/api/checkout", {
      method: "POST",
      headers,
      body: JSON.stringify({
        items: cart.items.map((i) => ({ id: i.id, qty: i.qty })), // only ids and quantities: the server knows the prices
        customer: details.customer,
        shippingAddress: details.shippingAddress,
        paymentMethod: details.paymentMethod,
        payPercent: details.payPercent,
        promo: cart.promo,
        notes: details.notes || "",
      }),
    });
  } catch {
    throw new Error("We couldn't reach the server. Please check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "We couldn't place your order. Please try again.");

  // Remember the address for next time -> users/{uid} (logged-in customers only)
  if (user && db && details.saveAddress) {
    await setDoc(
      doc(db, "users", user.uid),
      { phone: details.customer.phone, address: details.shippingAddress, updatedAt: serverTimestamp() },
      { merge: true }
    ).catch(() => {});
  }

  // Optional copy in the Realtime Database (does nothing when it is not configured).
  if (user) rtdbSaveOrder({ id: data.orderId, uid: user.uid, total, status: "pending", itemCount: cart.items.length, createdAt: Date.now() });

  return data;
};

// Thunk: a customer can cancel their own order while it is still pending.
export const cancelOrder = (id) => async () => {
  await updateDoc(doc(db, "orders", id), { status: "cancelled", cancelledAt: serverTimestamp() });
};

export default ordersSlice.reducer;
