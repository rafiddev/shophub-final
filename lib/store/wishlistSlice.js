import { createSlice } from "@reduxjs/toolkit";
import { arrayRemove, arrayUnion, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, track } from "@/lib/firebase";

// The wishlist is a list of product ids saved in Firestore at users/{uid}.wishlist.
// AppProvider keeps `ids` in sync with that document in real time.
const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { ids: [] },
  reducers: {
    setWishlist: (state, action) => {
      state.ids = action.payload || [];
    },
  },
});

export const { setWishlist } = wishlistSlice.actions;

// Thunk: add or remove a product. Resolves to true when it was added.
export const toggleWishlist = (productId) => async (dispatch, getState) => {
  const { auth, wishlist } = getState();
  const uid = auth.user?.uid;
  if (!uid || !db) return false;
  const has = wishlist.ids.includes(productId);
  await setDoc(
    doc(db, "users", uid),
    { wishlist: has ? arrayRemove(productId) : arrayUnion(productId), updatedAt: serverTimestamp() },
    { merge: true }
  );
  track(has ? "remove_from_wishlist" : "add_to_wishlist", { item_id: String(productId) });
  return !has;
};

export default wishlistSlice.reducer;
