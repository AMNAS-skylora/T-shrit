"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/types/product";
import type {
  HeroCtaStyle,
  HeroImagePosition,
  HeroSlideConfig,
} from "@/data/hero-slides";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type ResolvedHeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  button: string;
  href: string;
  image?: string;
  label?: string;
  brand?: string;
  meta?: string;
  discountText?: string;
  showCountdown?: boolean;
  endsAt?: string | null;
  ctaStyle: HeroCtaStyle;
  imagePosition: HeroImagePosition;
};

function getTimeLeft(endAt?: string | null): TimeLeft {
  if (!endAt) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const remaining = Math.max(0, new Date(endAt).getTime() - Date.now());
  const total = Math.floor(remaining / 1000);

  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function isScheduledNow(slide: HeroSlideConfig, now: number) {
  const starts = slide.startsAt ? new Date(slide.startsAt).getTime() : null;
  const ends = slide.endsAt ? new Date(slide.endsAt).getTime() : null;

  if (starts !== null && Number.isFinite(starts) && now < starts) return false;
  if (ends !== null && Number.isFinite(ends) && now > ends) return false;
  return true;
}

export function TopFashionHero({
  products,
  heroSlides,
  fullscreen = false,
}: {
  products: Product[];
  heroSlides: HeroSlideConfig[];
  fullscreen?: boolean;
}) {
  const touchStart = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const [scheduleNow, setScheduleNow] = useState(0);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const slides = useMemo<ResolvedHeroSlide[]>(() => {
    return [...heroSlides]
      .filter(
        (slide) =>
          slide.enabled &&
          (!scheduleNow || isScheduledNow(slide, scheduleNow)),
      )
      .sort((a, b) => a.id === "default-hero" ? -1 : b.id === "default-hero" ? 1 : a.order - b.order)
      .map<ResolvedHeroSlide | null>((slide) => {
        const selectedProduct = slide.productId
          ? products.find(
              (product) =>
                product.id === slide.productId && product.status === "active",
            )
          : undefined;

        const product = selectedProduct;

        // Product hero slides must always point to the exact real product
        // selected in Admin. Never substitute another product when the
        // selected product was deleted, drafted, or is otherwise unavailable.
        if (slide.kind === "product" && !product) return null;

        const variantImage =
          product?.colorVariants?.find((variant) => variant.images?.length)
            ?.images?.[0] ??
          product?.colorVariants?.find((variant) => variant.image)?.image;

        const image = slide.imageUrl || product?.image || variantImage;
        const title = slide.title || product?.name || "";

        if (!title) return null;

        return {
          id: slide.id,
          label: slide.label,
          brand: slide.brand,
          title,
          subtitle: slide.subtitle || product?.description || "",
          button: slide.button || (product ? "View product" : "Explore"),
          href:
            slide.href ||
            (product ? `/products/${product.slug}` : "/products"),
          image,
          meta: product
            ? `${product.name} · ${money(product.price)}`
            : undefined,
          discountText: slide.discountText,
          showCountdown: Boolean(slide.showCountdown && slide.endsAt),
          endsAt: slide.endsAt,
          ctaStyle: slide.ctaStyle ?? "light",
          imagePosition: slide.imagePosition ?? "center",
        } satisfies ResolvedHeroSlide;
      })
      .filter((slide): slide is ResolvedHeroSlide => slide !== null);
  }, [heroSlides, products, scheduleNow]);

  const slideCount = slides.length;
  const current = slides[index] ?? slides[0];

  useEffect(() => {
    const syncSchedule = () => setScheduleNow(Date.now());
    syncSchedule();

    const timer = window.setInterval(syncSchedule, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!current?.showCountdown || !current.endsAt) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const update = () => setTimeLeft(getTimeLeft(current.endsAt));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [current?.endsAt, current?.showCountdown]);

  useEffect(() => {
    if (slideCount <= 1) return;


    let timer = 0;
    const start = () => {
      window.clearInterval(timer);
      if (document.hidden) return;
      timer = window.setInterval(() => {
        setIndex((currentIndex) => (currentIndex + 1) % slideCount);
      }, 5600);
    };

    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", start);
    };
  }, [slideCount]);

  useEffect(() => {
    if (index >= slideCount) setIndex(0);
  }, [index, slideCount]);

  if (!current) return null;

  const isExternal =
    current.href.startsWith("http://") ||
    current.href.startsWith("https://") ||
    current.href.startsWith("mailto:");

  const titleIsLong = current.title.length > 20;
  const TitleTag = fullscreen ? "h2" : "h1";

  const ctaClass =
    "inline-flex min-h-[44px] items-center justify-center rounded-none px-5 text-[10px] font-bold tracking-[.08em] transition " +
    (current.ctaStyle === "dark"
      ? "bg-[#111111] !text-white hover:bg-black"
      : current.ctaStyle === "outline"
        ? "border border-black/25 bg-transparent !text-[#111111] hover:bg-black/[.04]"
        : "border border-black/10 bg-white !text-[#111111] hover:bg-[#f7f7f7]");

  return (
    <section data-shop-reveal aria-label="Featured collections" aria-roledescription="carousel" className="w-full overflow-hidden" onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; touchStartY.current = event.touches[0]?.clientY ?? null; }} onTouchCancel={() => { touchStart.current = null; }} onTouchEnd={(event) => { const start = touchStart.current; touchStart.current = null; const end = event.changedTouches[0]?.clientX; if (start !== null && end !== undefined && Math.abs(end - start) > 60 && Math.abs(end - start) > Math.abs((event.changedTouches[0]?.clientY ?? 0) - (touchStartY.current ?? 0))) setIndex((value) => (value + (end < start ? 1 : -1) + slideCount) % slideCount); }}>
      <div className={fullscreen ? "relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#111] text-white" : "relative flex w-full flex-col overflow-hidden bg-[#fafafa] md:aspect-[16/9] md:min-h-[580px] text-[#111111]"}>
        <div className={fullscreen ? "absolute inset-0 overflow-hidden" : "relative order-2 aspect-[4/5] w-full overflow-hidden md:absolute md:inset-y-0 md:right-0 md:aspect-auto md:h-full md:w-1/2"}>
          {slides.map((slide, slideIndex) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-out ${
                slideIndex === index
                  ? "scale-100 opacity-100"
                  : "pointer-events-none scale-[1.015] opacity-0"
              }`}
              aria-hidden={slideIndex !== index}
            >
              {slide.image ? (
                <div className="absolute inset-0">
                  <Image
                    key={`${slide.id}-${slideIndex === index ? "active" : "idle"}`}
                    src={slide.image}
                    alt={slide.title}
                    fill
                    preload={slideIndex === 0}
                    sizes={fullscreen ? "100vw" : "(max-width: 767px) 100vw, 50vw"}
                    className={`${fullscreen ? "offer-background-image object-cover" : "object-contain"} ${
                      slide.imagePosition === "left"
                        ? "object-left"
                        : slide.imagePosition === "right"
                          ? "object-right"
                          : "object-center"
                    }`}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-[#dedbd5]" />
              )}
            </div>
          ))}

          <div className={`${fullscreen ? "hidden" : ""} pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-[#fafafa] via-[#fafafa]/35 to-transparent md:hidden`} />
          {fullscreen ? <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/10" /> : <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[14%] bg-gradient-to-r from-[#fafafa] to-transparent md:block" />}
        </div>

        <div className={fullscreen ? "relative z-10 flex min-h-[100svh] flex-col justify-center px-6 py-20 sm:px-12 lg:px-20" : "relative z-10 order-1 flex min-w-0 flex-col px-5 pb-6 pt-8 md:h-full md:w-1/2 md:px-12 md:py-9 lg:px-16 lg:py-12"}>
          <div className="flex flex-1 items-center">
            <div key={current.id} className="offer-slide-copy w-full max-w-[560px] py-8 md:max-w-[560px] md:py-0">
              {current.label ? <p className="mb-5 text-xs font-semibold tracking-[.12em]">{current.label}</p> : null}
              {current.brand ? <p className="mb-4 text-lg font-bold">{current.brand}</p> : null}
              {current.discountText ? (
                <strong className="mb-3 block text-[10px] font-bold uppercase tracking-[.12em] text-inherit md:text-[11px]">
                  {current.discountText}
                </strong>
              ) : null}

              <TitleTag
                className={`m-0 max-w-[560px] whitespace-pre-line break-words font-black leading-[0.88] tracking-[-0.06em] ${
                  titleIsLong
                    ? "text-[clamp(32px,8vw,48px)] md:text-[clamp(40px,4vw,64px)]"
                    : "text-[clamp(34px,9vw,52px)] md:text-[clamp(44px,4.5vw,72px)]"
                }`}
              >
                {current.title}
              </TitleTag>

              {current.subtitle ? (
                <p className={`mt-5 max-w-[360px] text-sm leading-[1.65] ${fullscreen ? "text-white/80" : "text-black/70"} md:max-w-[390px] md:text-sm md:leading-[1.7]`}>
                  {current.subtitle}
                </p>
              ) : null}

              {current.meta ? (
                <p className="mt-3 text-[8px] font-semibold uppercase tracking-[.06em] text-black/38 md:text-[9px]">
                  {current.meta}
                </p>
              ) : null}

              {current.showCountdown ? (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {[
                    ["Days", timeLeft.days],
                    ["Hrs", timeLeft.hours],
                    ["Min", timeLeft.minutes],
                    ["Sec", timeLeft.seconds],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="min-w-[58px] border border-black/10 bg-white/65 px-3 py-2.5 backdrop-blur-sm"
                    >
                      <strong className="block text-[17px] font-bold md:text-[20px]">
                        {pad(Number(value))}
                      </strong>
                      <span className="text-[6px] uppercase tracking-[0.1em] text-black/35">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                {isExternal ? (
                  <a
                    href={current.href}
                    target={
                      current.href.startsWith("https://")
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      current.href.startsWith("https://")
                        ? "noreferrer"
                        : undefined
                    }
                    className={ctaClass}
                  >
                    {current.button}
                  </a>
                ) : (
                  <Link href={current.href} className={ctaClass}>
                    {current.button}
                  </Link>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>
      <style jsx>{`
        .offer-slide-copy { animation: offerCopyIn 700ms cubic-bezier(.22,1,.36,1) both; }
        :global(.offer-background-image) { animation: offerBackgroundDrift 8s ease-out both; }
        @keyframes offerCopyIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes offerBackgroundDrift { from { transform: scale(1.06); } to { transform: scale(1); } }
      `}</style>
    </section>
  );
}
