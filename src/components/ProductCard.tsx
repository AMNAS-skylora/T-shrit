"use client";

import { useOfferClock } from "@/hooks/useOfferClock";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { formatPrice, getProductWhatsappUrl } from "@/lib/format";
import { useStoreSettings } from "@/components/StoreSettingsContext";
import { getProductOfferCountdown, getProductOfferPrice, isProductOfferActive } from "@/lib/product-offers";
import { getProductImageForColor } from "@/lib/product-images";

export function ProductCard({ product }: { product: Product }) {
  const settings = useStoreSettings();
  const variants = product.colorVariants ?? [];
  const now = useOfferClock(product);
  const [selectedColor, setSelectedColor] = useState(
    variants[0]?.name ?? product.colors[0] ?? "Default",
  );

  const selectedVariant =
    variants.find((variant) => variant.name === selectedColor) ?? variants[0];

  const currentImage = getProductImageForColor(product, selectedColor);
  const currentStock = selectedVariant?.stock ?? product.stock;
  const soldOut = product.status === "sold-out" || currentStock <= 0;
  const limitedStock = !soldOut && currentStock <= 7;
  const activeProductOffer = isProductOfferActive(product, now);
  const offerPrice = getProductOfferPrice(product, now);
  const hasOffer = activeProductOffer;
  const displayPrice = offerPrice;
  const originalPrice = activeProductOffer ? product.price : undefined;

  const discount =
    hasOffer && originalPrice && originalPrice > displayPrice
      ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
      : 0;

  const remaining = getProductOfferCountdown(product, now);
  const offerTimer = remaining ? { countdown: remaining, date: new Date(product.offerEndsAt!).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" }).toUpperCase() } : null;

  const badge = useMemo(
    () =>
      soldOut
        ? "Sold out"
        : limitedStock
          ? `Limited stock · ${currentStock} left`
          : activeProductOffer
            ? product.offerLabel ?? product.offerBadge ?? "Limited offer"
            : hasOffer
              ? product.saleLabel ?? "Limited offer"
            : product.featured
              ? "New"
              : product.category,
    [
      currentStock,
      hasOffer,
      limitedStock,
      product.category,
      product.featured,
      product.saleLabel,
      product.offerLabel,
      product.offerBadge,
      activeProductOffer,
      soldOut,
    ],
  );

  const whatsappHref = getProductWhatsappUrl(
    product,
    settings.whatsappNumber,
    selectedColor,
  );

  return (
    <article className="product-card product-card-refined">
      <div className="product-visual product-card-visual-refined">
        <Link
          href={`/products/${product.slug}`}
          className="product-card-image-link"
          data-product-transition
          aria-label={product.name}
        >
          {currentImage ? (
            <Image
              key={currentImage}
              src={currentImage}
              alt={`${product.name} — ${selectedColor}`}
              fill
              sizes="(max-width: 600px) 50vw, (max-width: 980px) 50vw, 25vw"
              className="product-image product-card-image-refined"
            />
          ) : (
            <span className="product-image-empty">No image</span>
          )}
        </Link>

        <div className="product-card-badges">
          <span
            className={
              "product-card-status " +
              (soldOut
                ? "is-sold-out"
                : limitedStock
                  ? "is-limited"
                  : hasOffer
                    ? "is-offer"
                    : "")
            }
          >
            {badge}
          </span>

          {offerTimer ? (
            <span className="product-card-offer-timer">
              <small>ENDS {offerTimer.date}</small>
              <strong>{offerTimer.countdown}</strong>
            </span>
          ) : hasOffer && discount > 0 ? (
            <span className="product-card-discount">
              {activeProductOffer && product.offerBadge
                ? product.offerBadge
                : discount + "% OFF"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="product-card-info product-card-info-refined">
        <Link href={`/products/${product.slug}`} className="product-name" data-product-transition>
          {product.name}
        </Link>

        <div className="product-card-price">
          <strong>{formatPrice(displayPrice)}</strong>
          {hasOffer && originalPrice && originalPrice > displayPrice ? (
            <del>{formatPrice(originalPrice)}</del>
          ) : null}
        </div>

        {hasOffer ? (
          <div className="mt-2 rounded-xl border border-[#001cac]/15 bg-[#001cac]/[.04] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[9px] font-bold uppercase tracking-[.08em] text-[#001cac]">
                {activeProductOffer
                  ? product.offerLabel || "Limited offer"
                  : product.saleLabel || "Limited offer"}
              </span>
              {discount > 0 ? (
                <strong className="shrink-0 text-[10px] font-bold text-[#001cac]">
                  {activeProductOffer && product.offerBadge
                    ? product.offerBadge
                    : discount + "% OFF"}
                </strong>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="product-card-stock-row">
          <span
            className={
              "product-card-stock-dot " +
              (soldOut ? "sold-out" : limitedStock ? "low-stock" : "in-stock")
            }
            aria-hidden="true"
          />
          <span>
            {soldOut
              ? "Sold out"
              : limitedStock
                ? `Low stock · ${currentStock}`
                : `In stock · ${currentStock}`}
          </span>
        </div>

        {soldOut || whatsappHref === "#" ? (
          <button
            type="button"
            className="product-whatsapp-cta is-disabled"
            disabled
          >
            {soldOut ? "Sold out" : "WhatsApp unavailable"}
          </button>
        ) : (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="product-whatsapp-cta"
            aria-label={`Ask about ${product.name} in ${selectedColor} on WhatsApp`}
          >
            <span>Order on WhatsApp</span>
          </a>
        )}
      </div>
    </article>
  );
}
