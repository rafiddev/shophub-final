import { createSlice } from "@reduxjs/toolkit";
import { round2, salePrice } from "@/lib/format";

// Guest cart + saved cart: keep the larger quantity of each product.
export function mergeCarts(a, b) {
  const map = new Map();
  [...a, ...b].forEach((i) => {
    const existing = map.get(i.id);
    map.set(i.id, existing ? { ...existing, qty: Math.max(existing.qty, i.qty) } : i);
  });
  return [...map.values()];
}

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [], promo: null }, // promo = the promo code typed in the cart, or null
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload;
    },
    mergeItems: (state, action) => {
      state.items = mergeCarts(state.items, action.payload);
    },
    addItem: {
      reducer: (state, action) => {
        const { item } = action.payload;
        const found = state.items.find((i) => i.id === item.id);
        if (found) found.qty += item.qty;
        else state.items.push(item);
      },
      // Only the fields the cart needs are stored (keeps Firestore documents small).
      prepare: (product, qty = 1) => ({
        payload: {
          item: {
            id: product.id,
            title: product.title,
            thumbnail: product.thumbnail,
            price: round2(salePrice(product)),
            qty,
          },
        },
      }),
    },
    setQty: (state, action) => {
      const { id, qty } = action.payload;
      if (qty <= 0) state.items = state.items.filter((i) => i.id !== id);
      else {
        const found = state.items.find((i) => i.id === id);
        if (found) found.qty = qty;
      }
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
      state.promo = null;
    },
    setPromo: (state, action) => {
      state.promo = action.payload;
    },
  },
});

export const { setItems, mergeItems, addItem, setQty, removeItem, clearCart, setPromo } = cartSlice.actions;
export default cartSlice.reducer;
