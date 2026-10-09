"use client";

import { getHeroSwipeDirection, type SwipePoint } from "@/lib/hero-swipe";

import { useEffect, useMemo, useRef, useState } from "react";
import type { StoreSettings } from "@/types/commerce";
import type { Product } from "@/types/product";
import type { HeroSection, HeroSlideConfig } from "@/data/hero-slides";
import { getComfortSlides } from "@/lib/comfort-slides";
import { BackgroundHero } from "@/components/BackgroundHero";
import { SecondaryHero } from "@/components/SecondaryHero";
import { ComfortHero } from "@/components/ComfortHero";
import styles from "./ComfortHero.module.css";

export function HomeHeroSlider({ settings, products, slides, initialNow, preview = false, section = "primary" }: { settings: StoreSettings; products: Product[]; slides: HeroSlideConfig[]; initialNow: number; preview?: boolean; section?: HeroSection }) {
  const [now, setNow] = useState(initialNow);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touchStart = useRef<SwipePoint | null>(null);
  const active = useMemo(() => getComfortSlides(slides, products, now, section), [slides, products, now, section]);
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
  return <div ref={root} data-motion-owned className={`${styles.slider} ${section === "primary" && active.length && !preview ? styles.fullViewport : ""} ${active.length > 1 ? styles.hasControls : ""} ${section === "secondary" && (active.length || preview) ? styles.secondarySlider : section === "tertiary" && (active.length || preview) ? styles.backgroundSlider : ""}`} role="region" aria-roledescription="carousel" aria-label={section === "secondary" ? "Campaigns" : section === "tertiary" ? "Background collections" : "Featured collections"}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onTouchStart={(event) => { touchStart.current = (event.target as Element).closest("button, select, input, textarea") ? null : { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
    onTouchCancel={() => { touchStart.current = null; }}
    onTouchEnd={(event) => { if (touchStart.current) { const direction = getHeroSwipeDirection(touchStart.current, { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }); if (direction) { event.preventDefault(); move(direction); } touchStart.current = null; } }}>
    {active.length ? <div className={styles.track} style={{ transform: `translateX(-${selected * 100}%)` }} aria-live={automatic ? "off" : "polite"}>
      {active.map((slide, index) => <div key={slide.id} className={styles.slide} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${active.length}`} aria-hidden={index !== selected} inert={index !== selected}>
        {section === "tertiary" ? <BackgroundHero slide={slide} preview={preview} /> : section === "secondary" ? <SecondaryHero slide={slide} preview={preview} /> : <ComfortHero settings={{ ...settings, homeDefaultHeroTitle: slide.title, homeDefaultHeroImageUrl: slide.imageUrl, homeDefaultHeroImagePosition: slide.imagePosition, homeDefaultHeroImagePlacement: slide.imagePlacement, homeDefaultHeroButtonLabel: slide.button, homeDefaultHeroButtonHref: slide.href }} products={slide.product ? [slide.product] : []} preview={preview} heading={index === 0} />}
      </div>)}
    </div> : preview ? <p className={styles.noSlides}>Add and enable a slide to preview the slider.</p> : null}
    {active.length > 1 ? <div className={styles.controls}>
      <button type="button" aria-label="Previous slide" onClick={() => move(-1)}>←</button>
      {active.length > 3 ? <select aria-label="Select hero slide" value={active[selected].id} onChange={(event) => setSelectedId(event.target.value)}>{active.map((slide, index) => <option key={slide.id} value={slide.id}>{index + 1} / {active.length}</option>)}</select> : <div className={styles.dots}>{active.map((slide, index) => <button type="button" key={slide.id} aria-label={`Show slide ${index + 1}`} aria-current={index === selected ? "true" : undefined} onClick={() => setSelectedId(slide.id)}><span /></button>)}</div>}
      <button type="button" aria-label="Next slide" onClick={() => move(1)}>→</button>
      <button type="button" aria-label={paused ? "Start automatic slides" : "Pause automatic slides"} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Play" : "Pause"}</button>
    </div> : null}
  </div>;
}
