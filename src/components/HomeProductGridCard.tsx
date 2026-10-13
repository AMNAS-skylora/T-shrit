"use client";

import Image from "next/image";
import Link from "next/link";
import { useOfferClock } from "@/hooks/useOfferClock";
import { getProductOfferPrice, isProductOfferActive } from "@/lib/product-offers";
import { formatPrice } from "@/lib/format";
import { getProductPrimaryImage } from "@/lib/product-images";
import type { Product } from "@/types/product";
import styles from "./HomeProductGridCard.module.css";

export function HomeProductGridCard({
  theme = "light",
  product,
}: {
  theme?: "light" | "dark";
  product: Product;
  // Existing callers can continue passing this; ordering is on product details.
  whatsappNumber?: string;
}) {
  const image = getProductPrimaryImage(product);
  const now = useOfferClock(product, false);
  const offerActive = isProductOfferActive(product, now);
  const price = getProductOfferPrice(product, now);
  const discounted = offerActive && price < product.price;
  const available = product.status === "active" && product.stock > 0;
  const limitedOffer = available && discounted && Boolean(product.offerEndsAt);

  return (
    <article className={styles.card + (theme === "dark" ? " " + styles.dark : "")}>
      <Link
        href={`/products/${product.slug}`}
        data-product-transition
        aria-label={`View ${product.name}`}
        className={styles.link}
      >
        <div className={styles.media}>
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 639px) 46vw, (max-width: 1023px) 44vw, (max-width: 1600px) 31vw, 500px"
              className={styles.photo}
            />
          ) : (
            <span className={styles.placeholder}>No image</span>
          )}

          {!available ? (
            <span className={styles.badge + " " + styles.badgeSold}>Sold out</span>
          ) : limitedOffer ? (
            <span className={styles.badge + " " + styles.badgeOffer}>Limited offer</span>
          ) : null}
        </div>

        <div className={styles.content}>
          {product.category ? (
            <p className={styles.category}>{product.category}</p>
          ) : null}

          <h3 className={styles.name}>{product.name}</h3>

          <div className={styles.prices}>
            <strong className={styles.price}>{formatPrice(price)}</strong>
            {discounted ? (
              <del className={styles.oldPrice}>{formatPrice(product.price)}</del>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
