"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type ReturnOrigin = { slug: string; href: string };
type Pending = {
  destination: string;
  slug: string;
  image: HTMLImageElement;
  veil: HTMLDivElement;
  cleanup: () => void;
};

const STORAGE_KEY = "kleidin:product-origin";
const PRODUCT_PATH = /^\/products\/([^/]+)\/?$/;
const EASING = "cubic-bezier(.22, 1, .36, 1)";

function readOrigin(slug: string): ReturnOrigin | null {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const decoded: unknown = JSON.parse(value);
    if (!decoded || typeof decoded !== "object") return null;
    const data = decoded as { slug?: unknown; href?: unknown };
    if (data.slug !== slug || typeof data.href !== "string") return null;
    const url = new URL(data.href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/products/" + slug)) return null;
    return { slug, href: url.pathname + url.search + url.hash };
  } catch {
    return null;
  }
}

/** Reverse shared-image motion on a product Back link or Safari browser Back. */
export function ProductReturnTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const activeRef = useRef<Pending | null>(null);

  useEffect(() => {
    const match = pathname.match(PRODUCT_PATH);
    if (!match) return;
    const slug = decodeURIComponent(match[1]);

    const capture = (destination: string) => {
      activeRef.current?.cleanup();
      if (typeof document.createElement("div").animate !== "function") return;

      const source = document.querySelector<HTMLImageElement>("[data-product-image-target] img");
      if (!source?.complete || !source.naturalWidth) return;
      const rect = source.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const clone = document.createElement("img");
      clone.src = source.currentSrc || source.src;
      clone.alt = "";
      clone.setAttribute("aria-hidden", "true");
      const sourceStyles = window.getComputedStyle(source);
      Object.assign(clone.style, {
        position: "fixed",
        left: rect.left + "px",
        top: rect.top + "px",
        width: rect.width + "px",
        height: rect.height + "px",
        maxWidth: "none",
        boxSizing: "border-box",
        objectFit: sourceStyles.objectFit,
        objectPosition: sourceStyles.objectPosition,
        padding: sourceStyles.padding,
        margin: "0",
        borderRadius: sourceStyles.borderRadius,
        pointerEvents: "none",
        transformOrigin: "top left",
        zIndex: "10001",
        willChange: "transform, opacity",
      });
      const veil = document.createElement("div");
      veil.setAttribute("aria-hidden", "true");
      Object.assign(veil.style, {
        position: "fixed",
        inset: "0",
        background: "#fff",
        opacity: "0",
        zIndex: "10000",
        pointerEvents: "none",
      });
      document.body.append(veil, clone);

      let pending: Pending;
      const cleanup = () => {
        clone.remove();
        veil.remove();
        if (activeRef.current === pending) activeRef.current = null;
      };
      pending = { destination, slug, image: clone, veil, cleanup };
      activeRef.current = pending;

      // Never obstruct navigation if the originating product card is missing.
      window.setTimeout(cleanup, 2600);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey) return;
      const element = event.target;
      if (!(element instanceof Element)) return;
      const link = element.closest<HTMLAnchorElement>("a[data-product-return]");
      if (!link) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      const origin = readOrigin(slug);
      const destination = origin?.href ?? "/products";

      event.preventDefault();
      event.stopPropagation();
      capture(destination);
      router.push(destination, { scroll: true });
    };

    const onPopState = () => {
      // Safari's native back gesture completes before popstate. Capture while
      // the old product DOM is available; Next.js handles navigation itself.
      const origin = readOrigin(slug);
      if (origin) capture(origin.href);
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [pathname, router]);

  useEffect(() => {
    const pending = activeRef.current;
    if (!pending || pathname !== new URL(pending.destination, location.origin).pathname) return;

    let stopped = false;
    let target: HTMLImageElement | null = null;
    let oldOpacity = "";
    let frame = 0;
    let animation: Animation | null = null;

    const animateToOrigin = () => {
      if (stopped || activeRef.current !== pending) return;

      // We only animate into the matching item, never a different product.
      const matches = Array.from(document.querySelectorAll<HTMLAnchorElement>(
        'a[data-product-transition], a.product-card-image-link, a[href^="/products/"]',
      ));
      const selected = matches.find((link) => {
        const href = new URL(link.href, window.location.origin);
        if (href.pathname !== "/products/" + pending.slug) return false;
        const img = link.querySelector<HTMLImageElement>("img");
        if (!img?.complete || !img.naturalWidth) return false;
        const box = img.getBoundingClientRect();
        return box.width > 10 && box.height > 10 &&
          box.bottom > 0 && box.top < window.innerHeight &&
          box.right > 0 && box.left < window.innerWidth;
      });
      const image = selected?.querySelector<HTMLImageElement>("img");
      if (!image) return;

      stopped = true;
      observer.disconnect();
      target = image;
      oldOpacity = image.style.opacity;
      image.style.opacity = "0";

      frame = window.requestAnimationFrame(() => {
        if (activeRef.current !== pending || !image.isConnected) {
          image.style.opacity = oldOpacity;
          pending.cleanup();
          return;
        }

        const start = pending.image.getBoundingClientRect();
        const end = image.getBoundingClientRect();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!start.width || !start.height || !end.width || !end.height) {
          image.style.opacity = oldOpacity;
          pending.cleanup();
          return;
        }
        const frames = reduced
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [
              { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
              {
                transform: "translate3d(" + (end.left - start.left) + "px," +
                  (end.top - start.top) + "px,0) scale(" +
                  (end.width / start.width) + "," + (end.height / start.height) + ")",
                opacity: .24,
              },
            ];
        animation = pending.image.animate(frames, {
          duration: reduced ? 160 : window.innerWidth < 768 ? 620 : 730,
          easing: EASING,
          fill: "forwards",
        });
        const finish = () => {
          image.style.opacity = oldOpacity;
          pending.cleanup();
        };
        animation.finished.then(finish).catch(finish);
      });
    };

    const observer = new MutationObserver(animateToOrigin);
    observer.observe(document.body, { childList: true, subtree: true });
    // Allow scroll restoration and hydration to complete before measuring.
    const timer = window.setTimeout(animateToOrigin, 80);
    const fallback = window.setTimeout(() => {
      if (target) target.style.opacity = oldOpacity;
      pending.cleanup();
    }, 1700);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
      window.cancelAnimationFrame(frame);
      if (target) target.style.opacity = oldOpacity;
      animation?.cancel();
      pending.cleanup();
    };
  }, [pathname]);

  useEffect(() => () => activeRef.current?.cleanup(), []);
  return null;
}
