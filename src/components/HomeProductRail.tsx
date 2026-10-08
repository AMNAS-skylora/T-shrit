"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";
import styles from "@/components/ShoppingHome.module.css";

export function HomeProductRail({ products }: { products: Product[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(true);
  const move = useCallback((direction: number) => {
    const node = rail.current;
    if (!node) return;
    const end = node.scrollWidth - node.clientWidth;
    const behavior = "smooth" as const;
    if (direction > 0 && node.scrollLeft >= end - 2) { node.scrollTo({ left: 0, behavior }); return; }
    if (direction < 0 && node.scrollLeft <= 2) { node.scrollTo({ left: end, behavior }); return; }
    const items = Array.from(node.children) as HTMLElement[];
    if (!items.length) return;
    const current = items.reduce((best, item, index) => Math.abs(item.offsetLeft - node.offsetLeft - node.scrollLeft) < Math.abs(items[best].offsetLeft - node.offsetLeft - node.scrollLeft) ? index : best, 0);
    const next = (current + direction + items.length) % items.length;
    node.scrollTo({ left: items[next].offsetLeft - node.offsetLeft, behavior });
  }, []);

  useEffect(() => {
    if (paused || !playing || products.length <= 1) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const rect = rail.current?.getBoundingClientRect();
      if (rect && rect.top < innerHeight && rect.bottom > 0) move(1);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [paused, playing, products.length, move]);

  if (!products.length) return null;
  return (
    <section className={styles.section} aria-label="Explore the collection" data-shop-reveal>
      <div className={styles.sectionHead}>
        <div><p className={styles.kicker}>IN YOUR ROTATION</p><h2>A closer look.</h2></div>
        <div className={styles.railControls}>
          <button type="button" onClick={() => move(-1)} aria-label="Previous products">←</button>
          <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause product carousel" : "Play product carousel"}>{playing ? "Ⅱ" : "▶"}</button>
          <button type="button" onClick={() => move(1)} aria-label="Next products">→</button>
        </div>
      </div>
      <div ref={rail} className={styles.rail} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)} onTouchCancel={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false); }}>
        {products.map((product) => <div key={product.id} className={styles.railItem}><ProductCard product={product} /></div>)}
      </div>
    </section>
  );
}
