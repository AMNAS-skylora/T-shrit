"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type ActiveTransition = {
  href: string;
  pathname: string;
  image: HTMLImageElement;
  veil: HTMLDivElement;
  timer: number;
  cleanup: () => void;
};

const TARGET = "[data-product-image-target] img";
const EASE = "cubic-bezier(.22, 1, .36, 1)";

/**
 * Shared-element transition for storefront product links.
 *
 * Full motion: a clone stays at its ORIGINAL card location until the detail
 * image mounts, then travels DIRECTLY to that image's rect. There is no
 * intermediate move-to-the-center and no separate shrinking phase.
 *
 * Reduced motion: short, opacity-only feedback followed by regular routing.
 * Both modes work on touch and desktop. Missing images/API support use Next
 * Link's native navigation rather than trapping a visitor on the listing.
 */
export function ProductImageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef<ActiveTransition | null>(null);
  const reducedTimers = useRef(new Set<number>());

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest<HTMLAnchorElement>(
        'a[data-product-transition], a[href^="/products/"]',
      );
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        !url.pathname.startsWith("/products/") ||
        url.pathname === pathname
      ) return;

      // Remember the exact storefront page for app-style reverse navigation.
      try {
        window.sessionStorage.setItem("kleidin:product-origin", JSON.stringify({
          slug: decodeURIComponent(url.pathname.slice("/products/".length)),
          href: window.location.pathname + window.location.search + window.location.hash,
        }));
      } catch { /* Private browsing can disable storage; links still work. */ }

      if (typeof link.animate !== "function") return;
      const image = link.querySelector<HTMLImageElement>("img") ??
        link.closest("article")?.querySelector<HTMLImageElement>("img");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // No flying picture when an image is missing, not decoded, or Reduce
      // Motion is on. A short pressed-state fade makes the navigation clear.
      if (reduced || !image?.complete || !image.naturalWidth) {
        event.preventDefault();
        event.stopPropagation();
        pending.current?.cleanup();
        const duration = reduced ? 130 : 180;
        (link.closest("article") ?? link).animate(
          [{ opacity: 1 }, { opacity: .78 }, { opacity: 1 }],
          { duration, easing: "ease-out" },
        );
        const timer = window.setTimeout(() => {
          reducedTimers.current.delete(timer);
          router.push(url.pathname + url.search + url.hash, { scroll: true });
        }, duration);
        reducedTimers.current.add(timer);
        return;
      }

      const rect = image.getBoundingClientRect();
      if (!rect.width || !rect.height) return; // normal link as fallback

      event.preventDefault();
      event.stopPropagation();
      pending.current?.cleanup();

      const computed = window.getComputedStyle(image);
      const copy = document.createElement("img");
      copy.src = image.currentSrc || image.src;
      copy.alt = "";
      copy.setAttribute("aria-hidden", "true");
      Object.assign(copy.style, {
        position: "fixed",
        left: rect.left + "px",
        top: rect.top + "px",
        width: rect.width + "px",
        height: rect.height + "px",
        maxWidth: "none",
        boxSizing: "border-box",
        objectFit: computed.objectFit,
        objectPosition: computed.objectPosition,
        padding: computed.padding,
        margin: "0",
        borderRadius: computed.borderRadius,
        pointerEvents: "none",
        transformOrigin: "top left",
        zIndex: "10001",
        willChange: "transform, opacity",
        boxShadow: "0 20px 46px rgba(0,0,0,.12)",
      });

      const veil = document.createElement("div");
      veil.setAttribute("aria-hidden", "true");
      Object.assign(veil.style, {
        position: "fixed",
        inset: "0",
        background: "#fafafa",
        opacity: "0",
        pointerEvents: "none",
        zIndex: "10000",
      });
      document.body.append(veil, copy);


      let active: ActiveTransition;
      const cleanup = () => {
        copy.remove();
        veil.remove();
        // An old fallback must not clear the next navigation's overlay.
        if (pending.current === active) {

          window.clearTimeout(active.timer);
          pending.current = null;
        }
      };
      active = {
        href: url.pathname + url.search,
        pathname: url.pathname,
        image: copy,
        veil,
        timer: window.setTimeout(cleanup, 4800),
        cleanup,
      };
      pending.current = active;

      // The destination image stays visible throughout the transition.
      // Never hide it while waiting for iOS Safari image decoding or routing.
      veil.animate([{ opacity: 0 }, { opacity: .14 }], {
        duration: 180,
        easing: EASE,
        fill: "forwards",
      });

      router.prefetch(url.pathname + url.search);
      router.push(url.pathname + url.search + url.hash, { scroll: true });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router, pathname]);

  useEffect(() => {
    const active = pending.current;
    if (!active) {
      // Reliable mobile fallback when the listing image hasn't decoded yet:
      // still animate the arriving product page instead of doing a hard cut.
      if (/^\\/products\\/[^/]+\\/?$/.test(pathname)) {
        const main = document.querySelector("main");
        if (main && typeof main.animate === "function") {
          const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          main.animate(
            reduced
              ? [{ opacity: .82 }, { opacity: 1 }]
              : [{ opacity: .74, transform: "translate3d(0,12px,0)" },
                 { opacity: 1, transform: "translate3d(0,0,0)" }],
            { duration: reduced ? 170 : 430, easing: EASE },
          );
        }
      }
      return;
    }
    if (pathname !== active.pathname) {
      active.cleanup();
      return;
    }

    let raf = 0;
    let settled = false;
    let movement: Animation | null = null;
    let fade: Animation | null = null;
    let waitingForImage: HTMLImageElement | null = null;

    const findDestination = () => {
      if (settled || pending.current !== active) return;
      const destination = document.querySelector<HTMLImageElement>(TARGET);
      if (!destination) return;
      // Wait for Next Image's real pixels so the transition never ends on a
      // blank hero when the visitor has a slower mobile connection.
      if (!destination.complete || !destination.naturalWidth) {
        if (waitingForImage !== destination) {
          waitingForImage?.removeEventListener("load", findDestination);
          waitingForImage = destination;
          destination.addEventListener("load", findDestination, { once: true });
        }
        return;
      }
      const rectangle = destination.getBoundingClientRect();
      if (!rectangle.width || !rectangle.height) return;

      settled = true;
      observer.disconnect();
      // Two frames allow mobile Safari/Next.js to settle scroll and layout
      // before measuring the image's final on-screen position.
      raf = window.requestAnimationFrame(() => {
        raf = window.requestAnimationFrame(() => {
          if (pending.current !== active || !destination.isConnected) {
            active.cleanup();
            return;
          }
          const end = destination.getBoundingClientRect();
          const from = active.image.getBoundingClientRect();
          if (!end.width || !end.height || !from.width || !from.height) {
            active.cleanup();
            return;
          }

          const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const duration = reduced ? 160 : window.innerWidth < 768 ? 680 : 760;
          if (reduced) {
            // If the setting changes mid-navigation, avoid a large flight.
            fade = active.image.animate(
              [{ opacity: 1 }, { opacity: 0 }],
              { duration, easing: "ease-out", fill: "forwards" },
            );
          } else {
            const dx = end.left - from.left;
            const dy = end.top - from.top;
            const sx = end.width / from.width;
            const sy = end.height / from.height;
            movement = active.image.animate(
              [
                { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
                { transform: `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`, opacity: 0 },
              ],
              { duration, easing: EASE, fill: "forwards" },
            );
          }

          active.veil.animate(
            [{ opacity: .14 }, { opacity: 0 }],
            { duration, easing: "ease-out", fill: "forwards" },
          );
          // The outgoing clone fades as it reaches the destination; the
          // destination image is already ready to display after cleanup.
          const promise = (movement ?? fade)?.finished;
          promise?.then(active.cleanup).catch(active.cleanup);
        });
      });
    };

    const observer = new MutationObserver(findDestination);
    observer.observe(document.body, { childList: true, subtree: true });
    findDestination();

    // Route content may be missing (network issue, not-found page, lazy load).
    // Never leave the destination image hidden or an overlay stranded.
    const fallback = window.setTimeout(active.cleanup, 2100);

    return () => {
      observer.disconnect();
      waitingForImage?.removeEventListener("load", findDestination);
      window.cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
      movement?.cancel();
      fade?.cancel();
    };
  }, [pathname]);

  useEffect(() => () => {
    pending.current?.cleanup();
    reducedTimers.current.forEach((timer) => window.clearTimeout(timer));
    reducedTimers.current.clear();
  }, []);

  return null;
}
