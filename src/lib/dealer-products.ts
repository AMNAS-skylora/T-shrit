import type { Product } from "@/types/product";

export function getDealerProducts(products: Product[]) {
  return products.filter(product => product.wholesaleEnabled && product.status !== "draft");
}

export function validateDealerProduct(product: Partial<Product>) {
  if (!product.wholesaleEnabled) return null;
  if (!Number.isFinite(product.wholesalePrice) || Number(product.wholesalePrice) <= 0) return "Enter a dealer price greater than 0.";
  if (!Number.isInteger(product.wholesaleMinOrder) || Number(product.wholesaleMinOrder) < 1) return "Enter a minimum dealer order of at least 1 whole item.";
  return null;
}
