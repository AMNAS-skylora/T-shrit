import type { CSSProperties } from "react";
import { normalizeHeroImagePlacement } from "@/lib/hero-image-placement";
import Link from "next/link";
import type { StoreSettings } from "@/types/commerce";
import type { Product } from "@/types/product";
import { getProductPrimaryImage } from "@/lib/product-images";
import styles from "./ComfortHero.module.css";

export function ComfortHero({ settings, products, preview = false, heading = true }: { settings: StoreSettings; products: Product[]; preview?: boolean; heading?: boolean }) {
  const candidates = products.filter((product) => product.status === "active" && getProductPrimaryImage(product));
  const product = candidates.find((item) => item.spotlight) || candidates[0];
  const placement = normalizeHeroImagePlacement(settings.homeDefaultHeroImagePlacement);
  const imageStyle = { objectPosition: "center bottom", "--image-scale": placement.desktop.scale / 100, "--image-mobile-scale": placement.mobile.scale / 100 } as CSSProperties;
  const Title = preview ? "h3" : heading ? "h1" : "h2";
  return <section aria-label="Hero slide" className={styles.hero}>
    <Title className={styles.title}>{settings.homeDefaultHeroTitle}</Title>
    {settings.homeDefaultHeroImageUrl ? <img src={settings.homeDefaultHeroImageUrl} alt="Featured collection" className={styles.model} style={imageStyle} /> : preview ? <p className={styles.empty}>Upload an image for this slide. A transparent cutout works best.</p> : null}
    {product ? <Link href={"/products/" + product.slug} className={styles.product}><span className={styles.productName}>{product.name}</span><img src={getProductPrimaryImage(product)} alt={product.name} /><span className={styles.productPrice}>{product.category}<strong>₹{product.price.toLocaleString("en-IN")}</strong></span></Link> : null}
    <div className={styles.actions}><Link href={settings.homeDefaultHeroButtonHref || "/products"} className={styles.primary}>{settings.homeDefaultHeroButtonLabel || "Shop collection"}</Link><Link href="/products" className={styles.secondary}>Explore products</Link></div>
  </section>;
}
