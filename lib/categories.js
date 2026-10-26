// The six homepage categories. Each one maps to one or more DummyJSON categories.
export const CATEGORY_GROUPS = [
  {
    slug: "electronics",
    name: "Electronics",
    img: "/img/categories/electronics.png",
    sources: ["smartphones", "laptops", "tablets", "mobile-accessories"],
  },
  {
    slug: "fashion",
    name: "Fashion",
    img: "/img/categories/fashion.png",
    sources: [
      "mens-shirts", "mens-shoes", "mens-watches", "womens-bags", "womens-dresses",
      "womens-jewellery", "womens-shoes", "womens-watches", "tops", "sunglasses",
    ],
  },
  {
    slug: "home",
    name: "Home",
    img: "/img/categories/home.png",
    sources: ["furniture", "home-decoration", "kitchen-accessories"],
  },
  { slug: "sports", name: "Sports", img: "/img/categories/sports.png", sources: ["sports-accessories"] },
  { slug: "books", name: "Books", img: "/img/categories/book.png", sources: ["books"] },
  {
    slug: "gaming",
    name: "Gaming",
    img: "/img/categories/gaming.png",
    sources: ["laptops", "tablets", "mobile-accessories"],
  },
];

export function findGroup(slug) {
  return CATEGORY_GROUPS.find((g) => g.slug === slug);
}

// "mens-shirts" -> "Mens Shirts"
export function prettyCategory(slug = "") {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
