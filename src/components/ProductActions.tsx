"use client";

import { useOfferClock } from "@/hooks/useOfferClock";
import { useState } from "react";
import type { Product } from "@/types/product";
import { getProductWhatsappUrl } from "@/lib/format";
import { useStoreSettings } from "@/components/StoreSettingsContext";
import { useCart } from "@/components/CartProvider";

type Props = {
  product: Product;
  whatsappUrl?: string;
  compact?: boolean;
  showColorOptions?: boolean;
  onColorChange?: (color: string) => void;
};

export function ProductActions({
  product,
  whatsappUrl,
  compact = false,
  showColorOptions = false,
  onColorChange,
}: Props) {
  const settings = useStoreSettings();
  const { addItem } = useCart();
  const [cartNotice, setCartNotice] = useState("");
  useOfferClock(product);
  const [size, setSize] = useState(product.sizes[0] ?? "One size");
  const colors = [...new Set([...(product.colorVariants ?? []).map(variant => variant.name), ...product.colors])];
  const [color, setColor] = useState(colors[0] ?? "Default");
  const selectedColor = showColorOptions ? color : product.colors[0] ?? "Default";
  const variant = product.colorVariants?.find(item => item.name === selectedColor);
  const sizeStocks = variant?.sizeStocks ?? {};
  const stock = showColorOptions
    ? Object.keys(sizeStocks).length ? Number(sizeStocks[size] ?? 0) : variant?.stock ?? product.stock
    : product.stock;
  const disabled = product.status !== "active" || stock <= 0;

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
      {showColorOptions && colors.length ? <div className="product-color-options">
        <p className="product-option-label">Colour</p>
        <div className="product-color-picker" role="group" aria-label="Select colour">
          {colors.map(option => {
            const value = product.colorVariants?.find(item => item.name === option)?.value;
            return <button type="button" key={option} aria-label={option} title={option} aria-pressed={selectedColor === option} className={selectedColor === option ? "active" : ""} onClick={() => { setColor(option); onColorChange?.(option); }}>
              <span className="product-color-dot" style={value ? { backgroundColor: value } : undefined} aria-hidden="true" />
            </button>;
          })}
        </div>
      </div> : null}
      {showColorOptions && product.sizes.length ? <p className="product-option-label">Size <span>{size}</span></p> : null}
      <div className="size-picker" role="group" aria-label="Select size">
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
        <button
          type="button"
          className="button button-secondary"
          disabled={disabled}
          onClick={() => {
            addItem({ productId: product.id, color: selectedColor, size, quantity: 1 });
            setCartNotice("Added to your shopping bag.");
          }}
        >
          Add to bag
        </button>
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
      {cartNotice ? <p role="status" aria-live="polite" className="mt-2 text-xs">{cartNotice}</p> : null}
    </div>
  );
}
