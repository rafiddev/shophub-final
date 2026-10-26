import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/lib/store/authSlice";
import cartReducer from "@/lib/store/cartSlice";
import ordersReducer from "@/lib/store/ordersSlice";
import uiReducer from "@/lib/store/uiSlice";
import wishlistReducer from "@/lib/store/wishlistSlice";

// A new store per app instance (safe for Next.js server rendering).
export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      wishlist: wishlistReducer,
      orders: ordersReducer,
      ui: uiReducer,
    },
  });
}
