"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useOfferClock } from "@/hooks/useOfferClock";
import { getProductOfferPrice } from "@/lib/product-offers";
import type { Product } from "@/types/product";

function getProductImage(product: Product) {
  return (
    product.featuredImage ||
    product.image ||
    product.colorVariants?.find((variant) => variant.images?.length)
      ?.images?.[0] ||
    product.colorVariants?.find((variant) => variant.image)?.image ||
    ""
  );
}

type SliderItem = {
  id: string;
  name: string;
  slug: string;
  image: string;
  backgroundImage: string;
  category: string;
  description: string;
  price: number;
  source?: Product;
};

export function AutoOutfitHero({ products }: { products: Product[] }) {
  const items = useMemo<SliderItem[]>(() => {
    const activeProducts = products
      .filter(
        (product) =>
          product.status === "active" && Boolean(getProductImage(product)),
      )
      .slice(0, 20);

    return activeProducts.map((product) => {
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: getProductImage(product),
        backgroundImage:
          product.showcaseBackgroundImage || "",
        category: product.category,
        description: product.description,
        price: product.price,
        source: product,
      };
    });
  }, [products]);

  const railProducts = useMemo(() => {
    const source = items.slice(0, 20);
    if (!source.length) return [];

    const slotCount = Math.max(8, source.length);

    return Array.from({ length: slotCount }, (_, slotIndex) => {
      const baseIndex = slotIndex % source.length;
      const product = source[baseIndex];

      return {
        ...product,
        railId: "rail-" + slotIndex + "-" + product.id,
        baseIndex,
      };
    });
  }, [items]);

  const heroShowcaseCount = Math.min(items.length, 8);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = false;
  const railRef = useRef<HTMLDivElement | null>(null);
  const railInteractingRef = useRef(false);
  const railFrameRef = useRef<number | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const active = items[activeIndex] ?? items[0];
  const offerNow = useOfferClock(active?.source);
  const activePrice = active?.source ? getProductOfferPrice(active.source, offerNow) : active?.price;


  useEffect(() => {
    if (activeIndex < items.length) return;
    setActiveIndex(0);
  }, [activeIndex, items.length]);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current !== null) {
        window.clearTimeout(pauseTimerRef.current);
      }
      if (railFrameRef.current !== null) {
        window.cancelAnimationFrame(railFrameRef.current);
      }
    };
  }, []);

  const selectProduct = useCallback(
    (index: number, manual = false) => {
      if (!items.length) return;

      const next = ((index % items.length) + items.length) % items.length;
      setActiveIndex(next);

      if (!manual) return;

      setPaused(true);

      if (pauseTimerRef.current !== null) {
        window.clearTimeout(pauseTimerRef.current);
      }

      pauseTimerRef.current = window.setTimeout(() => {
        setPaused(false);
        pauseTimerRef.current = null;
      }, 4200);
    },
    [items.length],
  );

  useEffect(() => {
    if (heroShowcaseCount <= 1 || reducedMotion || paused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const normalized =
          current >= heroShowcaseCount ? 0 : current;
        return (normalized + 1) % heroShowcaseCount;
      });
    }, 4200);

    return () => window.clearInterval(timer);
  }, [heroShowcaseCount, paused, reducedMotion]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || reducedMotion || !railProducts.length) return;

    const setWidth = () => rail.scrollWidth / 3;

    const initialize = window.requestAnimationFrame(() => {
      const width = setWidth();
      if (width > 0) rail.scrollLeft = width;
    });

    const tick = () => {
      const width = setWidth();

      if (!railInteractingRef.current && width > 0) {
        rail.scrollLeft += 0.26;

        if (rail.scrollLeft >= width * 2) {
          rail.scrollLeft -= width;
        } else if (rail.scrollLeft <= 0) {
          rail.scrollLeft += width;
        }
      }

      railFrameRef.current = window.requestAnimationFrame(tick);
    };

    railFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(initialize);
      if (railFrameRef.current !== null) {
        window.cancelAnimationFrame(railFrameRef.current);
        railFrameRef.current = null;
      }
    };
  }, [railProducts.length, reducedMotion]);

  if (!active) return null;

  return (
    <section
      className="relative h-[100svh] min-h-[100svh] w-screen overflow-hidden md:h-[100dvh] md:min-h-[100dvh]"
      data-product-hero
      aria-label="Product selector"
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null; touchStartY.current = event.touches[0]?.clientY ?? null;
        setPaused(true);
      }}
      onTouchCancel={() => { touchStartX.current = null; setPaused(false); }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartX.current = null;

        if (start !== null && end !== undefined) {
          const delta = end - start;

          if (Math.abs(delta) > 55 && Math.abs(delta) > Math.abs((event.changedTouches[0]?.clientY ?? 0) - (touchStartY.current ?? 0))) {
            selectProduct(
              activeIndex + (delta < 0 ? 1 : -1),
              true,
            );
          }
        }

        if (pauseTimerRef.current !== null) {
          window.clearTimeout(pauseTimerRef.current);
        }

        pauseTimerRef.current = window.setTimeout(() => {
          setPaused(false);
          pauseTimerRef.current = null;
        }, 4200);
      }}
    >
      {active.backgroundImage ? (
        <>
          <div
            key={"background-" + active.backgroundImage}
            className="selected-background absolute inset-0"
          >
            <img
              src={active.backgroundImage}
              alt=""
              className="h-full w-full object-cover object-top"
            />
          </div>

          <div className="pointer-events-none absolute inset-0 z-[11] bg-black/10" />
        </>
      ) : null}

      <div data-hero-product-image key={"product-" + active.id} className="selected-product-image pointer-events-none absolute bottom-[210px] right-4 z-20 h-[30svh] w-[60%] sm:bottom-[220px] sm:right-10 sm:h-[55svh] sm:w-[44%]"><img src={active.image} alt={active.name} className="h-full w-full object-contain" /></div>

      <div data-motion-owned key={"details-" + active.id} className="selected-product-details absolute left-5 right-5 top-[10%] z-30 max-w-[560px] rounded-sm bg-white/85 p-5 text-[#111] backdrop-blur-sm sm:left-10 sm:right-auto sm:top-[15%] sm:p-8 lg:left-16">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.14em]">KLEID.IN / {active.category}</p>
        <h1 className="selected-product-name text-[clamp(32px,5vw,68px)] font-semibold leading-[.95] tracking-[-.05em]">{active.name}</h1>
        <p className="mt-4 max-w-[420px] text-sm leading-6">{active.description}</p>
        <p className="selected-product-price mt-4 text-lg font-semibold">₹{activePrice?.toLocaleString("en-IN")}</p>
        <Link href={`/products/${active.slug}`} onTouchStart={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} className="selected-product-button mt-5 inline-flex min-h-11 items-center bg-[#111] px-6 text-xs font-semibold !text-white">View product <span className="ml-4">↗</span></Link>
      </div>

      <div className="absolute inset-x-0 bottom-[76px] z-40 flex h-[112px] items-center sm:bottom-[82px] sm:h-[122px] lg:bottom-[86px] lg:h-[132px]">
        <div
          ref={railRef}
          onPointerDown={(event) => {
            event.stopPropagation();
            railInteractingRef.current = true;
          }}
          onPointerUp={(event) => {
            event.stopPropagation();
            railInteractingRef.current = false;
          }}
          onPointerCancel={() => {
            railInteractingRef.current = false;
          }}
          onPointerLeave={() => {
            railInteractingRef.current = false;
          }}
          onTouchStart={(event) => event.stopPropagation()}
          onTouchEnd={(event) => event.stopPropagation()}
          onScroll={() => {
            const rail = railRef.current;
            if (!rail) return;

            const width = rail.scrollWidth / 3;
            if (!width) return;

            if (rail.scrollLeft < width * 0.35) {
              rail.scrollLeft += width;
            } else if (rail.scrollLeft > width * 2.65) {
              rail.scrollLeft -= width;
            }
          }}
          className="flex h-full w-full cursor-grab items-center gap-[1.5vw] overflow-x-auto px-[1.5vw] [scrollbar-width:none] active:cursor-grabbing sm:gap-[1.35vw] sm:px-[1.35vw] lg:gap-[1vw] lg:px-[1vw] [&::-webkit-scrollbar]:hidden"
        >
          {[0, 1, 2].flatMap((setIndex) =>
            railProducts.map((product, index) => {
              const selected = product.baseIndex === activeIndex;

              return (
                <button
                  key={setIndex + "-" + product.railId}
                  type="button"
                  aria-label={"Select " + product.name}
                  aria-current={selected ? "true" : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectProduct(product.baseIndex, true);
                  }}
                  className={
                    "relative h-[68px] w-[22vw] shrink-0 overflow-hidden border border-white/30 bg-white/20 shadow-[0_8px_24px_rgba(0,0,0,.08)] backdrop-blur-md transition-[transform,border-color,background-color,opacity] duration-300 sm:h-[96px] sm:w-[15.25vw] lg:h-[104px] lg:w-[11.625vw] xl:h-[110px] " +
                    (selected
                      ? "scale-[1.08] border-2 border-[#b7ff35] bg-white/32 opacity-100 shadow-[0_12px_30px_rgba(0,0,0,.14)]"
                      : "opacity-88 hover:scale-[1.03] hover:bg-white/28 hover:opacity-100")
                  }
                >
                  <img
                    src={product.image}
                    alt=""
                    draggable={false}
                    className="absolute inset-[4%] h-[92%] w-[92%] select-none object-contain object-center"
                  />
                </button>
              );
            }),
          )}
        </div>
      </div>

      <style jsx>{`
        .selected-background {
          animation: selectedBackgroundIn 900ms cubic-bezier(.16,1,.3,1) both;
          will-change: transform, opacity;
        }

        .hero-brand-copy {
          animation: heroBrandCopyIn 820ms cubic-bezier(.16,1,.3,1) both;
          will-change: transform, opacity, filter;
        }

        .hero-product-meta {
          animation: heroProductMetaIn 760ms cubic-bezier(.16,1,.3,1) both;
          will-change: transform, opacity, filter;
        }

        .selected-product-stage {
          animation: selectedStageIn 700ms cubic-bezier(.16,1,.3,1) both;
        }

        .selected-product-image {
          animation: selectedImageIn 960ms cubic-bezier(.16,1,.3,1) both;
          will-change: transform, opacity;
        }

        .selected-product-details {
          animation: selectedPanelIn 450ms ease-out backwards;
        }

        .selected-product-name {
          animation: selectedCopyIn 650ms 80ms cubic-bezier(.22,1,.36,1) backwards;
        }

        .selected-product-price {
          animation: selectedCopyIn 600ms 200ms cubic-bezier(.22,1,.36,1) backwards;
        }

        .selected-product-button {
          animation: selectedCopyIn 600ms 320ms cubic-bezier(.22,1,.36,1) backwards;
        }

        .selected-product-button:focus-visible {
          outline: 3px solid #001cac;
          outline-offset: 4px;
        }

        @keyframes selectedPanelIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes selectedCopyIn {
          from { opacity: 0; transform: translate3d(0, 18px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        @keyframes selectedBackgroundIn {
          from {
            opacity: 0;
            transform: scale(1.035);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes heroBrandCopyIn {
          from {
            opacity: 0;
            filter: blur(3px);
            transform: translateX(-18px);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateX(0);
          }
        }

        @keyframes heroProductMetaIn {
          from {
            opacity: 0;
            filter: blur(3px);
            transform: translateX(18px);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateX(0);
          }
        }

        @keyframes selectedStageIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes selectedImageIn {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(.91);
          }
          68% {
            opacity: 1;
            transform: translateY(-4px) scale(1.025);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes selectedDetailsIn {
          from {
            opacity: 0;
            filter: blur(4px);
            transform: translateY(14px) scale(.97);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0) scale(1);
          }
        }

        @keyframes selectedButtonIn {
          from {
            opacity: 0;
            transform: translateX(8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 767px) {
          .hero-model-image {
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            object-fit: cover !important;
            object-position: center 25% !important;
            transform: none !important;
            transform-origin: center center;
          }

          .hero-product-meta {
            text-shadow: 0 1px 16px rgba(0, 0, 0, .28);
          }


          .hero-brand-copy {
            animation-duration: 680ms;
          }

          .hero-product-meta {
            animation-duration: 680ms;
          }

          @keyframes heroBrandCopyIn {
            from {
              opacity: 0;
              filter: blur(2px);
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              filter: blur(0);
              transform: translateX(0);
            }
          }

          @keyframes heroProductMetaIn {
            from {
              opacity: 0;
              filter: blur(2px);
              transform: translateX(10px);
            }
            to {
              opacity: 1;
              filter: blur(0);
              transform: translateX(0);
            }
          }

          @keyframes selectedImageIn {
            0% {
              opacity: 0;
              transform: translateY(12px) scale(.96);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        }

        @media (min-width: 1024px) {
          @keyframes selectedDetailsIn {
            from {
              opacity: 0;
              filter: blur(4px);
              transform: translateY(calc(-50% + 14px)) scale(.97);
            }
            to {
              opacity: 1;
              filter: blur(0);
              transform: translateY(-50%) scale(1);
            }
          }
        }


      `}</style>
    </section>
  );
}
