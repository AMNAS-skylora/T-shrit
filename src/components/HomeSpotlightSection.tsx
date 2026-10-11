"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useOfferClock } from "@/hooks/useOfferClock";
import { getProductOfferPrice, isProductOfferActive } from "@/lib/product-offers";
import { OfferCountdown } from "@/components/OfferCountdown";
import { ProductActions } from "@/components/ProductActions";
import { formatPrice } from "@/lib/format";
import { getProductImageForColor } from "@/lib/product-images";
import type { Product } from "@/types/product";
import styles from "./HomeSpotlightSection.module.css";

export function HomeSpotlightSection({ product, badge }: { product?: Product; badge: string }) {
  const now = useOfferClock(product);
  const [selectedColor, setSelectedColor] = useState(product?.colorVariants?.[0]?.name ?? product?.colors[0] ?? "Default");
  if (!product || product.status !== "active" || !product.spotlight) return null;
  const offerActive = isProductOfferActive(product, now);
  const image = getProductImageForColor(product, selectedColor);
  const productHref = "/products/" + product.slug;

  return <section id="product-spotlight" className={styles.section} aria-labelledby="spotlight-title">
    <div className={styles.layout}>
      <Link href={productHref} className={styles.media} aria-label={"View " + product.name}>
        {image ? <Image src={image} alt={product.name} fill sizes="(max-width: 800px) 100vw, 50vw" className={styles.image} /> : <span className={styles.noImage}>No image available</span>}
      </Link>
      <div className={styles.info}>
        <p className={styles.eyebrow}>{badge}</p>
        <h2 id="spotlight-title" className={styles.title}>{product.name}</h2>
        <div className={styles.price}>
          <strong>{formatPrice(getProductOfferPrice(product, now))}</strong>
          {offerActive ? <del>{formatPrice(product.price)}</del> : null}
        </div>
        {offerActive ? <OfferCountdown product={product} now={now} /> : null}
        {product.description ? <p className={styles.description}>{product.description}</p> : null}
        <div className={styles.options}>
          <ProductActions key={product.id} product={product} compact showColorOptions onColorChange={setSelectedColor} />
        </div>
        <Link href={productHref} className={styles.view}>View full product <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  </section>;
}
