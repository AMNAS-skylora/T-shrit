"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type ActiveTransition = {
  pathname: string;
  clone: HTMLImageElement;
  timer: number;
  cleanup: () => void;
};

const DESTINATION = "[data-product-image-target] img";
const EASE = "cubic-bezier(.22, 1, .36, 1)";
const REDUCE_MOTION = "(prefers-reduced-motion: reduce)";

function isProductDetail(path: string) {
  return path.split("/").filter(Boolean).length === 2 && path.startsWith("/products/");
}

/** Keep all product links navigable, even when animation/image loading fails.
 * The optional image clone starts where the clicked image already is and
 * flies directly to the new page's gallery (no white overlay or pre-route
 * delay). iOS Reduce Motion gets a short opacity-only entrance.
 */
export function ProductImageTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const activeRef = useRef<ActiveTransition | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[data-product-transition], a[href^="/products/"]');
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !isProductDetail(url.pathname) ||
          url.pathname === pathname) return;

      // Remember the real originating page for browser-back transitions.
      try {
        window.sessionStorage.setItem("kleidin:product-origin", JSON.stringify({
          slug: decodeURIComponent(url.pathname.split("/")[2]),
          href: location.pathname + location.search + location.hash,
        }));
      } catch { /* session storage can be disabled in private browsing */ }

      // A CTA in the featured section is separate from the image link.
      // For that CTA, reuse the matching visible, actually loaded photo.
      let source = link.querySelector<HTMLImageElement>("img") ??
        link.closest("article")?.querySelector<HTMLImageElement>("img") ?? null;
      if (!source) {
        const media = link.closest("#featured-products")
          ?.querySelector<HTMLAnchorElement>("[data-featured-product-media]");
        if (media?.pathname === url.pathname) source = media.querySelector("img");
      }

      activeRef.current?.cleanup();
      const reduced = window.matchMedia(REDUCE_MOTION).matches;
      const imageRect = source?.getBoundingClientRect();
      const canAnimate = !reduced && source?.complete && source.naturalWidth > 0 &&
        imageRect && imageRect.width > 10 && imageRect.height > 10 &&
        imageRect.bottom > 0 && imageRect.top < innerHeight &&
        imageRect.right > 0 && imageRect.left < innerWidth &&
        typeof source.animate === "function";

      if (canAnimate && source && imageRect) {
        const computed = getComputedStyle(source);
        const clone = document.createElement("img");
        clone.src = source.currentSrc || source.src;
        clone.alt = "";
        clone.setAttribute("aria-hidden", "true");
        Object.assign(clone.style, {
          position: "fixed",
          left: imageRect.left + "px",
          top: imageRect.top + "px",
          width: imageRect.width + "px",
          height: imageRect.height + "px",
          maxWidth: "none",
          margin: "0",
          padding: computed.padding,
          boxSizing: "border-box",
          objectFit: computed.objectFit,
          objectPosition: computed.objectPosition,
          borderRadius: computed.borderRadius,
          pointerEvents: "none",
          transformOrigin: "top left",
          zIndex: "10001",
          willChange: "transform, opacity",
        });
        document.body.appendChild(clone);
        let active: ActiveTransition;
        const cleanup = () => {
          clone.remove();
          if (activeRef.current === active) {
            clearTimeout(active.timer);
            activeRef.current = null;
          }
        };
        active = {
          pathname: url.pathname,
          clone,
          timer: window.setTimeout(cleanup, 1800),
          cleanup,
        };
        activeRef.current = active;
      } else if (typeof link.animate === "function") {
        // Feedback is visible, but navigation is NEVER delayed for this effect.
        link.animate([{ opacity: 1 }, { opacity: .85 }, { opacity: 1 }], {
          duration: reduced ? 120 : 170,
          easing: "ease-out",
        });
      }

      event.preventDefault();
      event.stopPropagation();
      // Start routing on this same tap, not after an outgoing animation.
      router.push(url.pathname + url.search + url.hash, { scroll: true });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, router]);

  useEffect(() => {
    const active = activeRef.current;
    if (!active) {
      if (isProductDetail(pathname)) {
        // Direct / button navigation when the source image was not in view.
        const section = document.querySelector<HTMLElement>("[data-product-image-target]")?.closest("section");
        if (section && typeof section.animate === "function") {
          const reduced = window.matchMedia(REDUCE_MOTION).matches;
          section.animate(
            [{ opacity: reduced ? .94 : .88 }, { opacity: 1 }],
            { duration: reduced ? 130 : 250, easing: EASE },
          );
        }
      }
      return;
    }
    if (pathname !== active.pathname) {
      active.cleanup();
      return;
    }

    let disposed = false;
    let animation: Animation | null = null;
    let frame = 0;
    const initial = performance.now();

    const tryToLand = () => {
      if (disposed || activeRef.current !== active || animation) return;
      const target = document.querySelector<HTMLImageElement>(DESTINATION);
      const box = target?.getBoundingClientRect();
      if (!target?.isConnected || !box || box.width < 10 || box.height < 10) return;

      // The photo must be decoded before the clone fades out. Slow 4G gets
      // a bounded fallback so neither the image nor the route gets stuck.
      if ((!target.complete || !target.naturalWidth) &&
          performance.now() - initial < 850) return;

      const from = active.clone.getBoundingClientRect();
      const reduced = window.matchMedia(REDUCE_MOTION).matches;
      if (typeof active.clone.animate !== "function" || !from.width || !from.height) {
        active.cleanup();
        return;
      }
      animation = active.clone.animate(
        reduced || !target.complete || !target.naturalWidth
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [
              { opacity: 1, transform: "translate3d(0,0,0) scale(1)" },
              {
                opacity: .05,
                transform: `translate3d(${box.left - from.left}px,${box.top - from.top}px,0) scale(${box.width / from.width},${box.height / from.height})`,
              },
            ],
        { duration: reduced ? 130 : 530, easing: EASE, fill: "forwards" },
      );
      animation.finished.then(active.cleanup).catch(active.cleanup);
    };

    const observer = new MutationObserver(tryToLand);
    observer.observe(document.body, { childList: true, subtree: true });
    const check = () => {
      tryToLand();
      if (!disposed && activeRef.current === active && !animation) {
        frame = requestAnimationFrame(check);
      }
    };
    frame = requestAnimationFrame(check);

    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      animation?.cancel();
      if (activeRef.current === active) active.cleanup();
    };
  }, [pathname]);

  useEffect(() => () => activeRef.current?.cleanup(), []);
  return null;
}
