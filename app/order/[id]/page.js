import { Suspense } from "react";
import OrderView from "@/components/OrderView";

export const metadata = { title: "Your order" };

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="wrap pt-7 pb-16"><div className="skeleton h-[240px]" /></div>}>
      <OrderView />
    </Suspense>
  );
}
