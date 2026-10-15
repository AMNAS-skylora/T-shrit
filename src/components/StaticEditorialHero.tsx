"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./StaticEditorialHero.module.css";
import { ArrowUpRightIcon } from "@/components/UiIcons";

// Pause between clear horizontal card slides; keep each step visible.
const ROTATION_INTERVAL = 4600;
const CARD_POSITIONS = ["front", "right", "left"] as const;

export function StaticEditorialHero({ photos }: { photos: string[] }) {
  const uploadedPhotos = photos.filter(Boolean).slice(0, 3);
  const [frontIndex, setFrontIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  // A manual photo choice should not permanently disable the slideshow.
  const resumeAfterInteraction = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    // Safari can restore a page from its back/forward cache.
    window.addEventListener("pageshow", updateVisibility);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      window.removeEventListener("pageshow", updateVisibility);
    };
  }, []);

  useEffect(() => {
    // Image rotation is separate from visual motion. Photos continue changing
    // when iOS Reduce Motion is enabled; CSS disables movement in that mode.
    if (uploadedPhotos.length < 2 || !pageVisible || paused) return;

    const timer = window.setInterval(() => {
      if (Date.now() < resumeAfterInteraction.current) return;
      setFrontIndex((current) => (current + 1) % uploadedPhotos.length);
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(timer);
  }, [uploadedPhotos.length, pageVisible, paused]);

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
                        // Allow the selected photo to remain visible before resuming.
                        resumeAfterInteraction.current = Date.now() + ROTATION_INTERVAL;
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
            {uploadedPhotos.length > 1 ? (
              <button
                type="button"
                className={styles.rotationControl}
                aria-label={paused ? "Play homepage photo slideshow" : "Pause homepage photo slideshow"}
                aria-pressed={paused}
                onClick={() => {
                  resumeAfterInteraction.current = 0;
                  setPaused((current) => !current);
                }}
              >
                {paused ? "Play photos" : "Pause photos"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
