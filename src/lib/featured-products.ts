import type { Product } from "@/types/product";
import { getProductPrimaryImage } from "@/lib/product-images";

export function getFeaturedProducts(products: Product[]) {
  return products.filter(product => product.status === "active" && product.featured && Boolean(getProductPrimaryImage(product)))
    .sort((a, b) => (a.featuredSortOrder ?? a.sortOrder ?? 100) - (b.featuredSortOrder ?? b.sortOrder ?? 100));
}
