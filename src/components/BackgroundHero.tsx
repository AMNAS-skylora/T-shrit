import Link from "next/link";
import type { CSSProperties } from "react";
import type { ComfortSlide } from "@/lib/comfort-slides";
import styles from "./BackgroundHero.module.css";

export function BackgroundHero({ slide, preview = false }: { slide: ComfortSlide; preview?: boolean }) {
  const imageStyle = { opacity: slide.imageOpacity / 100, "--background-scale": slide.imagePlacement.desktop.scale / 100, "--background-mobile-scale": slide.imagePlacement.mobile.scale / 100 } as CSSProperties;
  return <section className={styles.hero} aria-label="Background image slide">
    <div className={styles.background} aria-hidden="true">{slide.imageUrl ? <img src={slide.imageUrl} alt="" style={imageStyle} /> : null}</div>
    <div className={styles.copy}>
      <h2>{slide.title}</h2>
      {slide.subtitle ? <p>{slide.subtitle}</p> : null}
      {preview && !slide.imageUrl ? <p className={styles.empty}>Upload a full background image for this slide.</p> : null}
      <div className={styles.actions}><Link href={slide.href} className={styles.primary}>{slide.button}</Link>{slide.secondaryButton && slide.secondaryHref ? <Link href={slide.secondaryHref} className={styles.secondary}>{slide.secondaryButton}</Link> : null}</div>
    </div>
  </section>;
}
