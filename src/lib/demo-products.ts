import type { Product } from "@/types/product";

/**
 * Presentation-only, opt-in sample items. These never touch MongoDB, stock
 * movements, real orders or payment flows. Prices are examples, not offers.
 * Photos are Unsplash examples, not photography of KLEID.IN merchandise.
 */
type Sample = {
  slug: string;
  name: string;
  category: string;
  price: number;
  color: string;
  colorCode: string;
  imageId: string;
};

const sampleData: Sample[] = [
  { slug: "preview-core-black-tee", name: "Core Crew Neck Tee — Black", category: "Everyday Essentials", price: 699, color: "Black", colorCode: "#202124", imageId: "photo-1610502778270-c5c6f4c7d575" },
  { slug: "preview-weekend-white-tee", name: "Weekend Cotton Tee — White", category: "Relaxed Basics", price: 799, color: "White", colorCode: "#f5f4ee", imageId: "photo-1620799139507-2a76f79a2f4d" },
  { slug: "preview-everyday-cream-tee", name: "Minimal Everyday Tee — Cream", category: "Classic Tees", price: 649, color: "Cream", colorCode: "#e6dfd1", imageId: "photo-1651761179569-4ba2aa054997" },
  { slug: "preview-regular-fit-black", name: "Regular Fit Tee — Charcoal", category: "Modern Basics", price: 749, color: "Charcoal", colorCode: "#35383d", imageId: "photo-1618354691373-d851c5c3a990" },
  { slug: "preview-daily-white-tee", name: "Daily Crew Tee — Off White", category: "Everyday Essentials", price: 599, color: "Off White", colorCode: "#f5f0e7", imageId: "photo-1778671394516-8270eac13c42" },
  { slug: "preview-layering-tee", name: "Essential Layer Tee — Ivory", category: "Modern Basics", price: 899, color: "Ivory", colorCode: "#ece6d9", imageId: "photo-1578932750355-5eb30ece487a" },
];

export const demoProducts: Product[] = sampleData.map((item, index) => ({
  id: "demo-" + String(index + 1),
  sku: "KLD-PREVIEW-" + String(index + 1).padStart(3, "0"),
  slug: item.slug,
  name: item.name,
  category: item.category,
  price: item.price,
  description: "Catalog layout preview. Name, shade, sizes and price are illustrative only. Photo is a sample reference, not a KLEID.IN product photo. Replace this listing with a verified real product before taking orders.",
  sizes: ["S", "M", "L", "XL"],
  colors: [item.color],
  colorVariants: [{ name: item.color, value: item.colorCode, stock: 0, sizeStocks: {} }],
  stock: 0,
  featured: false,
  featuredAnimationEnabled: false,
  spotlight: false,
  status: "active",
  image: "https://images.unsplash.com/" + item.imageId + "?auto=format&fit=max&w=1200&q=85",
  isDemo: true,
}));

export function getDemoProductBySlug(slug: string) {
  return demoProducts.find((product) => product.slug === slug) ?? null;
}
