import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: { hydrated: false, toast: null },
  reducers: {
    setHydrated: (state) => {
      state.hydrated = true;
    },
    setToast: (state, action) => {
      state.toast = action.payload;
    },
    clearToast: (state, action) => {
      // Only clear if it is still the same toast (a newer one may have replaced it).
      if (!action.payload || state.toast?.id === action.payload) state.toast = null;
    },
  },
});

export const { setHydrated, setToast, clearToast } = uiSlice.actions;

// Thunk: show a toast message for about 2.8 seconds.
export const showToast =
  (message, type = "success") =>
  (dispatch) => {
    const id = Date.now() + Math.random();
    dispatch(setToast({ message, type, id }));
    setTimeout(() => dispatch(clearToast(id)), 2800);
  };

export default uiSlice.reducer;
