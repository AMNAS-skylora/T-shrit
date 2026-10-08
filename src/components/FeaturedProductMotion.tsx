"use client";

import type { Product } from "@/types/product";
import { getProductPrimaryImage } from "@/lib/product-images";
import { getProductOfferPrice } from "@/lib/product-offers";
import { useOfferClock } from "@/hooks/useOfferClock";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function FeaturedProductMotion({ products = [], layout = "motion" }: { products?: Product[]; layout?: "motion" | "static" }) {
  const items = useMemo(() => products.filter((product) => Boolean(getProductPrimaryImage(product))).map((product) => ({
    id: product.id, name: product.name, description: product.description,
    price: product.price, image: getProductPrimaryImage(product) || "", href: `/products/${product.slug}`,
  })), [products]);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const reducedMotion = layout === "static";
  const framesRef = useRef<number[]>([]);
  const transitionTimerRef = useRef<number | null>(null);


  useEffect(() => {
    if (index < items.length) return;
    setIndex(0);
  }, [index, items.length]);

  useEffect(() => {
    if (reducedMotion) { setIndex(0); setVisible(true); return; }
    if (items.length <= 1) return;

    const changeProduct = () => {
      if (document.hidden) return;
      setVisible(false);

      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }

      transitionTimerRef.current = window.setTimeout(() => {
        setIndex((current) => (current + 1) % items.length);

        framesRef.current = [window.requestAnimationFrame(() => {
          framesRef.current.push(window.requestAnimationFrame(() => setVisible(true)));
        })];

        transitionTimerRef.current = null;
      }, 380);
    };

    const timer = window.setInterval(changeProduct, 5000);

    return () => {
      window.clearInterval(timer);
      framesRef.current.forEach((frame) => window.cancelAnimationFrame(frame));
      framesRef.current = [];
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [items.length, reducedMotion]);

  const current = items[index] ?? items[0];
  const selectedProduct = products.find((product) => product.id === current?.id);
  const offerNow = useOfferClock(selectedProduct);
  const displayPrice = selectedProduct ? getProductOfferPrice(selectedProduct, offerNow) : current?.price ?? 0;
  if (!current) return null;


  return (
    <section
      className="relative overflow-hidden bg-[#f7f5ef] text-[#111]"
      data-motion-owned
      aria-label="Featured products"
    >
      <div className="mx-auto grid min-h-[68svh] w-full max-w-[1440px] grid-cols-1 lg:min-h-[74dvh] lg:grid-cols-2">
        <div className="order-2 flex items-center px-5 py-12 sm:px-8 sm:py-16 lg:order-1 lg:px-14 lg:py-20 xl:px-20">
          <div
            key={"copy-" + current.id + "-" + index}
            className={"featured-motion-copy max-w-[560px] " + (visible ? "is-visible" : "is-hidden")}
          >
            <h2 className="m-0 max-w-[520px] text-[clamp(38px,5.6vw,78px)] font-semibold leading-[.9] tracking-[-.06em]">
              {current.name}
            </h2>

            <p className="mt-6 max-w-[460px] text-[13px] leading-6 text-black/55 sm:text-[14px] sm:leading-7">
              {current.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <strong className="text-[17px] font-semibold tracking-[-.02em]">
                {money(displayPrice)}
              </strong>

              <Link
                href={current.href}
                className="inline-flex min-h-10 items-center justify-center border border-black/15 bg-white/60 px-5 text-[9px] font-semibold uppercase tracking-[.08em] text-[#111] transition hover:bg-white"
              >
                View product
              </Link>
            </div>

          </div>
        </div>

        <div className="order-1 flex min-h-[46svh] items-center justify-center overflow-hidden px-5 py-8 sm:min-h-[52svh] sm:px-8 lg:order-2 lg:min-h-0 lg:px-10 lg:py-12">
          <div
            key={"image-" + current.id + "-" + index}
            className={"featured-motion-image relative flex h-full min-h-[42svh] w-full items-center justify-center lg:min-h-[62vh] " + (visible ? "is-visible" : "is-hidden")}
          >
            <div className="absolute inset-[8%] rounded-full bg-black/[.025] blur-3xl" />
            <img
              src={current.image}
              alt={current.name}
              draggable={false}
              className="relative z-10 max-h-[58svh] w-auto max-w-[92%] select-none object-contain drop-shadow-[0_28px_42px_rgba(0,0,0,.12)] lg:max-h-[68vh]"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .featured-motion-copy,
        .featured-motion-image {
          will-change: opacity, transform;
        }

        .featured-motion-copy {
          transition:
            opacity 380ms ease,
            transform 720ms cubic-bezier(.16,1,.3,1),
            filter 420ms ease;
        }

        .featured-motion-image {
          transition:
            opacity 420ms ease,
            transform 900ms cubic-bezier(.16,1,.3,1),
            filter 460ms ease;
        }

        .featured-motion-copy.is-visible,
        .featured-motion-image.is-visible {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          filter: blur(0);
        }

        .featured-motion-copy.is-hidden {
          opacity: 0;
          transform: translate3d(-28px, 0, 0);
          filter: blur(2px);
        }

        .featured-motion-image.is-hidden {
          opacity: 0;
          transform: translate3d(42px, 0, 0) scale(.985);
          filter: blur(1.5px);
        }

        @media (max-width: 1023px) {
          .featured-motion-copy.is-hidden {
            transform: translate3d(-18px, 0, 0);
          }

          .featured-motion-image.is-hidden {
            transform: translate3d(28px, 0, 0) scale(.99);
          }
        }


      `}</style>
    </section>
  );
}