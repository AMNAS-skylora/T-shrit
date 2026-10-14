"use client";

import { useOfferClock } from "@/hooks/useOfferClock";
import Image from "next/image";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/UiIcons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types/product";
import { formatPrice, getProductWhatsappUrl } from "@/lib/format";
import { getProductOfferPrice, isProductOfferActive } from "@/lib/product-offers";
import { getProductGalleryForColor } from "@/lib/product-images";
import { OfferCountdown } from "@/components/OfferCountdown";
import { useCart } from "@/components/CartProvider";
import galleryStyles from "@/components/ProductGallery.module.css";

export function ProductDetailClient({
  product,
  whatsappNumber,
}: {
  product: Product;
  whatsappNumber: string;
}) {
  const { addItem } = useCart();
  const [cartNotice, setCartNotice] = useState("");
  const variants = product.colorVariants ?? [];
  const now = useOfferClock(product);
  const [selectedColor, setSelectedColor] = useState(
    variants[0]?.name ?? product.colors[0] ?? "Default",
  );
  const [size, setSize] = useState(product.sizes[0] ?? "One size");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryPaused, setGalleryPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const selectedVariant =
    variants.find((variant) => variant.name === selectedColor) ?? variants[0];

  const variantImages = getProductGalleryForColor(product, selectedColor);
  const image = variantImages[activeImageIndex] ?? variantImages[0];
  const trackedSizes = selectedVariant?.sizeStocks ?? {};
  const stock = Object.keys(trackedSizes).length
    ? Number(trackedSizes[size] ?? 0)
    : selectedVariant?.stock ?? product.stock;
  const soldOut = product.status !== "active" || stock <= 0;
  const offerActive = isProductOfferActive(product, now);
  const displayPrice = offerActive ? getProductOfferPrice(product, now) : product.price;

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedColor]);

  useEffect(() => {
    if (variantImages.length <= 1 || galleryPaused) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActiveImageIndex((index) => (index + 1) % variantImages.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [variantImages.length, selectedColor, galleryPaused]);

  function moveImage(direction: number) {
    if (variantImages.length) setActiveImageIndex((index) => (index + direction + variantImages.length) % variantImages.length);
  }

  const whatsappUrl = getProductWhatsappUrl(
    product,
    whatsappNumber,
    selectedColor,
    size,
  );

  return (
    <>
      <div className={galleryStyles.gallery}
        data-product-image-target
        onPointerEnter={(event) => { if (event.pointerType === "mouse") setGalleryPaused(true); }}
        onPointerLeave={() => setGalleryPaused(false)}
        onFocusCapture={() => setGalleryPaused(true)}
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setGalleryPaused(false); }}
        onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; touchStartY.current = event.touches[0]?.clientY ?? null; setGalleryPaused(true); }}
        onTouchEnd={(event) => {
          const end = event.changedTouches[0]?.clientX;
          if (touchStart.current !== null && end !== undefined && Math.abs(end - touchStart.current) > 40 && Math.abs(end - touchStart.current) > Math.abs((event.changedTouches[0]?.clientY ?? 0) - (touchStartY.current ?? 0))) moveImage(end < touchStart.current ? 1 : -1);
          touchStart.current = null;
          setGalleryPaused(false);
        }}
        onTouchCancel={() => { touchStart.current = null; setGalleryPaused(false); }}
      >
        {image ? (
          <Image
            key={image}
            src={image}
            alt={`${product.name} — ${selectedColor}`}
            fill
            preload={activeImageIndex === 0}
            sizes="(max-width: 800px) 100vw, 58vw"
            className={galleryStyles.image}
          />
        ) : (
          <span className={galleryStyles.empty}>No product image</span>
        )}

        <div className={galleryStyles.tag}>
          {soldOut ? "Sold out" : selectedColor}
        </div>

        {variantImages.length > 1 ? (
          <>
          <div className={galleryStyles.controls}>
            <button type="button" onClick={() => moveImage(-1)} aria-label="Previous product image"><ArrowLeftIcon width={18} height={18} /></button>
            <span>{activeImageIndex + 1} / {variantImages.length}</span>
            <button type="button" onClick={() => moveImage(1)} aria-label="Next product image"><ArrowRightIcon width={18} height={18} /></button>
          </div>
          <div className={galleryStyles.thumbnails}>
            {variantImages.map((url, index) => (
              <button
                key={url + index}
                type="button"
                onClick={() => setActiveImageIndex(index)}
                className={
                  galleryStyles.thumbnail + " " + (index === activeImageIndex ? galleryStyles.selected : "")
                }
                aria-label={"Show image " + (index + 1)}
                aria-pressed={index === activeImageIndex}
              >
                <Image
                  src={url}
                  alt={product.name + " image " + (index + 1)}
                  fill
                  sizes="56px"
                  className={galleryStyles.thumbnailImage}
                />
              </button>
            ))}
          </div>
          </>
        ) : null}
      </div>

      <div className={galleryStyles.info}>
        <div className={galleryStyles.inner}>
          <div className={galleryStyles.heading}>
            <div>
              <p className={galleryStyles.eyebrow}>
                {product.category} / {product.sku}
              </p>
              <h1>{product.name}</h1>
            </div>

            <div className={galleryStyles.price}>
              <strong>{formatPrice(displayPrice)}</strong>
              {offerActive ? (
                <del>{formatPrice(product.price)}</del>
              ) : null}
            </div>
          </div>

          {offerActive ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={galleryStyles.offerBadge}>
                {product.offerBadge || product.offerLabel || "Offer"}
              </span>

            </div>
          ) : null}

          {offerActive ? <OfferCountdown product={product} now={now} /> : null}

          {product.description ? <p className={galleryStyles.description}>{product.description}</p> : null}

          <div className={galleryStyles.optionBlock}>
            <div className={galleryStyles.optionHead}>
              <span>Colour</span>
              <strong>{selectedColor}</strong>
            </div>

            {variants.length > 1 ? (
              <div className={galleryStyles.swatches}>
                {variants.map((variant) => (
                  <button
                    key={variant.name}
                    type="button"
                    className={
                      galleryStyles.swatch + " " + (selectedColor === variant.name ? galleryStyles.selected : "")
                    }
                    aria-label={variant.name}
                    title={variant.name}
                    aria-pressed={selectedColor === variant.name}
                    onClick={() => setSelectedColor(variant.name)}
                  >
                    <span style={{ background: variant.value }} aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : (
              <strong className={galleryStyles.singleColor}>{selectedColor}</strong>
            )}
          </div>

          <div className={galleryStyles.optionBlock}>
            <div className={galleryStyles.optionHead}>
              <span>Size</span>
              <strong>{size}</strong>
            </div>
            <div className={galleryStyles.sizes} aria-label="Select size">
              {product.sizes.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={size === option ? galleryStyles.selected : ""}
                  aria-pressed={size === option}
                  onClick={() => setSize(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className={galleryStyles.attributes}>
            <div>
              <span>Availability</span>
              <strong>{soldOut ? "Sold out" : `${stock} in stock`}</strong>
            </div>
            <div>
              <span>Selected</span>
              <strong>{selectedColor} / {size}</strong>
            </div>
          </div>

          <div className={galleryStyles.actions}>
            {product.featuredImage ? (
              <Link
                href={"/try-on/" + product.slug}
                className={galleryStyles.secondaryButton}
              >
                Try-On Anywhere
              </Link>
            ) : null}
            <button
              type="button"
              className={galleryStyles.secondaryButton}
              disabled={soldOut}
              onClick={() => {
                addItem({ productId: product.id, color: selectedColor, size, quantity: 1 });
                setCartNotice("Added to your bag. View it using the bag icon above.");
              }}
            >
              Add to bag
            </button>
            {whatsappUrl !== "#" && !soldOut ? (
              <a
                className={galleryStyles.primaryButton}
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                {"Order on WhatsApp"}
              </a>
            ) : (
              <button
                type="button"
                className={galleryStyles.primaryButton}
                disabled
              >
                {soldOut ? "Sold out" : "WhatsApp unavailable"}
              </button>
            )}
          </div>

          {cartNotice ? <p role="status" aria-live="polite" className="mt-3 text-sm font-medium">{cartNotice}</p> : null}

          <div className={galleryStyles.notes}>
            {product.featuredImage ? (
              <span>Live camera try-on available</span>
            ) : null}
            <span>Your colour and size are included in your WhatsApp message.</span>
            <span>Send the message to confirm availability and delivery with us.</span>
          </div>
        </div>
      </div>
    </>
  );
}
