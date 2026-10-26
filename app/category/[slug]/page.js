import ShopPage from "@/components/ShopPage";

// Product category page: /category/electronics, /category/smartphones, /category/all ...
export default async function CategoryPage({ params }) {
  const { slug } = await params;
  return <ShopPage slug={slug} />;
}
