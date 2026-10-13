"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HomeAboutSection.module.css";

export function AboutHangerImage() {
  const [failed, setFailed] = useState(false);
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    // The rail and hanging shirts ENTER FROM OUTSIDE THE LEFT EDGE.
    // As the About image scrolls into view, scrub the image horizontally into
    // its final position. The About heading and other content never move.
    const update = () => {
      frame = 0;

      if (reducedMotion.matches) {
        visual.style.setProperty("--hanger-enter-x", "0px");
        return;
      }

      const bounds = visual.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const start = viewportHeight * 0.97;
      const finish = viewportHeight * 0.24;
      const progress = Math.max(0, Math.min(1, (start - bounds.top) / (start - finish)));
      const eased = 1 - Math.pow(1 - progress, 3);
      const outsideDistance = bounds.width + Math.min(viewportHeight * 0.08, 64);
      const offset = -outsideDistance * (1 - eased);
      visual.style.setProperty("--hanger-enter-x", `${offset.toFixed(1)}px`);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
      visual.style.removeProperty("--hanger-enter-x");
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
