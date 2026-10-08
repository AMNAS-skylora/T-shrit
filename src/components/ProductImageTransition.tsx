"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type Pending = {
  image: HTMLImageElement;
  backdrop: HTMLDivElement;
  href: string;
  timer: number;
  cleanup: () => void;
};

function getCenteredRect(sourceRect: DOMRect) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const aspect = sourceRect.width / Math.max(sourceRect.height, 1);

  const maxWidth = viewportWidth < 768
    ? Math.min(viewportWidth * 0.34, 150)
    : Math.min(viewportWidth * 0.22, 220);
  const maxHeight = viewportWidth < 768
    ? Math.min(viewportHeight * 0.30, 220)
    : Math.min(viewportHeight * 0.34, 300);

  let width = Math.min(sourceRect.width * 0.58, maxWidth);
  let height = width / aspect;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }

  width = Math.max(width, 72);
  height = Math.max(height, 88);

  return {
    left: (viewportWidth - width) / 2,
    top: (viewportHeight - height) / 2,
    width,
    height,
  };
}

export function ProductImageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef<Pending | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = (event.target as Element)?.closest<HTMLAnchorElement>(
        'a[data-product-transition], a[href^="/products/"]',
      );

      if (!link || link.target === "_blank" || link.hasAttribute("download")) {
        return;
      }

      const url = new URL(link.href, location.href);
      if (
        url.origin !== location.origin ||
        !url.pathname.startsWith("/products/") ||
        url.pathname === pathname
      ) {
        return;
      }

      const source =
        link.querySelector<HTMLImageElement>("img") ||
        link.closest("article")?.querySelector<HTMLImageElement>("img");

      if (
        !source?.complete ||
        !source.naturalWidth
      ) {
        return;
      }

      const sourceRect = source.getBoundingClientRect();
      if (!sourceRect.width || !sourceRect.height) return;

      event.preventDefault();
      event.stopPropagation();
      pending.current?.cleanup();

      document.documentElement.dataset.productTransitionActive = "true";

      const backdrop = document.createElement("div");
      backdrop.setAttribute("aria-hidden", "true");
      Object.assign(backdrop.style, {
        position: "fixed",
        inset: "0",
        background: "#fafafa",
        opacity: "0",
        zIndex: "9998",
        pointerEvents: "none",
        willChange: "opacity",
      });

      const image = document.createElement("img");
      image.src = source.currentSrc || source.src;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");

      const sourceStyle = getComputedStyle(source);
      Object.assign(image.style, {
        position: "fixed",
        left: `${sourceRect.left}px`,
        top: `${sourceRect.top}px`,
        width: `${sourceRect.width}px`,
        height: `${sourceRect.height}px`,
        margin: "0",
        objectFit: sourceStyle.objectFit,
        objectPosition: sourceStyle.objectPosition,
        background: "#f1f1ef",
        zIndex: "10000",
        pointerEvents: "none",
        borderRadius: sourceStyle.borderRadius,
        transform: "translate3d(0,0,0)",
        transformOrigin: "center center",
        willChange: "left, top, width, height, opacity, filter",
        maxWidth: "none",
      });

      document.body.append(backdrop, image);

      const cleanup = () => {
        image.remove();
        backdrop.remove();
        delete document.documentElement.dataset.productTransitionActive;

        if (pending.current?.image === image) {
          window.clearTimeout(pending.current.timer);
          pending.current = null;
        }
      };

      const active: Pending = {
        image,
        backdrop,
        href: url.pathname,
        cleanup,
        timer: window.setTimeout(cleanup, 5200),
      };

      pending.current = active;

      const center = getCenteredRect(sourceRect);

      backdrop.animate([{ opacity: 0 }, { opacity: 0.94 }], {
        duration: 420,
        easing: "cubic-bezier(.22,.61,.36,1)",
        fill: "forwards",
      });

      const moveToCenter = image.animate(
        [
          {
            left: `${sourceRect.left}px`,
            top: `${sourceRect.top}px`,
            width: `${sourceRect.width}px`,
            height: `${sourceRect.height}px`,
            opacity: 1,
            filter: "blur(0)",
          },
          {
            left: `${center.left}px`,
            top: `${center.top}px`,
            width: `${center.width}px`,
            height: `${center.height}px`,
            opacity: 1,
            filter: "blur(.4px)",
          },
        ],
        {
          duration: 560,
          easing: "cubic-bezier(.16,1,.3,1)",
          fill: "forwards",
        },
      );

      moveToCenter.finished
        .catch(() => undefined)
        .then(() => {
          if (pending.current !== active) return;

          Object.assign(image.style, {
            left: `${center.left}px`,
            top: `${center.top}px`,
            width: `${center.width}px`,
            height: `${center.height}px`,
            filter: "blur(0)",
          });

          moveToCenter.cancel();
          router.push(url.pathname + url.search, { scroll: true });
        });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router, pathname]);

  useEffect(() => {
    const transition = pending.current;
    if (!transition) return;

    if (transition.href !== pathname) {
      transition.cleanup();
      return;
    }

    const active = transition;
    let frame = 0;
    let stopped = false;
    let growAnimation: Animation | undefined;
    let target: HTMLImageElement | null = null;
    let noTargetTimer = 0;

    const observer = new MutationObserver(tryAnimate);

    function tryAnimate() {
      if (stopped) return;

      target = document.querySelector<HTMLImageElement>(
        "[data-product-image-target] img",
      );

      if (!target) return;

      const firstRect = target.getBoundingClientRect();
      if (!firstRect.width || !firstRect.height) return;

      stopped = true;
      observer.disconnect();
      window.clearTimeout(noTargetTimer);

      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => {
          if (!target || pending.current !== active) {
            active.cleanup();
            return;
          }

          const rect = target.getBoundingClientRect();
          const targetStyle = getComputedStyle(target);
          const image = active.image;
          const currentRect = image.getBoundingClientRect();

          Object.assign(image.style, {
            left: `${currentRect.left}px`,
            top: `${currentRect.top}px`,
            width: `${currentRect.width}px`,
            height: `${currentRect.height}px`,
            objectFit: targetStyle.objectFit,
            objectPosition: targetStyle.objectPosition,
            borderRadius: targetStyle.borderRadius,
            opacity: "1",
            transform: "none",
            filter: "blur(0)",
          });

          active.backdrop.animate([{ opacity: 0.94 }, { opacity: 0 }], {
            duration: 980,
            easing: "cubic-bezier(.16,1,.3,1)",
            fill: "forwards",
          });

          growAnimation = image.animate(
            [
              {
                left: `${currentRect.left}px`,
                top: `${currentRect.top}px`,
                width: `${currentRect.width}px`,
                height: `${currentRect.height}px`,
                opacity: 1,
                filter: "blur(0)",
              },
              {
                left: `${rect.left}px`,
                top: `${rect.top}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                opacity: 1,
                filter: "blur(0)",
              },
            ],
            {
              duration: window.innerWidth < 768 ? 920 : 1080,
              easing: "cubic-bezier(.16,1,.3,1)",
              fill: "forwards",
            },
          );

          growAnimation.finished
            .then(() => {
              if (!target || pending.current !== active) return;

              const reveal = () => {
                if (!target || pending.current !== active) return;

                delete document.documentElement.dataset.productTransitionActive;

                window.requestAnimationFrame(() => {
                  active.image.remove();
                  active.backdrop.remove();

                  if (pending.current === active) {
                    window.clearTimeout(active.timer);
                    pending.current = null;
                  }
                });
              };

              if (target.complete && target.naturalWidth) {
                reveal();
              } else {
                target.addEventListener("load", reveal, { once: true });
                target.addEventListener("error", active.cleanup, { once: true });
              }
            })
            .catch(active.cleanup);
        });
      });
    }

    observer.observe(document.body, { childList: true, subtree: true });
    tryAnimate();

    noTargetTimer = window.setTimeout(() => {
      if (!stopped) active.cleanup();
    }, 1600);

    return () => {
      observer.disconnect();
      window.clearTimeout(noTargetTimer);
      window.cancelAnimationFrame(frame);
      growAnimation?.cancel();
    };
  }, [pathname]);

  useEffect(() => () => pending.current?.cleanup(), []);

  return (
    <style jsx global>{`
      html[data-product-transition-active="true"]
        [data-product-image-target]
        img {
        opacity: 0 !important;
      }
    `}</style>
  );
}
