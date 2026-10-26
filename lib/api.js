import BOOKS from "@/data/extra-products.json";
import { findGroup } from "@/lib/categories";

// DummyJSON: free fake e-commerce API (https://dummyjson.com/docs/products)
const BASE_URL = "https://dummyjson.com";

// Only the fields the product cards need keeps responses small.
const LIST_FIELDS =
  "id,title,description,category,price,discountPercentage,rating,stock,brand,thumbnail,tags";

async function request(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`Could not load products (${res.status}). Please try again.`);
  return res.json();
}

function uniqueById(list) {
  const seen = new Set();
  return list.filter((p) => (seen.has(p.id) ? false : seen.add(p.id)));
}

// Fisher-Yates shuffle (returns a new array).
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Featured products for the homepage: a random pick from the top rated ones,
// so a different set shows up each time the page is loaded.
export async function getFeaturedProducts(count = 4, pool = 24) {
  const data = await request(`/products?limit=0&select=${LIST_FIELDS}`);
  const topRated = [...data.products].sort((a, b) => b.rating - a.rating).slice(0, pool);
  return shuffle(topRated).slice(0, count);
}

// A homepage group ("electronics") or a raw DummyJSON category ("smartphones").
export async function getProductsByCategory(slug) {
  if (slug === "all") {
    const data = await request(`/products?limit=0&select=${LIST_FIELDS}`);
    return [...data.products, ...BOOKS];
  }
  const group = findGroup(slug);
  const sources = group ? group.sources : [slug];
  const lists = await Promise.all(
    sources.map(async (source) => {
      if (source === "books") return BOOKS;
      const data = await request(`/products/category/${encodeURIComponent(source)}?limit=0&select=${LIST_FIELDS}`);
      return data.products;
    })
  );
  return uniqueById(lists.flat());
}

export async function getProduct(id) {
  const numeric = Number(id);
  if (numeric >= 1000) {
    const book = BOOKS.find((b) => b.id === numeric);
    if (!book) throw new Error("Product not found");
    return book;
  }
  return request(`/products/${numeric}`);
}

export async function searchProducts(q, limit = 40) {
  const query = q.trim();
  if (!query) return [];
  const data = await request(`/products/search?q=${encodeURIComponent(query)}&limit=${limit}&select=${LIST_FIELDS}`);
  const lower = query.toLowerCase();
  const books = BOOKS.filter(
    (b) => b.title.toLowerCase().includes(lower) || b.tags.some((t) => t.includes(lower))
  );
  return [...data.products, ...books];
}
