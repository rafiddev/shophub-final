"use client";

import { useSelector } from "react-redux";

// Small message at the bottom of the screen. The message lives in the Redux ui slice.
export default function Toast() {
  const toast = useSelector((s) => s.ui.toast);
  return (
    <div
      className={`pointer-events-none fixed bottom-7 left-1/2 z-[80] max-w-[92vw] -translate-x-1/2 rounded-lg px-5 py-3 text-center text-[15px] text-white transition duration-[250ms] ${
        toast ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${toast?.type === "error" ? "bg-[#b91c1c]" : "bg-ink"}`}
      role="status"
      aria-live="polite"
    >
      {toast?.message}
    </div>
  );
}
