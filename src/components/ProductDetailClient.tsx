"use client";

import { useOfferClock } from "@/hooks/useOfferClock";
import Image from "next/image";
import { ArrowUpRightIcon, ShoppingBagIcon } from "@/components/UiIcons";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/types/product";
import { formatPrice, getProductWhatsappUrl } from "@/lib/format";
import { getProductOfferPrice, isProductOfferActive } from "@/lib/product-offers";
import { getProductGalleryForColor } from "@/lib/product-images";
import { OfferCountdown } from "@/components/OfferCountdown";
import { useCart } from "@/components/CartProvider";
import galleryStyles from "@/components/ProductGallery.module.css";
import { useProductInlineZoom } from "@/hooks/useProductInlineZoom";

function firstAvailableSize(product: Product, color: string): string {
  const variant = product.colorVariants?.find((item) => item.name === color);
  const perSize = variant?.sizeStocks;
  const tracking = perSize && Object.keys(perSize).length > 0;
  return product.sizes.find((option) => !tracking || Number(perSize?.[option] ?? 0) > 0)
    ?? product.sizes[0]
    ?? "One size";
}

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
  const initialColor = variants[0]?.name ?? product.colors[0] ?? "Default";
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [size, setSize] = useState(() => firstAvailableSize(product, initialColor));
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const selectedVariant =
    variants.find((variant) => variant.name === selectedColor) ?? variants[0];

  const variantImages = getProductGalleryForColor(product, selectedColor);
  const image = variantImages[activeImageIndex] ?? variantImages[0];
  const zoom = useProductInlineZoom(image, (direction) => moveImage(direction));
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
      <div className={galleryStyles.galleryColumn}>
        <div
          ref={zoom.galleryRef}
          className={galleryStyles.gallery + (zoom.scale > 1 ? " " + galleryStyles.galleryZoomed : "")}
          data-product-image-target
          onClick={(event) => {
            if (!image || !zoom.allowClick()) return;
            if (event.target instanceof Element && event.target.closest("button")) return;
            zoom.toggleZoom();
          }}
          onTouchStart={zoom.onTouchStart}
          onTouchMove={zoom.onTouchMove}
          onTouchEnd={zoom.onTouchEnd}
          onTouchCancel={zoom.onTouchCancel}
          onPointerDown={zoom.onPointerDown}
          onPointerMove={zoom.onPointerMove}
          onPointerUp={zoom.onPointerUp}
          onPointerCancel={zoom.onPointerUp}
        >
          {image ? (
            <Image
              key={image}
              src={image}
              alt={product.name + " — " + selectedColor + ", photo " + (activeImageIndex + 1)}
              fill
              preload={activeImageIndex === 0}
              sizes="(max-width: 800px) 100vw, 58vw"
              className={galleryStyles.image + (zoom.dragging ? " " + galleryStyles.imageDragging : "")}
              draggable={false}
              style={{
                transform: `translate3d(${zoom.offset.x}px, ${zoom.offset.y}px, 0) scale(${zoom.scale})`,
              }}
            />
          ) : (
            <span className={galleryStyles.empty}>No product image</span>
          )}

          <div className={galleryStyles.tag}>
            {soldOut ? "Sold out" : selectedColor}
          </div>

          {image ? (
            <button
              type="button"
              className={galleryStyles.zoomLaunch}
              onClick={(event) => { event.stopPropagation(); zoom.toggleZoom(); }}
              aria-label={zoom.scale > 1 ? "Reset product photo zoom" : "Zoom product photo"}
              aria-pressed={zoom.scale > 1}
              title={zoom.scale > 1 ? "Reset zoom" : "Zoom photo"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="10.6" cy="10.6" r="6.3" />
                <path d={zoom.scale > 1 ? "m15.2 15.2 5 5M7.6 10.6h6" : "m15.2 15.2 5 5M10.6 7.6v6M7.6 10.6h6"} />
              </svg>
            </button>
          ) : null}


        </div>

        {variantImages.length > 1 ? (
          <div className={galleryStyles.thumbnails} role="group" aria-label="Choose product photo">
            {variantImages.map((url, index) => (
              <button
                key={url + index}
                type="button"
                onClick={() => setActiveImageIndex(index)}
                className={galleryStyles.thumbnail + " " + (index === activeImageIndex ? galleryStyles.selected : "")}
                aria-label={"Show photo " + (index + 1) + " as main image"}
                aria-pressed={index === activeImageIndex}
              >
                <Image
                  src={url}
                  alt={product.name + " photo " + (index + 1)}
                  fill
                  sizes="(max-width: 640px) 33vw, 120px"
                  className={galleryStyles.thumbnailImage}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={galleryStyles.info}>
        <div className={galleryStyles.inner}>
          <div className={galleryStyles.heading}>
            <div>
              <p className={galleryStyles.eyebrow}>{product.category}</p>
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

          <div className={galleryStyles.choices} aria-label="Choose product options">
            <div className={galleryStyles.optionBlock}>
              <div className={galleryStyles.optionHead}>
                <span>Colour</span>
                <strong>{selectedColor}</strong>
              </div>
              <div className={galleryStyles.swatches} role="group" aria-label="Choose colour">
                {variants.length ? variants.map((variant) => (
                  <button
                    key={variant.name}
                    type="button"
                    className={galleryStyles.colourChoice + " " + (selectedColor === variant.name ? galleryStyles.selected : "")}
                    aria-label={variant.name}
                    aria-pressed={selectedColor === variant.name}
                    onClick={() => {
                      setSelectedColor(variant.name);
                      setSize(firstAvailableSize(product, variant.name));
                      setCartNotice("");
                    }}
                  >
                    <span className={galleryStyles.colourDot} style={{ backgroundColor: variant.value }} aria-hidden="true" />
                    <span>{variant.name}</span>
                  </button>
                )) : (product.colors.length ? product.colors : [initialColor]).map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={galleryStyles.colourChoice + " " + (selectedColor === color ? galleryStyles.selected : "")}
                    aria-pressed={selectedColor === color}
                    onClick={() => {
                      setSelectedColor(color);
                      setSize(firstAvailableSize(product, color));
                      setCartNotice("");
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {product.sizes.length ? (
              <div className={galleryStyles.optionBlock}>
                <div className={galleryStyles.optionHead}>
                  <span>Size</span>
                  <strong>{size}</strong>
                </div>
                <div className={galleryStyles.sizes} role="group" aria-label="Choose size">
                  {product.sizes.map((option) => {
                    const unavailable = product.status !== "active" ||
                      (Object.keys(trackedSizes).length > 0 && Number(trackedSizes[option] ?? 0) <= 0);
                    return (
                      <button
                        type="button"
                        key={option}
                        className={(size === option ? galleryStyles.selected : "") + (unavailable ? " " + galleryStyles.unavailableSize : "")}
                        aria-pressed={size === option}
                        aria-label={option + (unavailable ? ", sold out" : "")}
                        disabled={unavailable && option !== size}
                        onClick={() => {
                          setSize(option);
                          setCartNotice("");
                        }}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {!soldOut ? (
            <div className={galleryStyles.stockRow} role="status" aria-live="polite">
              <span className={galleryStyles.stockDot} aria-hidden="true" />
              <span>In stock · {stock} available</span>
            </div>
          ) : null}

          <div className={galleryStyles.actions}>
            {soldOut ? (
              <button type="button" className={galleryStyles.soldOutNotice} disabled aria-label="Sold out — unavailable for the selected colour and size">
                <ShoppingBagIcon width={19} height={19} />
                <span>Sold out</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={galleryStyles.secondaryButton}
                  onClick={() => {
                    addItem({ productId: product.id, color: selectedColor, size, quantity: 1 });
                    setCartNotice("Added to bag");
                  }}
                >
                  <ShoppingBagIcon width={19} height={19} />
                  <span>Add to bag</span>
                </button>
                {whatsappUrl !== "#" ? (
                  <a
                    className={galleryStyles.primaryButton}
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Order on WhatsApp
                  </a>
                ) : null}
              </>
            )}
          </div>

          {cartNotice ? (
            <div role="status" aria-live="polite" className={galleryStyles.cartNotice}>
              <span>{cartNotice}</span>
              <Link href="/cart" className={galleryStyles.viewBagLink}>View bag <ArrowUpRightIcon width={16} height={16} /></Link>
            </div>
          ) : null}
          {!soldOut && whatsappUrl !== "#" ? (
            <p className={galleryStyles.shortNote}>Selected colour and size are included in your message.</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
