"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// One owner for public-page reveals, including content added after navigation.
export function HomeShoppingMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/try-on/")) return;
    const root = document.querySelector("main");
    if (!root) return;
    // Mobile Safari/Chrome: native, one-shot IntersectionObserver reveals avoid
    // repeated ScrollTrigger refreshes while browser chrome changes viewport size.
    // Content starts visible, so unsupported APIs never hide products or controls.
    if (window.matchMedia("(max-width: 767px)").matches) {
      if (!("IntersectionObserver" in window)) return;
      const seen = new WeakSet<HTMLElement>();
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          observer.unobserve(element);
          if (document.hidden || typeof element.animate !== "function") continue;
          element.animate(
            [
              { opacity: 0.55, transform: "translate3d(0,16px,0)" },
              { opacity: 1, transform: "translate3d(0,0,0)" },
            ],
            { duration: 520, easing: "cubic-bezier(.22,1,.36,1)" },
          );
        }
      }, { threshold: 0.04, rootMargin: "0px 0px -2% 0px" });
      let frame = 0;
      const discoverMobile = () => {
        frame = 0;
        if (!root.isConnected) return;
        root.querySelectorAll<HTMLElement>("[data-shop-reveal], h1, h2, article, .product-card, .home-spotlight-media").forEach((element) => {
          if (seen.has(element) || element.closest("[data-motion-owned]")) return;
          if (element.parentElement?.closest("[data-shop-reveal], article, .product-card")) return;
          seen.add(element);
          observer.observe(element);
        });
      };
      const queueScan = () => {
        if (!frame) frame = window.requestAnimationFrame(discoverMobile);
      };
      discoverMobile();
      const mutations = new MutationObserver(queueScan);
      mutations.observe(root, { childList: true, subtree: true });
      return () => {
        window.cancelAnimationFrame(frame);
        mutations.disconnect();
        observer.disconnect();
      };
    }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    let disposed = false;
    let refreshTimer = 0;
    const animations = new Map<HTMLElement, gsap.core.Tween>();
    const context = gsap.context(() => {}, root);
    const selector = "[data-shop-reveal], h1, h2, article, .product-card, .home-spotlight-media";

    const refresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        if (!disposed) ScrollTrigger.refresh();
      }, 150);
    };
    const discover = () => {
      for (const [element, tween] of animations) {
        if (!root.contains(element)) {
          tween.scrollTrigger?.kill();
          tween.revert();
          animations.delete(element);
        }
      }
      context.add(() => {
        root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
          if (animations.has(element)) return;
          if (element.closest("[data-motion-owned]")) return;
          // Don't layer transforms on an explicitly animated parent.
          if (element.parentElement?.closest("[data-shop-reveal], article, .product-card")) return;
          const tween = gsap.fromTo(element,
            { opacity: 0.35, y: 24 },
            {
              opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
              immediateRender: false,
              scrollTrigger: {
                trigger: element,
                start: "top 94%",
                toggleActions: "play none none reverse",
                invalidateOnRefresh: true,
              },
            });
          animations.set(element, tween);
        });
      });
      refresh();
    };
    discover();
    const observer = new MutationObserver(discover);
    observer.observe(root, { childList: true, subtree: true });
    const resizeObserver = new ResizeObserver(refresh);
    resizeObserver.observe(root);
    root.addEventListener("load", refresh, true);
    window.addEventListener("orientationchange", refresh);
    window.addEventListener("pageshow", refresh);
    document.fonts.ready.then(() => { if (!disposed) refresh(); });

    return () => {
      disposed = true;
      window.clearTimeout(refreshTimer);
      observer.disconnect();
      resizeObserver.disconnect();
      root.removeEventListener("load", refresh, true);
      window.removeEventListener("orientationchange", refresh);
      window.removeEventListener("pageshow", refresh);
      context.revert();
      animations.clear();
    };
  }, [pathname]);
  return null;
}
