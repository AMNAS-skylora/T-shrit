"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HomeAboutSection.module.css";

export function AboutHangerImage() {
  const [failed, setFailed] = useState(false);
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;

    const mobile = window.matchMedia("(max-width: 800px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    // Follow page scrolling, without moving the surrounding About text or layout.
    // Use only transforms (no React state on scroll) to keep mobile scrolling smooth.
    const update = () => {
      frame = 0;
      if (reducedMotion.matches) {
        visual.style.setProperty("--about-scroll-y", "0px");
        return;
      }

      const bounds = visual.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      if (bounds.bottom < -100 || bounds.top > viewportHeight + 100) return;

      const distanceFromCenter =
        (bounds.top + bounds.height / 2 - viewportHeight / 2) /
        (viewportHeight / 2 + bounds.height / 2);
      const progress = Math.max(-1, Math.min(1, distanceFromCenter));
      const maxTravel = mobile.matches ? 18 : 44;
      visual.style.setProperty("--about-scroll-y", `${(progress * maxTravel).toFixed(1)}px`);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    mobile.addEventListener("change", schedule);
    reducedMotion.addEventListener("change", schedule);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mobile.removeEventListener("change", schedule);
      reducedMotion.removeEventListener("change", schedule);
      visual.style.removeProperty("--about-scroll-y");
    };
  }, []);

  if (failed) return null;

  return (
    <div ref={visualRef} className={styles.visual}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/about/tshirts-hanger.png"
        alt="T-shirts hanging from a clothing rail"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
