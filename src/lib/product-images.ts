import type { Product, ProductColorVariant } from "@/types/product";

export function getVariantPrimaryImage(
  variant?: ProductColorVariant | null,
) {
  return variant?.images?.[0] || variant?.image || "";
}

export function getProductPrimaryImage(product: Product) {
  if (product.image) return product.image;
  if (product.images?.length) return product.images[0];

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

    if (variant?.images?.length) return [...new Set(variant.images.filter(Boolean))].slice(0, 3);
    if (variant?.image) return [variant.image];
  }

  // Display the primary image first, followed by the saved photo slots.
  // Older products with only "image" still work without migration.
  const gallery = [product.image, ...(product.images ?? [])].filter(
    (url): url is string => Boolean(url),
  );
  if (gallery.length) return [...new Set(gallery)].slice(0, 3);
  const primary = getProductPrimaryImage(product);
  return primary ? [primary] : [];
}
