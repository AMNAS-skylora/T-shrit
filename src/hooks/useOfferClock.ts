"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types/product";

// Wake exactly at an offer boundary, rather than waiting for the next poll.
export function useOfferClock(product?: Partial<Product>) {
  const [now, setNow] = useState(() => Date.now());
  const start = product?.offerEnabled ? product.offerStartsAt : undefined;
  const end = product?.offerEnabled ? product.offerEndsAt : undefined;
  const countdown = Boolean(product?.offerCountdown);
  const saleEnd = product?.saleEndsAt;
  useEffect(() => {
    if (!start && !end && !saleEnd) return;
    let timer = 0;
    const sync = () => {
      window.clearTimeout(timer);
      const current = Date.now();
      setNow(current);
      if (document.hidden) return;
      const future = [start, end, saleEnd].map((date) => date ? Date.parse(date) : NaN).filter((time) => Number.isFinite(time) && time > current);
      const next = Math.min(current + (countdown || saleEnd ? 1000 : 60000), ...future);
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
  }, [start, end, saleEnd, countdown]);
  return now;
}
