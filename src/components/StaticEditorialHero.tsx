"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./StaticEditorialHero.module.css";
import { ArrowUpRightIcon } from "@/components/UiIcons";

const ROTATION_INTERVAL = 3800;
const CARD_POSITIONS = ["front", "right", "left"] as const;

export function StaticEditorialHero({ photos }: { photos: string[] }) {
  const uploadedPhotos = photos.filter(Boolean).slice(0, 3);
  const [manualSelection, setManualSelection] = useState(false);
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
      uploadedPhotos.length < 2 ||
      !inView ||
      !pageVisible ||
      reduceMotion ||
      manualSelection
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setFrontIndex((current) => (current + 1) % uploadedPhotos.length);
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(timer);
  }, [inView, pageVisible, reduceMotion, uploadedPhotos.length, manualSelection]);

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
            {uploadedPhotos.length ? (
              <div className={styles.stack} role="group" aria-label="Homepage campaign photos">
                {uploadedPhotos.map((src, index) => {
                  const position = CARD_POSITIONS[
                    (index - (frontIndex % uploadedPhotos.length) + uploadedPhotos.length) % uploadedPhotos.length
                  ];
                  const front = position === "front";
                  return (
                    <button
                      type="button"
                      key={src + index}
                      className={`${styles.card} ${styles[position]}`}
                      aria-label={`Show campaign photo ${index + 1} as main image`}
                      aria-pressed={front}
                      onClick={() => {
                        setFrontIndex(index);
                        setManualSelection(true);
                      }}
                    >
                      <img
                        src={src}
                        alt=""
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={index === 0 ? "high" : "auto"}
                        draggable={false}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyVisual} aria-label="KLEID.IN collection">
                <span>KLEID.IN</span>
                <p>Our next collection is taking shape.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
