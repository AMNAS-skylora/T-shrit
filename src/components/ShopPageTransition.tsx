"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type Transition = { main: HTMLElement; animation: Animation; timeout: number; cancelled: boolean };

// Keep the header in place while the catalog content changes underneath it.
export function ShopPageTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const pending = useRef<Transition | null>(null);
  const incoming = useRef<Animation | null>(null);

  useEffect(() => {
    const active = pending.current;
    if (!active) return;
    active.cancelled = true;
    window.clearTimeout(active.timeout);
    active.animation.cancel();
    pending.current = null;
    if (pathname !== "/products" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.querySelector("main");
    if (!main) return;
    incoming.current = main.animate([
      { opacity: 0.55, transform: "translate3d(0,12px,0)" },
      { opacity: 1, transform: "translate3d(0,0,0)" },
    ], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" });
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== "/products" || pathname === "/products") return;
      const main = document.querySelector("main");
      if (!main || typeof main.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      event.preventDefault();
      if (pending.current) return;
      incoming.current?.cancel();
      router.prefetch(url.pathname + url.search);
      const animation = main.animate([
        { opacity: 1, transform: "translate3d(0,0,0)" },
        { opacity: 0.55, transform: "translate3d(0,-12px,0)" },
      ], { duration: 200, easing: "ease-out", fill: "forwards" });
      const active: Transition = { main, animation, timeout: 0, cancelled: false };
      active.timeout = window.setTimeout(() => {
        active.cancelled = true;
        animation.cancel();
        if (pending.current === active) pending.current = null;
      }, 8000);
      pending.current = active;
      animation.finished.then(() => {
        if (!active.cancelled && pending.current === active) router.push(url.pathname + url.search + url.hash, { scroll: true });
      }).catch(() => {
        window.clearTimeout(active.timeout);
        if (pending.current === active) pending.current = null;
      });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, router]);

  useEffect(() => () => {
    if (pending.current) {
      pending.current.cancelled = true;
      window.clearTimeout(pending.current.timeout);
      pending.current.animation.cancel();
      pending.current = null;
    }
    incoming.current?.cancel();
  }, []);

  return null;
}
