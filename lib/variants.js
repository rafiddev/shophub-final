// DEMO DATA: DummyJSON has no colours or sizes, so the Color / Size filters in the shop
// use values generated from the product id (the same product always gets the same ones).
// Replace getVariants() with real product fields when you have a real catalogue.

export const COLORS = [
  { name: "Navy", hex: "#1E2A6B" },
  { name: "Gold", hex: "#D8B04A" },
  { name: "Black", hex: "#222222" },
  { name: "Sky", hex: "#B7C9E2" },
  { name: "Brown", hex: "#A56B3C" },
  { name: "Rose", hex: "#D46A6A" },
  { name: "Grey", hex: "#B5B0B0" },
  { name: "Sage", hex: "#CFD3C0" },
];

export const SIZES = ["XS", "S", "M", "L", "XL"];

const APPAREL = new Set(["mens-shirts", "womens-dresses", "tops", "mens-shoes", "womens-shoes"]);

export function getVariants(product) {
  const id = Number(product.id) || 0;
  const count = 2 + (id % 3);
  const colors = new Set();
  for (let k = 0; k < count; k++) colors.add(COLORS[(id + k * 3) % COLORS.length].name);
  const sizes = APPAREL.has(product.category) ? SIZES.filter((_, i) => (id + i) % 4 !== 0) : [];
  return { colors: [...colors], sizes };
}

export const colorHex = (name) => COLORS.find((c) => c.name === name)?.hex || "#999";
