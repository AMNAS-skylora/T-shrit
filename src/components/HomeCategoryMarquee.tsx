"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { getCategoryShopHref } from "@/lib/storefront-categories";
import styles from "./HomeCategoryMarquee.module.css";

// Gentle, constant motion instead of jumping one category at a time.
const MOBILE_SPEED_PX_PER_SECOND = 27;
const RESUME_AFTER_GESTURE_MS = 3500;

export function HomeCategoryMarquee({ categories }: { categories: string[] }) {
  const mobileScrollRef = useRef<HTMLElement>(null);
  const firstGroupRef = useRef<HTMLDivElement>(null);
  const interactingRef = useRef(false);
  const resumeAtRef = useRef(0);

  useEffect(() => {
    const scroller = mobileScrollRef.current;
    const firstGroup = firstGroupRef.current;
    if (!scroller || !firstGroup || categories.length < 2) return;

    const mobile = window.matchMedia("(max-width: 767px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = true;
    let lastFrame: number | null = null;
    let animationFrame = 0;

    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
          inView = Boolean(entry?.isIntersecting);
          lastFrame = null;
        }, { threshold: 0 });
    observer?.observe(scroller);

    const animate = (now: number) => {
      const elapsed = lastFrame === null ? 0 : Math.min(64, now - lastFrame);
      lastFrame = now;

      // Pause on touch/drag/keyboard interaction, hidden tabs, reduced-motion
      // preferences and when the user has focused one of the category links.
      if (
        mobile.matches &&
        !reducedMotion.matches &&
        !document.hidden &&
        inView &&
        !interactingRef.current &&
        now >= resumeAtRef.current &&
        !scroller.contains(document.activeElement)
      ) {
        const cycleWidth = firstGroup.offsetWidth;
        if (cycleWidth > 0) {
          const next = scroller.scrollLeft + elapsed * MOBILE_SPEED_PX_PER_SECOND / 1000;
          // The three identical groups make this reset visually seamless.
          scroller.scrollLeft = next >= cycleWidth ? next % cycleWidth : next;
        }
      }
      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer?.disconnect();
    };
  }, [categories]);

  const pauseAfterGesture = () => {
    interactingRef.current = false;
    resumeAtRef.current = performance.now() + RESUME_AFTER_GESTURE_MS;
  };

  // The duplicated mobile groups extend past the viewport so visitors can
  // swipe freely while autoplay is paused and the track can loop cleanly.
  const approximateCycleWidth = categories.reduce(
    (total, category) => total + Math.max(125, category.length * 13 + 75),
    0,
  );
  const repetitions = categories.length
    ? Math.max(1, Math.ceil(2200 / approximateCycleWidth))
    : 0;
  const visibleItems = Array.from(
    { length: repetitions },
    (_, repeat) => categories.map((category) => ({ category, key: `${repeat}-${category}` })),
  ).flat();

  return (
    <section className={styles.section} aria-label="Shop by category">
      {categories.length ? (
        <>
          <div className={styles.window} aria-label="Browse categories">
            <div
              className={styles.track}
              style={{ "--marquee-duration": `${Math.max(30, visibleItems.length * 3.5)}s` } as CSSProperties}
            >
              {[0, 1].map((copy) => (
                <div
                  className={styles.group}
                  key={copy}
                  aria-hidden={copy === 1 ? true : undefined}
                >
                  {visibleItems.map(({ category, key }) => (
                    <Link
                      key={`${copy}-${key}`}
                      href={getCategoryShopHref(category)}
                      className={styles.category}
                      tabIndex={copy === 1 ? -1 : undefined}
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <nav
            ref={mobileScrollRef}
            className={styles.mobileScroll}
            aria-label="Product categories — automatically scrolls; swipe to browse"
            onTouchStart={() => { interactingRef.current = true; }}
            onTouchEnd={pauseAfterGesture}
            onTouchCancel={pauseAfterGesture}
            onPointerDown={() => { interactingRef.current = true; }}
            onPointerUp={pauseAfterGesture}
            onPointerCancel={pauseAfterGesture}
            onWheel={pauseAfterGesture}
            onKeyDown={pauseAfterGesture}
          >
            <div className={styles.mobileTrack}>
              {[0, 1, 2].map((copy) => (
                <div
                  key={copy}
                  ref={copy === 0 ? firstGroupRef : undefined}
                  className={styles.mobileGroup}
                  aria-hidden={copy > 0 ? true : undefined}
                >
                  {categories.map((category) => (
                    <Link
                      key={category}
                      href={getCategoryShopHref(category)}
                      className={styles.category}
                      tabIndex={copy > 0 ? -1 : undefined}
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </nav>
        </>
      ) : (
        <p className={styles.empty}>Categories will appear when added to the store.</p>
      )}
    </section>
  );
}
