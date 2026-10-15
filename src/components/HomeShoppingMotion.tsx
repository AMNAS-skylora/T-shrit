"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TEXT_TARGETS = "h1, h2, h3, p, article, [data-scroll-reveal]";
const SKIP_REGIONS =
  '[data-motion-owned], #about, [data-scroll-reveal-ignore], [role="dialog"], dialog, [aria-live], [role="status"], nav, form';

/**
 * One scroll-reveal owner for all public storefront pages.
 *
 * No global opacity CSS: content is always readable with JavaScript disabled,
 * slow hydration, Reduce Motion enabled, or an unsupported browser.
 * Individual About-section choreography remains owned by HomeAboutSection.
 */
export function HomeShoppingMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const root = document.querySelector<HTMLElement>("main");
    const footer = document.querySelector<HTMLElement>("footer.site-footer");
    if (!root || typeof IntersectionObserver === "undefined") return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<HTMLElement>();
    const animations = new Set<Animation>();
    const roots = [root, footer].filter((value): value is HTMLElement => Boolean(value));
    const observed = new Set<HTMLElement>();
    let scheduledScan = 0;
    let disposed = false;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          revealObserver.unobserve(element);
          observed.delete(element);

          if (disposed || motion.matches || !element.isConnected || typeof element.animate !== "function") {
            continue;
          }
          // Existing complex motion components control their own transforms.
          if (element.closest(SKIP_REGIONS)) continue;

          const isCard = element.matches("article, [data-scroll-reveal='card']");
          const shiftY = isCard ? 22 : 16;
          const duration = isCard ? 720 : 620;
          const delay = Number(element.dataset.revealDelay ?? "0");
          const animation = element.animate(
            [
              { opacity: 0.2, transform: `translate3d(0,${shiftY}px,0)` },
              { opacity: 1, transform: "translate3d(0,0,0)" },
            ],
            {
              duration,
              delay: Number.isFinite(delay) ? Math.min(260, Math.max(0, delay)) : 0,
              easing: "cubic-bezier(.22,1,.36,1)",
              fill: "none",
            },
          );
          animations.add(animation);
          animation.finished
            .catch(() => undefined)
            .finally(() => animations.delete(animation));
        }
      },
      { threshold: 0.02, rootMargin: "0px 0px -6% 0px" },
    );

    const eligible = (element: HTMLElement) => {
      if (seen.has(element) || element.closest(SKIP_REGIONS)) return false;
      if (element.closest("[data-scroll-reveal]") && !element.hasAttribute("data-scroll-reveal")) return false;
      // Animate product cards as one piece, never animate each child separately.
      const parentCard = element.closest("article");
      if (parentCard && parentCard !== element) return false;
      // Avoid fading nested paragraphs inside the same named content block.
      if (element.matches("p") && element.closest("button, a, [data-product-transition]")) return false;
      if (element.getAttribute("aria-hidden") === "true") return false;
      return true;
    };

    const discover = () => {
      scheduledScan = 0;
      if (disposed || motion.matches) return;
      for (const container of roots) {
        if (!container.isConnected) continue;
        container.querySelectorAll<HTMLElement>(TEXT_TARGETS).forEach((element) => {
          if (!eligible(element)) return;
          seen.add(element);
          observed.add(element);
          revealObserver.observe(element);
        });
      }
    };

    const schedule = () => {
      if (!scheduledScan && !disposed) scheduledScan = window.requestAnimationFrame(discover);
    };

    const mutations = new MutationObserver(schedule);
    roots.forEach((container) => mutations.observe(container, { childList: true, subtree: true }));
    const onMotionChange = () => {
      if (motion.matches) {
        revealObserver.disconnect();
        observed.clear();
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      } else schedule();
    };
    motion.addEventListener("change", onMotionChange);
    schedule();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(scheduledScan);
      mutations.disconnect();
      revealObserver.disconnect();
      motion.removeEventListener("change", onMotionChange);
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      observed.clear();
    };
  }, [pathname]);

  return null;
}
