"use client";

import { useEffect, useState } from "react";
import { useInitialOfferTime } from "@/components/OfferClockProvider";
import type { Product } from "@/types/product";

// Wake exactly at an offer boundary, rather than waiting for the next poll.
export function useOfferClock(product?: Partial<Product>, tickCountdown = true) {
  // The serialized server snapshot also seeds the first browser render.
  // Read the browser clock only after hydration, in the effect below.
  const initialNow = useInitialOfferTime();
  const [now, setNow] = useState(initialNow);
  const start = product?.offerEnabled ? product.offerStartsAt : undefined;
  const end = product?.offerEnabled ? product.offerEndsAt : undefined;
  const countdown = tickCountdown && Boolean(end);
  useEffect(() => {
    if (!start && !end) return;
    let timer = 0;
    const sync = () => {
      window.clearTimeout(timer);
      const current = Date.now();
      setNow(current);
      if (document.hidden) return;
      const future = [start, end].map((date) => date ? Date.parse(date) : NaN).filter((time) => Number.isFinite(time) && time > current);
      if (!future.length) return;
      const next = Math.min(current + (tickCountdown && countdown ? 1000 : 60000), ...future);
      timer = window.setTimeout(sync, Math.max(16, next - current));
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, [start, end, countdown, tickCountdown]);
  return now;
}
