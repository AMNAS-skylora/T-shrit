import type { Product, ProductColorVariant } from "@/types/product";

export function getVariantPrimaryImage(
  variant?: ProductColorVariant | null,
) {
  return variant?.images?.[0] || variant?.image || "";
}

export function getProductPrimaryImage(product: Product) {
  if (product.image) return product.image;

  for (const variant of product.colorVariants ?? []) {
    const image = getVariantPrimaryImage(variant);
    if (image) return image;
  }

  return "";
}

export function getProductImageForColor(
  product: Product,
  color?: string,
) {
  if (color) {
    const variant = (product.colorVariants ?? []).find(
      (item) => item.name.toLowerCase() === color.toLowerCase(),
    );
    const image = getVariantPrimaryImage(variant);
    if (image) return image;
  }

  return getProductPrimaryImage(product);
}

export function getProductGalleryForColor(
  product: Product,
  color?: string,
) {
  if (color) {
    const variant = (product.colorVariants ?? []).find(
      (item) => item.name.toLowerCase() === color.toLowerCase(),
    );

    if (variant?.images?.length) return variant.images;
    if (variant?.image) return [variant.image];
  }

  const primary = getProductPrimaryImage(product);
  return primary ? [primary] : [];
}
