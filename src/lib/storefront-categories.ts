import type { Product } from "@/types/product";

// Keep admin-created categories and catalog categories in one stable,
// case-insensitively deduplicated list without introducing demo entries.
export function getStorefrontCategories(
  products: Pick<Product, "category" | "status">[],
  savedCategories: readonly string[] = [],
): string[] {
  const names = new Map<string, string>();
  for (const value of [
    ...savedCategories,
    ...products
      .filter((product) => product.status === "active")
      .map((product) => product.category),
  ]) {
    if (typeof value !== "string") continue;
    const name = value.trim().replace(/\s+/g, " ");
    if (!name || name.toLowerCase() === "all") continue;
    const key = name.toLocaleLowerCase();
    if (!names.has(key)) names.set(key, name);
  }
  return [...names.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }),
  );
}

export function getCategoryShopHref(category: string): string {
  return `/products?category=${encodeURIComponent(category)}`;
}

export function productMatchesCategory(productCategory: string, selectedCategory: string) {
  return (
    selectedCategory.trim().toLocaleLowerCase() === "all" ||
    productCategory.trim().toLocaleLowerCase() === selectedCategory.trim().toLocaleLowerCase()
  );
}
