import Link from "next/link";
import type { CSSProperties } from "react";
import type { ComfortSlide } from "@/lib/comfort-slides";
import { getProductPrimaryImage } from "@/lib/product-images";
import styles from "./SecondaryHero.module.css";

export function SecondaryHero({ slide, preview = false }: { slide: ComfortSlide; preview?: boolean }) {
  const style = { "--campaign-scale": slide.imagePlacement.desktop.scale / 100, "--campaign-mobile-scale": slide.imagePlacement.mobile.scale / 100 } as CSSProperties;
  return <section className={styles.campaign} aria-label="Campaign slide">
    <div className={styles.media}>
      {slide.imageUrl ? <img src={slide.imageUrl} alt={slide.title || "Featured collection"} style={style} /> : preview ? <p className={styles.empty}>Upload a campaign image for this slide.</p> : null}
      <span className={styles.accent} aria-hidden="true" />
    </div>
    <div className={styles.copy}>
      <span className={styles.brand}>KLEID.IN</span>
      <h2>{slide.title}</h2>
      {slide.subtitle ? <p className={styles.description}>{slide.subtitle}</p> : null}
      <div className={styles.actions}><Link href={slide.href} className={styles.primary}>{slide.button}</Link><Link href="/products" className={styles.secondary}>Explore products <span aria-hidden="true">↗</span></Link></div>
    </div>
    {slide.product && getProductPrimaryImage(slide.product) ? <Link href={"/products/" + slide.product.slug} aria-label={"View " + slide.product.name} className={styles.product}><img src={getProductPrimaryImage(slide.product)} alt={slide.product.name} /></Link> : null}
    <span className={styles.arc} aria-hidden="true" />
    {slide.tickerText ? <div className={styles.ticker}><span aria-hidden="true">//</span><p>{slide.tickerText}</p><span aria-hidden="true">//</span></div> : null}
  </section>;
}
