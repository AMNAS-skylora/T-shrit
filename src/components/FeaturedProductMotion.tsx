"use client";

import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/UiIcons";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/types/product";
import { getFeaturedProducts } from "@/lib/featured-products";
import { getProductPrimaryImage } from "@/lib/product-images";
import { getProductOfferPrice, isProductOfferActive } from "@/lib/product-offers";
import { formatPrice } from "@/lib/format";
import { useOfferClock } from "@/hooks/useOfferClock";
import styles from "./FeaturedProductMotion.module.css";

export function FeaturedProductMotion({ products = [], layout = "motion" }: { products?: Product[]; layout?: "motion" | "static" }) {
  const items = useMemo(() => {
    const featured = getFeaturedProducts(products);
    if (featured.length >= 2) return featured;
    // A single featured item cannot auto-rotate. Fill remaining slots with
    // genuinely published products and their real uploaded images.
    const otherProducts = products
      .filter((product) =>
        product.status === "active" &&
        Boolean(getProductPrimaryImage(product)) &&
        !featured.some((item) => item.id === product.id),
      )
      .sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100));
    return [...featured, ...otherProducts].slice(0, 5);
  }, [products]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const root = useRef<HTMLElement>(null);
  const timer = useRef<number>(0);
  const frame = useRef<number>(0);
  const activeIndex = index < items.length ? index : 0;
  const current = items[activeIndex];
  const now = useOfferClock(current);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(preference.matches);
    const visibility = () => setPageVisible(!document.hidden);
    sync(); visibility();
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", visibility);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    if (root.current) observer?.observe(root.current);
    if (!observer) setInView(true);
    return () => { preference.removeEventListener("change", sync); document.removeEventListener("visibilitychange", visibility); observer?.disconnect(); };
  }, []);

  function select(next: number) {
    window.clearTimeout(timer.current); window.cancelAnimationFrame(frame.current);
    if (reduced || layout === "static") { setIndex(next); setVisible(true); return; }
    setVisible(false);
    timer.current = window.setTimeout(() => {
      setIndex(next);
      frame.current = window.requestAnimationFrame(() => { frame.current = window.requestAnimationFrame(() => setVisible(true)); });
    }, 260);
  }
  useEffect(() => {
    if (!inView || !pageVisible || items.length < 2) return;
    const rotation = window.setInterval(() => select(((index < items.length ? index : 0) + 1) % items.length), 4500);
    return () => window.clearInterval(rotation);
  }, [index, items.length, layout, reduced, inView, pageVisible]);
  useEffect(() => { if (layout === "static") { window.clearTimeout(timer.current); window.cancelAnimationFrame(frame.current); setIndex(0); setVisible(true); } }, [layout]);
  useEffect(() => { if (items.length > 1) { const next = new Image(); next.src = getProductPrimaryImage(items[(activeIndex + 1) % items.length]); } }, [items, activeIndex]);
  useEffect(() => () => { window.clearTimeout(timer.current); window.cancelAnimationFrame(frame.current); }, []);
  if (!current) return null;
  const offerPrice = getProductOfferPrice(current, now);
  const showOriginalPrice = isProductOfferActive(current, now) && offerPrice < current.price;

  return <section ref={root} id="featured-products" className={styles.section} data-motion-owned aria-label="Featured products">
    <div className={styles.layout}>
      <div className={styles.info} data-visible={visible}>
        <h2>{current.name}</h2>
        {current.description ? <p className={styles.description}>{current.description}</p> : null}
        <div className={styles.priceRow}>
          <strong className={styles.price}>{formatPrice(offerPrice)}</strong>
          {showOriginalPrice ? <del className={styles.originalPrice}>{formatPrice(current.price)}</del> : null}
        </div>
        <Link href={"/products/" + current.slug} className={styles.button} data-product-transition>
          <span>View product</span><ArrowUpRightIcon width={18} height={18} />
        </Link>
      </div>
      <Link href={"/products/" + current.slug} className={styles.media} data-product-transition data-visible={visible} aria-label={"View " + current.name}>
        <img src={getProductPrimaryImage(current)} alt={current.name} loading="lazy" decoding="async" draggable={false} />
      </Link>
    </div>
    {items.length > 1 ? (
      <div className={styles.controls} aria-label="Featured products change automatically">
        <span className={styles.position} aria-hidden="true">
          {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </span>
        <div className={styles.progressTrack} aria-hidden="true">
          {items.map((item, itemIndex) => (
            <span
              key={item.id}
              className={styles.progressSegment}
              data-current={activeIndex === itemIndex}
            />
          ))}
        </div>
      </div>
    ) : null}
  </section>;
}
