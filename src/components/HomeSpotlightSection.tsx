"use client";

import { useOfferClock } from "@/hooks/useOfferClock";
import { getProductOfferPrice, getProductOfferCountdown, isProductOfferActive } from "@/lib/product-offers";
import Image from "next/image";
import Link from "next/link";
import { ProductActions } from "@/components/ProductActions";
import { formatPrice } from "@/lib/format";
import { getProductPrimaryImage } from "@/lib/product-images";
import type { Product } from "@/types/product";

export function HomeSpotlightSection({
  product,
  badge,
}: {
  product?: Product;
  badge: string;
}) {
  const now = useOfferClock(product);
  if (!product) return null;
  const offerActive = isProductOfferActive(product, now);

  const image = getProductPrimaryImage(product);

  return (
    <section className="home-spotlight !border-0">
      <div className="home-spotlight-grid !border-0">
        <Link
          href={"/products/" + product.slug}
          className="home-spotlight-media"
          aria-label={"View " + product.name}
        >
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 900px) 100vw, 58vw"
              className="home-spotlight-image"
            />
          ) : (
            <span>No image</span>
          )}

          <div className="home-spotlight-media-badge">
            <span>01</span>
            <strong>{badge}</strong>
          </div>
        </Link>

        <div className="home-spotlight-info">
          <div className="home-spotlight-info-inner">
            <div className="home-spotlight-topline">
              <span>{product.stock > 0 ? "In stock" : "Sold out"}</span>
            </div>

            <div>
              <h2>{product.name}</h2>

              <div className="home-spotlight-price">
                <strong>{formatPrice(getProductOfferPrice(product, now))}</strong>
                {offerActive ? (
                  <del>{formatPrice(product.price)}</del>
                ) : null}
              </div>
              {offerActive ? <p className="text-xs tabular-nums">Offer ends in {getProductOfferCountdown(product, now)}</p> : null}
            </div>

            <p className="home-spotlight-description">
              {product.description}
            </p>

            <div className="home-spotlight-meta">
              <div>
                <span>Colour</span>
                <strong>{product.colors.join(" / ")}</strong>
              </div>
              <div>
                <span>Sizes</span>
                <strong>{product.sizes.join(" · ")}</strong>
              </div>
            </div>

            <ProductActions product={product} compact />

            <Link
              href={"/products/" + product.slug}
              className="home-spotlight-view"
            >
              View full product <span>↗</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}