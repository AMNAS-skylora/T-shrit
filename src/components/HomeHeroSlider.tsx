"use client";

import { getHeroSwipeDirection, type SwipePoint } from "@/lib/hero-swipe";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const [dragging, setDragging] = useState(false);
  const mouseStart = useRef<SwipePoint | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const touchStart = useRef<SwipePoint | null>(null);
  const active = useMemo(() => getComfortSlides(slides, products, now, section), [slides, products, now, section]);
  const selected = Math.max(0, active.findIndex((slide) => slide.id === selectedId));
  useLayoutEffect(() => {
    const element = root.current;
    if (!element || preview || section !== "primary" || !active.length) return;
    const measure = () => {
      const top = Math.max(0, element.getBoundingClientRect().top + window.scrollY);
      element.style.setProperty("--hero-top-offset", `${top}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    const main = element.closest("main");
    const header = document.querySelector(".site-header");
    if (main) observer.observe(main);
    if (header) observer.observe(header);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [preview, section, active.length]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    const element = root.current;
    let inView = true;
    const updateVisibility = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; updateVisibility(); });
    if (element) observer.observe(element);
    document.addEventListener("visibilitychange", updateVisibility); updateVisibility();
    return () => { window.clearInterval(timer); observer.disconnect(); document.removeEventListener("visibilitychange", updateVisibility); };
  }, []);
  // Motion preference controls visual movement, not whether the slides advance.
  const automatic = active.length > 1 && !paused && !dragging && !hovered && !focused && visible;
  useEffect(() => {
    if (!automatic) return;
    const timer = window.setTimeout(() => setSelectedId(active[(selected + 1) % active.length].id), 5000);
    return () => window.clearTimeout(timer);
  }, [active, selected, automatic]);
  function move(direction: number) {
    if (active.length > 1) setSelectedId(active[(selected + direction + active.length) % active.length].id);
  }
  return <div ref={root} data-motion-owned className={`${styles.slider} ${section === "primary" && active.length && !preview ? styles.fullViewport : ""} ${active.length > 1 ? styles.draggable : ""} ${section === "secondary" && (active.length || preview) ? styles.secondarySlider : section === "tertiary" && (active.length || preview) ? styles.backgroundSlider : ""}`} role="region" tabIndex={active.length > 1 ? 0 : undefined} aria-roledescription="carousel" aria-label={section === "secondary" ? "Campaigns" : section === "tertiary" ? "Background collections" : "Featured collections"}
    onKeyDown={(event) => { if (event.target !== event.currentTarget || active.length < 2) return; if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); } else if (event.key === " ") { event.preventDefault(); setPaused(value => !value); } }}
    onPointerDown={(event) => { if (event.pointerType !== "mouse" || event.button !== 0 || active.length < 2 || (event.target as Element).closest("a, button, select, input, textarea")) return; mouseStart.current = { x: event.clientX, y: event.clientY }; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerUp={(event) => { if (event.pointerType !== "mouse" || !mouseStart.current) return; const direction = getHeroSwipeDirection(mouseStart.current, { x: event.clientX, y: event.clientY }); mouseStart.current = null; setDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); if (direction) move(direction); }}
    onPointerCancel={() => { mouseStart.current = null; setDragging(false); }}
    onDragStart={(event) => { if (mouseStart.current) event.preventDefault(); }}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onTouchStart={(event) => { touchStart.current = (event.target as Element).closest("button, select, input, textarea") ? null : { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
    onTouchCancel={() => { touchStart.current = null; }}
    onTouchEnd={(event) => { if (touchStart.current) { const direction = getHeroSwipeDirection(touchStart.current, { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }); if (direction) { event.preventDefault(); move(direction); } touchStart.current = null; } }}>
    {active.length ? <div className={styles.track} style={{ transform: `translateX(-${selected * 100}%)` }} aria-live={automatic ? "off" : "polite"}>
      {active.map((slide, index) => <div key={slide.id} className={styles.slide} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${active.length}`} aria-hidden={index !== selected} inert={index !== selected}>
        {section === "tertiary" ? <BackgroundHero slide={slide} preview={preview} /> : section === "secondary" ? <SecondaryHero slide={slide} preview={preview} /> : <ComfortHero showProductCard={slide.showProductCard} imageOpacity={slide.imageOpacity} settings={{ ...settings, homeDefaultHeroTitle: slide.title, homeDefaultHeroImageUrl: slide.imageUrl, homeDefaultHeroImagePosition: slide.imagePosition, homeDefaultHeroImagePlacement: slide.imagePlacement, homeDefaultHeroButtonLabel: slide.button, homeDefaultHeroButtonHref: slide.href }} products={slide.product ? [slide.product] : []} preview={preview} heading={index === 0} />}
      </div>)}
    </div> : preview ? <p className={styles.noSlides}>Add and enable a slide to preview the slider.</p> : null}

  </div>;
}
