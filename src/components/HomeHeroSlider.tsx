"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { StoreSettings } from "@/types/commerce";
import type { Product } from "@/types/product";
import type { HeroSlideConfig } from "@/data/hero-slides";
import { getComfortSlides } from "@/lib/comfort-slides";
import { ComfortHero } from "@/components/ComfortHero";
import styles from "./ComfortHero.module.css";

export function HomeHeroSlider({ settings, products, slides, initialNow, preview = false }: { settings: StoreSettings; products: Product[]; slides: HeroSlideConfig[]; initialNow: number; preview?: boolean }) {
  const [now, setNow] = useState(initialNow);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);
  const active = useMemo(() => getComfortSlides(settings, slides, products, now), [settings, slides, products, now]);
  const selected = Math.max(0, active.findIndex((slide) => slide.id === selectedId));
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion(); media.addEventListener("change", updateMotion);
    const element = root.current;
    let inView = true;
    const updateVisibility = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; updateVisibility(); });
    if (element) observer.observe(element);
    document.addEventListener("visibilitychange", updateVisibility); updateVisibility();
    return () => { window.clearInterval(timer); observer.disconnect(); media.removeEventListener("change", updateMotion); document.removeEventListener("visibilitychange", updateVisibility); };
  }, []);
  const automatic = active.length > 1 && !paused && !hovered && !focused && visible && !reducedMotion;
  useEffect(() => {
    if (!automatic) return;
    const timer = window.setTimeout(() => setSelectedId(active[(selected + 1) % active.length].id), 5000);
    return () => window.clearTimeout(timer);
  }, [active, selected, automatic]);
  function move(direction: number) {
    if (active.length > 1) setSelectedId(active[(selected + direction + active.length) % active.length].id);
  }
  return <div ref={root} data-motion-owned className={styles.slider} role="region" aria-roledescription="carousel" aria-label="Featured collections"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
    onTouchEnd={(event) => { if (touchStart.current !== null) { const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1); touchStart.current = null; } }}>
    {active.length ? <div className={styles.track} style={{ transform: `translateX(-${selected * 100}%)` }} aria-live={automatic ? "off" : "polite"}>
      {active.map((slide, index) => <div key={slide.id} className={styles.slide} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${active.length}`} aria-hidden={index !== selected} inert={index !== selected}>
        <ComfortHero settings={{ ...settings, homeDefaultHeroTitle: slide.title, homeDefaultHeroImageUrl: slide.imageUrl, homeDefaultHeroImagePosition: slide.imagePosition, homeDefaultHeroImagePlacement: slide.imagePlacement, homeDefaultHeroButtonLabel: slide.button, homeDefaultHeroButtonHref: slide.href }} products={slide.product ? [slide.product] : []} preview={preview} heading={index === 0} />
      </div>)}
    </div> : preview ? <p className={styles.noSlides}>Turn on First hero or add an enabled slide to preview the slider.</p> : null}
    {active.length > 1 ? <div className={styles.controls}>
      <button type="button" aria-label="Previous slide" onClick={() => move(-1)}>←</button>
      <div className={styles.dots}>{active.map((slide, index) => <button type="button" key={slide.id} aria-label={`Show slide ${index + 1}`} aria-current={index === selected ? "true" : undefined} onClick={() => setSelectedId(slide.id)}><span /></button>)}</div>
      <button type="button" aria-label="Next slide" onClick={() => move(1)}>→</button>
      <button type="button" aria-label={paused ? "Start automatic slides" : "Pause automatic slides"} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Play" : "Pause"}</button>
    </div> : null}
  </div>;
}
