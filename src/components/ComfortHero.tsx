import Link from "next/link";
import type { StoreSettings } from "@/types/commerce";
import type { Product } from "@/types/product";
import { getProductPrimaryImage } from "@/lib/product-images";
import styles from "./ComfortHero.module.css";

export function ComfortHero({ settings, products, preview = false }: { settings: StoreSettings; products: Product[]; preview?: boolean }) {
  const candidates = products.filter((product) => product.status === "active" && getProductPrimaryImage(product));
  const product = candidates.find((item) => item.spotlight) || candidates[0];
  const Title = preview ? "h3" : "h1";
  return <section aria-label="First hero" className={styles.hero}>
    <Title className={styles.title}>{settings.homeDefaultHeroTitle}</Title>
    {settings.homeDefaultHeroImageUrl ? <img src={settings.homeDefaultHeroImageUrl} alt="Featured collection" className={styles.model} style={{ objectPosition: settings.homeDefaultHeroImagePosition + " bottom" }} /> : preview ? <p className={styles.empty}>Upload your model image in First hero settings. A transparent cutout works best.</p> : null}
    <p className={styles.subtitle}>{settings.homeDefaultHeroSubtitle}</p>
    {product ? <Link href={"/products/" + product.slug} className={styles.product}><span className={styles.productName}>{product.name}</span><img src={getProductPrimaryImage(product)} alt={product.name} /><span className={styles.productPrice}>{product.category}<strong>₹{product.price.toLocaleString("en-IN")}</strong></span></Link> : null}
    <div className={styles.actions}><Link href={settings.homeDefaultHeroButtonHref || "/products"} className={styles.primary}>{settings.homeDefaultHeroButtonLabel || "Shop collection"}</Link><Link href="/products" className={styles.secondary}>Explore products</Link></div>
  </section>;
}
