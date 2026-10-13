"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getProductPrimaryImage } from "@/lib/product-images";
import type { Product } from "@/types/product";
import styles from "./StaticEditorialHero.module.css";

type HeroCard = {
  id: string;
  name: string;
  slug: string;
  image: string;
};

const ROTATION_INTERVAL = 3800;
const CARD_POSITIONS = [
  "front",
  "right",
  "back",
  "left",
] as const;

export function StaticEditorialHero({ products }: { products: Product[] }) {
  // Editorial layout and copy are intentionally independent of the removed
  // /admin/homepage editor. Only real, active catalog images appear here.
  const cards = useMemo<HeroCard[]>(() => {
    return products
      .filter((product) => product.status === "active")
      .map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.featuredImage || getProductPrimaryImage(product),
      }))
      .filter((product) => Boolean(product.image && product.slug))
      .slice(0, 4);
  }, [products]);

  const [frontIndex, setFrontIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduceMotion(motion.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);

    updateMotion();
    updateVisibility();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);

    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          ([entry]) => setInView(entry.isIntersecting),
          { threshold: 0.1 },
        );

    if (sectionRef.current) observer?.observe(sectionRef.current);

    return () => {
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (cards.length < 2 || hovered || focused || !inView || !pageVisible || reduceMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setFrontIndex((current) => (current + 1) % cards.length);
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(timer);
  }, [cards.length, hovered, focused, inView, pageVisible, reduceMotion]);

  useEffect(() => {
    const stage = visualRef.current;
    const section = sectionRef.current;
    if (!stage || !section) return;

    const desktop = window.matchMedia("(min-width: 900px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (!desktop.matches || motion.matches) {
        stage.style.setProperty("--hero-parallax", "0px");
        return;
      }

      const top = section.getBoundingClientRect().top;
      const shift = Math.max(-58, Math.min(58, -top * 0.12));
      stage.style.setProperty("--hero-parallax", `${shift.toFixed(1)}px`);
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    desktop.addEventListener("change", scheduleUpdate);
    motion.addEventListener("change", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      desktop.removeEventListener("change", scheduleUpdate);
      motion.removeEventListener("change", scheduleUpdate);
      stage.style.removeProperty("--hero-parallax");
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.hero}
      data-motion-owned
      aria-label="KLEID.IN editorial collection"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowLine} aria-hidden="true" />
            Everyday essentials / New perspective
          </span>
          <h1 className={styles.title}>KLEID<span>.IN</span></h1>
          <div className={styles.intro}>
            <p className={styles.description}>
              Made to be worn. Made to be lived in. Easy pieces,
              considered details, and a style that feels like you.
            </p>
            <Link href="/products" className={styles.cta}>
              Shop now
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className={styles.footer}>
            <span>Independent style. Every day.</span>
            <span>01 / KLEID.IN</span>
          </div>
        </div>

        <div ref={visualRef} className={styles.visual}>
          <div className={styles.visualCanvas}>
            <span className={styles.artLabel}>THE DAILY EDIT</span>
            <span className={styles.artNumber}>EST. / KLEID</span>
            {cards.length ? (
              <div className={styles.stack} aria-label="Featured products">
                {cards.map((card, index) => {
                  const position = CARD_POSITIONS[
                    (index - frontIndex + cards.length) % cards.length
                  ];
                  const front = position === "front";

                  return (
                    <Link
                      href={`/products/${card.slug}`}
                      key={card.id}
                      className={`${styles.card} ${styles[position]}`}
                      tabIndex={front ? 0 : -1}
                      aria-hidden={!front}
                      draggable={false}
                    >
                      <div className={styles.cardImage}>
                        <img
                          src={card.image}
                          alt={front ? card.name : ""}
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                          draggable={false}
                        />
                      </div>
                      <div className={styles.cardCaption}>
                        <span>{card.name}</span>
                        <span aria-hidden="true">↗</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyArtwork}>
                <img
                  src="/images/about/tshirts-hanger.png"
                  alt="T-shirts displayed on a clothing rail"
                  loading="eager"
                />
              </div>
            )}
            <span className={styles.artBottom}>GOOD CLOTHES. GOOD DAYS.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
