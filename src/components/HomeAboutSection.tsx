"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { AboutHangerImage } from "@/components/AboutHangerImage";
import { homeAbout } from "@/data/home-about";
import styles from "./HomeAboutSection.module.css";
import { ArrowUpRightIcon } from "@/components/UiIcons";

export function HomeAboutSection() {
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const copy = copyRef.current;
    if (!copy || typeof IntersectionObserver === "undefined") return;

    // Reduced Motion still gets a short opacity-only entrance. Without
    // JavaScript, no reveal data attribute is added and text remains visible.

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          copy.dataset.reveal = "shown";
          observer.disconnect(); // One-time entrance, no repeated flickering.
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -12% 0px" },
    );

    copy.dataset.reveal = "waiting";
    observer.observe(copy);

    return () => {
      observer.disconnect();
      delete copy.dataset.reveal;
    };
  }, []);

  return (
    <section id="about" aria-labelledby="home-about-title" className={styles.section}>
      <div className={styles.layout}>
        <AboutHangerImage />
        <div ref={copyRef} className={styles.copy}>
          <p className={`${styles.eyebrow} ${styles.reveal}`}>{homeAbout.eyebrow}</p>
          <h2 id="home-about-title" className={`${styles.title} ${styles.reveal}`}>
            {homeAbout.title}
          </h2>
          <p className={`${styles.body} ${styles.reveal}`}>{homeAbout.body}</p>
          <ul className={styles.points}>
            {homeAbout.points.map((point, index) => (
              <li
                key={point.title}
                className={styles.reveal}
                style={{ "--reveal-delay": `${430 + index * 105}ms` } as CSSProperties}
              >
                <span className={styles.pointIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{point.title}</span>
              </li>
            ))}
          </ul>
          <Link href="/products" className={`${styles.link} ${styles.reveal}`}>
            Explore our T-shirts
            <ArrowUpRightIcon width={18} height={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
