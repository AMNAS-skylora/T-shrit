"use client";

import { useOfferClock } from "@/hooks/useOfferClock";
import { useState } from "react";
import type { Product } from "@/types/product";
import { getProductWhatsappUrl } from "@/lib/format";
import { useStoreSettings } from "@/components/StoreSettingsContext";

type Props = {
  product: Product;
  whatsappUrl?: string;
  compact?: boolean;
};

export function ProductActions({
  product,
  whatsappUrl,
  compact = false,
}: Props) {
  const settings = useStoreSettings();
  useOfferClock(product);
  const [size, setSize] = useState(product.sizes[0] ?? "One size");
  const selectedColor = product.colors[0] ?? "Default";
  const disabled = product.status !== "active" || product.stock <= 0;

  const orderUrl =
    whatsappUrl ??
    getProductWhatsappUrl(
      product,
      settings.whatsappNumber,
      selectedColor,
      size,
    );

  return (
    <div
      className={"product-actions " + (compact ? "product-actions-compact" : "")}
    >
      <div className="size-picker" aria-label="Select size">
        {product.sizes.map((option) => (
          <button
            type="button"
            key={option}
            aria-pressed={size === option}
            className={size === option ? "active" : ""}
            onClick={() => setSize(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="product-action-buttons">
        {!disabled && orderUrl !== "#" ? (
          <a
            className="button button-primary whatsapp-order-button"
            href={orderUrl}
            target="_blank"
            rel="noreferrer"
          >
            Order on WhatsApp
          </a>
        ) : (
          <button
            type="button"
            className="button button-primary whatsapp-order-button"
            disabled
          >
            {disabled ? "Sold out" : "WhatsApp unavailable"}
          </button>
        )}
      </div>
    </div>
  );
}
