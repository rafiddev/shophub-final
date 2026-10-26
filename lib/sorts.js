import { salePrice } from "@/lib/format";

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "discount", label: "Biggest Discount" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];

export function sortProducts(list, sort) {
  const arr = [...list];
  switch (sort) {
    case "price-asc":
      return arr.sort((a, b) => salePrice(a) - salePrice(b));
    case "price-desc":
      return arr.sort((a, b) => salePrice(b) - salePrice(a));
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating);
    case "discount":
      return arr.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    case "name-asc":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case "name-desc":
      return arr.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return arr; // "featured" keeps the API order
  }
}
