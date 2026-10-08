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
