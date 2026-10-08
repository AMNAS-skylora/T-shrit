import type { Product } from "@/types/product";

// Temporary preview products. Images: PurePNG (CC0, commercial use allowed).
// Admin settings controls whether these appear alongside the real catalog.
export const homeDemoProducts: Product[] = [
  {
    id: "demo-1", sku: "DEMO-TEE-001", demo: true,
    name: "Essential White Tee", slug: "essential-white-tee", category: "T-Shirts",
    price: 799,
    description: "A clean, relaxed everyday silhouette with understated detail. Sample product for the collection preview.",
    sizes: ["S", "M", "L", "XL"], colors: ["White"], stock: 1,
    featured: false, status: "active", sortOrder: 0,
    image: "https://purepng.com/public/uploads/large/purepng.com-white-t-shirtt-shirtfabrict-shapegramnetsmenswhite-1421526429123xb6qt.png",
    colorVariants: [{ name: "White", value: "#f5f5f2", image: "https://purepng.com/public/uploads/large/purepng.com-white-t-shirtt-shirtfabrict-shapegramnetsmenswhite-1421526429123xb6qt.png" }],
  },
  {
    id: "demo-2", sku: "DEMO-TEE-002", demo: true,
    name: "Classic Black Tee", slug: "classic-black-tee", category: "T-Shirts",
    price: 849,
    description: "A clean, relaxed everyday silhouette with understated detail. Sample product for the collection preview.",
    sizes: ["S", "M", "L", "XL"], colors: ["Black"], stock: 1,
    featured: false, status: "active", sortOrder: 1,
    image: "https://purepng.com/public/uploads/large/purepng.com-black-t-shirtt-shirtfabrict-shapegramnetsmensblack-1421526429071zidaz.png",
    colorVariants: [{ name: "Black", value: "#111111", image: "https://purepng.com/public/uploads/large/purepng.com-black-t-shirtt-shirtfabrict-shapegramnetsmensblack-1421526429071zidaz.png" }],
  },
  {
    id: "demo-3", sku: "DEMO-TEE-003", demo: true,
    name: "Cyan Everyday Tee", slug: "cyan-everyday-tee", category: "T-Shirts",
    price: 899,
    description: "A clean, relaxed everyday silhouette with understated detail. Sample product for the collection preview.",
    sizes: ["S", "M", "L", "XL"], colors: ["Cyan"], stock: 1,
    featured: false, status: "active", sortOrder: 2,
    image: "https://purepng.com/public/uploads/large/purepng.com-cyan-t-shirtt-shirtfabrict-shapegramnetscyan-1421526429408e5mcr.png",
    colorVariants: [{ name: "Cyan", value: "#22b8cf", image: "https://purepng.com/public/uploads/large/purepng.com-cyan-t-shirtt-shirtfabrict-shapegramnetscyan-1421526429408e5mcr.png" }],
  },
  {
    id: "demo-4", sku: "DEMO-TEE-004", demo: true,
    name: "Mint Relaxed Tee", slug: "mint-relaxed-tee", category: "T-Shirts",
    price: 899,
    description: "A clean, relaxed everyday silhouette with understated detail. Sample product for the collection preview.",
    sizes: ["S", "M", "L", "XL"], colors: ["Mint"], stock: 1,
    featured: false, status: "active", sortOrder: 3,
    image: "https://purepng.com/public/uploads/large/purepng.com-mint-green-t-shirtt-shirtfabrict-shapegramnetsmint-green-1421526429357cthld.png",
    colorVariants: [{ name: "Mint", value: "#a5d8bc", image: "https://purepng.com/public/uploads/large/purepng.com-mint-green-t-shirtt-shirtfabrict-shapegramnetsmint-green-1421526429357cthld.png" }],
  },
];

export function getHomeDemoProductBySlug(slug: string) {
  return homeDemoProducts.find((product) => product.slug === slug);
}
