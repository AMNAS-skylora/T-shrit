"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR = 'h1, h2, h3, p, article, [data-scroll-reveal], .footer-intro, .footer-column, .footer-bottom';
const SKIP = '[data-motion-owned], #about, [data-scroll-reveal-ignore], [role="dialog"], dialog, [aria-live], [role="status"], nav, form';

/**
 * Scroll animation is progressive enhancement. Content is never hidden until
 * this component explicitly marks a BELOW-THE-FOLD element "waiting".
 * Scroll observers and injected markup are reset on each storefront route.
 */
export function HomeShoppingMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const main = document.querySelector<HTMLElement>("main");
    const footer = document.querySelector<HTMLElement>("footer.site-footer");
    if (!main || typeof IntersectionObserver === "undefined") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const roots = [main, footer].filter((x): x is HTMLElement => x instanceof HTMLElement);
    const observed = new Set<HTMLElement>();
    const known = new WeakSet<HTMLElement>();
    let scanFrame = 0;
    let disposed = false;

    function visibleInViewport(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      return rect.top < window.innerHeight - 25 && rect.bottom > 0;
    }

    const reveal = (element: HTMLElement) => {
      observer.unobserve(element);
      observed.delete(element);
      if (!element.isConnected) return;
      // The class is applied after the initial offscreen style is painted.
      // The browser can now interpolate from hidden to shown reliably.
      element.dataset.kleidReveal = "shown";
      element.addEventListener("transitionend", () => {
        // Keep the final visible state, but remove animation-only properties.
        if (element.dataset.kleidReveal === "shown") delete element.dataset.kleidReveal;
      }, { once: true });
    };

    const observer = new IntersectionObserver((entries) => {
      if (disposed) return;
      for (const entry of entries) {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      }
    }, { threshold: 0.01, rootMargin: "0px 0px -5% 0px" });

    const eligible = (element: HTMLElement) => {
      if (known.has(element) || element.closest(SKIP)) return false;
      if (element.getAttribute("aria-hidden") === "true") return false;
      if (element.matches("p") && element.closest("button, a")) return false;
      if (element.closest("article") && !element.matches("article")) return false;
      if (element.closest("[data-scroll-reveal]") && !element.hasAttribute("data-scroll-reveal")) return false;
      if (element.offsetWidth === 0 || element.offsetHeight === 0) return false;
      return true;
    };

    const scan = () => {
      scanFrame = 0;
      if (disposed) return;
      for (const root of roots) {
        if (!root.isConnected) continue;
        root.querySelectorAll<HTMLElement>(SELECTOR).forEach((element) => {
          if (!eligible(element)) return;
          known.add(element);
          // Do not fade text that's already on screen at initial hydration.
          if (visibleInViewport(element)) return;
          element.dataset.kleidReveal = "waiting";
          observed.add(element);
          observer.observe(element);
        });
      }
    };

    const queueScan = () => {
      if (!scanFrame && !disposed) scanFrame = window.requestAnimationFrame(scan);
    };

    const mutationObserver = new MutationObserver(queueScan);
    roots.forEach((root) => mutationObserver.observe(root, { childList: true, subtree: true }));
    // Switching iOS Reduce Motion while scrolling changes only the effect,
    // not whether upcoming elements become visible.
    const syncMotion = () => {
      observed.forEach((element) => {
        if (element.isConnected && visibleInViewport(element)) reveal(element);
      });
    };
    reduceMotion.addEventListener("change", syncMotion);
    queueScan();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(scanFrame);
      mutationObserver.disconnect();
      observer.disconnect();
      reduceMotion.removeEventListener("change", syncMotion);
      observed.forEach((element) => {
        if (element.dataset.kleidReveal === "waiting") delete element.dataset.kleidReveal;
      });
      observed.clear();
    };
  }, [pathname]);

  return (
    <style jsx global>{`
      [data-kleid-reveal="waiting"] {
        opacity: 0;
        transform: translate3d(0, 22px, 0);
        transition: none;
      }
      [data-kleid-reveal="shown"] {
        opacity: 1;
        transform: translate3d(0, 0, 0);
        transition:
          opacity 650ms cubic-bezier(.22, 1, .36, 1),
          transform 750ms cubic-bezier(.22, 1, .36, 1);
      }
      @media (max-width: 767px) {
        [data-kleid-reveal="waiting"] { transform: translate3d(0, 16px, 0); }
      }
      @media (prefers-reduced-motion: reduce) {
        [data-kleid-reveal="waiting"] {
          opacity: .88;
          transform: none;
        }
        [data-kleid-reveal="shown"] {
          opacity: 1;
          transform: none;
          transition: opacity 160ms ease-out;
        }
      }
    `}</style>
  );
}
