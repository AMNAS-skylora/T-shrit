import type { Product } from "@/types/product";

export function validateProductOffer(product: Partial<Product>): string | null {
  if (!product.offerEnabled) return null;
  const value = Number(product.offerValue);
  if (!Number.isFinite(value) || value <= 0) return "Enter a positive offer value.";
  const type = product.offerType ?? "percentage";
  if (type === "percentage" && value > 100) return "Percentage discount cannot exceed 100%.";
  if (type !== "percentage" && value > Number(product.price)) return "Offer value cannot exceed the product price.";
  const start = product.offerStartsAt ? Date.parse(product.offerStartsAt) : null;
  const end = product.offerEndsAt ? Date.parse(product.offerEndsAt) : null;
  if ((start !== null && !Number.isFinite(start)) || (end !== null && !Number.isFinite(end))) return "Enter valid offer start and end times.";
  if (start !== null && end !== null && end <= start) return "Offer end time must be after its start time.";
  if (product.offerCountdown && end === null) return "Add an end time to show the offer countdown.";
  return null;
}

export function isProductOfferActive(product: Product, now = Date.now()) {
  if (!product.offerEnabled || validateProductOffer(product)) return false;

  const starts = product.offerStartsAt
    ? new Date(product.offerStartsAt).getTime()
    : null;
  const ends = product.offerEndsAt
    ? new Date(product.offerEndsAt).getTime()
    : null;

  if (starts !== null && Number.isFinite(starts) && now < starts) return false;
  if (ends !== null && Number.isFinite(ends) && now >= ends) return false;
  return true;
}

export function getProductOfferPrice(product: Product, now = Date.now()) {
  if (!isProductOfferActive(product, now)) return product.price;

  const value = Math.max(0, Number(product.offerValue ?? 0));

  if ((product.offerType ?? "percentage") === "percentage") {
    return Math.max(0, Math.round(product.price * (1 - value / 100)));
  }

  if (product.offerType === "fixed") {
    return Math.max(0, product.price - value);
  }

  return Math.max(0, Math.min(product.price, value));
}

export function getProductOfferStatus(product: Product, now = Date.now()) {
  if (!product.offerEnabled) return "off" as const;
  if (validateProductOffer(product)) return "invalid" as const;

  const starts = product.offerStartsAt
    ? new Date(product.offerStartsAt).getTime()
    : null;
  const ends = product.offerEndsAt
    ? new Date(product.offerEndsAt).getTime()
    : null;

  if (starts !== null && Number.isFinite(starts) && now < starts) {
    return "scheduled" as const;
  }

  if (ends !== null && Number.isFinite(ends) && now >= ends) {
    return "expired" as const;
  }

  return "active" as const;
}
