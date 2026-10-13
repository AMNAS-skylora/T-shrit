"use client";

import Image from "next/image";
import Link from "next/link";
import { useOfferClock } from "@/hooks/useOfferClock";
import { getProductOfferPrice, isProductOfferActive } from "@/lib/product-offers";
import { formatPrice } from "@/lib/format";
import { getProductPrimaryImage } from "@/lib/product-images";
import type { Product } from "@/types/product";

export function HomeProductGridCard({
  theme = "light",
  product,
}: {
  theme?: "light" | "dark";
  product: Product;
  // Kept for existing Home/Shop callers; ordering is available on the product page.
  whatsappNumber?: string;
}) {
  const image = getProductPrimaryImage(product);
  // Only update at offer start/end boundaries, not every second.
  const now = useOfferClock(product, false);
  const offerActive = isProductOfferActive(product, now);
  const price = getProductOfferPrice(product, now);
  const discounted = offerActive && price < product.price;
  const available = product.status === "active" && product.stock > 0;

  // An open-ended discount is NOT a limited-time offer.
  // Do not show a countdown or any promotional badge without an active end time.
  const limitedOffer = available && discounted && Boolean(product.offerEndsAt);
  const dark = theme === "dark";

  return (
    <article className="group flex h-full min-w-0 flex-col">
      <Link
        href={`/products/${product.slug}`}
        data-product-transition
        aria-label={`View ${product.name}`}
        className="flex h-full min-w-0 flex-col rounded-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#001cac]"
      >
        <div
          className={
            "relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-[10px] " +
            (dark ? "bg-[#292929]" : "bg-[#f0f0ee]")
          }
        >
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 639px) 46vw, (max-width: 1023px) 44vw, (max-width: 1600px) 31vw, 500px"
              className="object-contain p-2.5 transition-transform duration-500 ease-out group-hover:scale-[1.035] sm:p-4"
            />
          ) : (
            <span
              className={
                "flex h-full items-center justify-center px-3 text-center text-xs " +
                (dark ? "text-white/45" : "text-black/40")
              }
            >
              No image
            </span>
          )}

          {!available ? (
            <span className="absolute left-2 top-2 rounded-[4px] bg-[#242424] px-2 py-1 text-[9px] font-semibold uppercase tracking-[.04em] text-white sm:left-3 sm:top-3">
              Sold out
            </span>
          ) : limitedOffer ? (
            <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] rounded-[4px] bg-[#001cac] px-2 py-1 text-[9px] font-bold uppercase tracking-[.045em] text-white sm:left-3 sm:top-3 sm:text-[10px]">
              Limited offer
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0 px-0.5 pb-1 pt-3 sm:pt-4">
          {product.category ? (
            <p
              className={
                "mb-1 truncate text-[10px] font-medium uppercase tracking-[.08em] " +
                (dark ? "text-white/50" : "text-[#7c7c7c]")
              }
            >
              {product.category}
            </p>
          ) : null}

          <h3
            className={
              "m-0 line-clamp-2 min-h-[2.7em] min-w-0 break-words text-[13px] font-semibold leading-[1.35] tracking-[-.02em] sm:text-[15px] " +
              (dark ? "text-white" : "text-[#191919]")
            }
          >
            {product.name}
          </h3>

          <div className="mt-2.5 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 sm:mt-3">
            <strong
              className={
                "text-[14px] font-semibold leading-[1.4] tabular-nums sm:text-[17px] " +
                (dark ? "text-white" : "text-[#111]")
              }
            >
              {formatPrice(price)}
            </strong>
            {discounted ? (
              <del
                className={
                  "text-[11px] font-normal tabular-nums sm:text-[12px] " +
                  (dark ? "text-white/45" : "text-[#999]")
                }
              >
                {formatPrice(product.price)}
              </del>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
