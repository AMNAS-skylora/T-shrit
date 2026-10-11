"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/types/product";
import { getFeaturedProducts } from "@/lib/featured-products";
import { getProductPrimaryImage } from "@/lib/product-images";
import { getProductOfferPrice } from "@/lib/product-offers";
import { formatPrice } from "@/lib/format";
import { useOfferClock } from "@/hooks/useOfferClock";
import { OfferCountdown } from "@/components/OfferCountdown";
import styles from "./FeaturedProductMotion.module.css";

export function FeaturedProductMotion({ products = [], layout = "motion" }: { products?: Product[]; layout?: "motion" | "static" }) {
  const items = useMemo(() => getFeaturedProducts(products), [products]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
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
    if (layout === "static" || reduced || paused || hovered || focused || !inView || !pageVisible || items.length < 2) return;
    const rotation = window.setInterval(() => select(((index < items.length ? index : 0) + 1) % items.length), 5000);
    return () => window.clearInterval(rotation);
  }, [index, items.length, layout, reduced, paused, hovered, focused, inView, pageVisible]);
  useEffect(() => { if (layout === "static") { window.clearTimeout(timer.current); window.cancelAnimationFrame(frame.current); setIndex(0); setVisible(true); } }, [layout]);
  useEffect(() => { if (items.length > 1) { const next = new Image(); next.src = getProductPrimaryImage(items[(activeIndex + 1) % items.length]); } }, [items, activeIndex]);
  useEffect(() => () => { window.clearTimeout(timer.current); window.cancelAnimationFrame(frame.current); }, []);
  if (!current) return null;

  return <section ref={root} id="featured-products" className={styles.section} data-motion-owned aria-label="Featured products" onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false); }}>
    <div className={styles.layout}>
      <div className={styles.info} data-visible={visible}>
        <h2>{current.name}</h2>
        {current.description ? <p className={styles.description}>{current.description}</p> : null}
        <strong className={styles.price}>{formatPrice(getProductOfferPrice(current, now))}</strong>
        <OfferCountdown product={current} now={now} />
        <Link href={"/products/" + current.slug} className={styles.button}>View product <span aria-hidden="true">↗</span></Link>
      </div>
      <Link href={"/products/" + current.slug} className={styles.media} data-visible={visible} aria-label={"View " + current.name}>
        <img src={getProductPrimaryImage(current)} alt={current.name} loading="lazy" decoding="async" draggable={false} />
      </Link>
    </div>
    {items.length > 1 && layout !== "static" ? <div className={styles.controls} role="group" aria-label="Choose featured product">
      <button type="button" onClick={() => select((activeIndex + items.length - 1) % items.length)} aria-label="Previous featured product">←</button>
      <span className={styles.position} aria-live="off">{activeIndex + 1} / {items.length}</span>
      <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? "Play featured slideshow" : "Pause featured slideshow"}>{paused ? "Play" : "Pause"}</button>
      <button type="button" onClick={() => select((activeIndex + 1) % items.length)} aria-label="Next featured product">→</button>
    </div> : null}
  </section>;
}
