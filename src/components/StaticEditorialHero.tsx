"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./StaticEditorialHero.module.css";
import { ArrowUpRightIcon } from "@/components/UiIcons";

type EditorialPhoto = {
  id: string;
  src: string;
  alt: string;
};

// Fashion editorial photography, not product imagery or celebrity endorsements.
// Photos: Joon Tae Kim, 거열 박 and CUONG QUANG on Pexels.
// The card photos are intentionally independent of shop inventory.
// For an exclusive KLEID.IN campaign, replace with commissioned/model-released shots.
const EDITORIAL_PHOTOS: readonly EditorialPhoto[] = [
  {
    id: "seoul-studio",
    src: "https://images.pexels.com/photos/8460301/pexels-photo-8460301.jpeg?auto=compress&cs=tinysrgb&w=950",
    alt: "Korean-style men's casual fashion studio editorial",
  },
  {
    id: "seoul-street",
    src: "https://images.pexels.com/photos/34586553/pexels-photo-34586553.jpeg?auto=compress&cs=tinysrgb&w=950",
    alt: "Seoul street-style editorial in a contemporary white outfit",
  },
  {
    id: "seoul-blue",
    src: "https://images.pexels.com/photos/8460709/pexels-photo-8460709.jpeg?auto=compress&cs=tinysrgb&w=950",
    alt: "Minimal Seoul streetwear fashion portrait in blue",
  },
  {
    id: "seoul-neutral",
    src: "https://images.pexels.com/photos/20478046/pexels-photo-20478046.jpeg?auto=compress&cs=tinysrgb&w=950",
    alt: "Contemporary Korean-inspired street fashion portrait in a neutral coat",
  },
];

const ROTATION_INTERVAL = 3800;
const CARD_POSITIONS = ["front", "right", "back", "left"] as const;

export function StaticEditorialHero() {
  const [frontIndex, setFrontIndex] = useState(0);
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
    if (
      EDITORIAL_PHOTOS.length < 2 ||
      !inView ||
      !pageVisible ||
      reduceMotion
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setFrontIndex((current) => (current + 1) % EDITORIAL_PHOTOS.length);
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(timer);
  }, [inView, pageVisible, reduceMotion]);

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
      aria-label="KLEID.IN fashion editorial"
    >
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h1 className={styles.title}>KLEID<span>.IN</span></h1>
          <div className={styles.intro}>
            <p className={styles.description}>
              Made to be worn. Made to be lived in. Easy pieces,
              considered details, and a style that feels like you.
            </p>
            <Link href="/products" className={styles.cta}>
              Shop now
              <ArrowUpRightIcon width={18} height={18} />
            </Link>
          </div>
        </div>

        <div ref={visualRef} className={styles.visual}>
          <div className={styles.visualCanvas}>
            <div className={styles.stack} aria-label="Fashion inspiration gallery">
              {EDITORIAL_PHOTOS.map((photo, index) => {
                const position = CARD_POSITIONS[
                  (index - frontIndex + EDITORIAL_PHOTOS.length) % EDITORIAL_PHOTOS.length
                ];
                const front = position === "front";

                return (
                  <figure
                    key={photo.id}
                    className={`${styles.card} ${styles[position]}`}
                    aria-hidden={!front}
                  >
                    <img
                      src={photo.src}
                      alt={front ? photo.alt : ""}
                      loading="eager"
                      decoding="async"
                      fetchPriority={index === 0 ? "high" : "auto"}
                      draggable={false}
                    />
                  </figure>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
