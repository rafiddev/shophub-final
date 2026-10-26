import { Suspense } from "react";
import CategoriesView from "@/components/CategoriesView";

export const metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="wrap pt-7 pb-16"><p>Loading...</p></div>}>
      <CategoriesView />
    </Suspense>
  );
}
