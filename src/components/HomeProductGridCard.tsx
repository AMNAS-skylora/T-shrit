"use client";

import { useOfferClock } from "@/hooks/useOfferClock";
import { getProductOfferPrice, isProductOfferActive } from "@/lib/product-offers";
import { OfferCountdown } from "@/components/OfferCountdown";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, getProductWhatsappUrl } from "@/lib/format";
import { getProductPrimaryImage } from "@/lib/product-images";
import type { Product } from "@/types/product";

export function HomeProductGridCard({
  theme = "light",
  product,
  whatsappNumber,
}: {
  theme?: "light" | "dark";
  product: Product;
  whatsappNumber: string;
}) {
  const image = getProductPrimaryImage(product);
  const now = useOfferClock(product);
  const offerActive = isProductOfferActive(product, now);
  const price = getProductOfferPrice(product, now);
  const available = product.status === "active" && product.stock > 0;
  const whatsappHref = available ? getProductWhatsappUrl(product, whatsappNumber) : "#";
  const productHref = "/products/" + product.slug;
  const statusText = !available ? "Sold out" : offerActive ? "Offer" : null;

  return (
    <article
      className={
        "group flex h-full min-w-0 flex-col overflow-hidden rounded-[12px] border " +
        (theme === "dark"
          ? "border-white/15 bg-[#191919]"
          : "border-black/[.07] bg-white")
      }
    >
      <Link
        href={productHref}
        data-product-transition
        aria-label={"View " + product.name}
        className="relative block aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#f2f2ef]"
      >
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 639px) 46vw, (max-width: 1023px) 44vw, (max-width: 1600px) 31vw, 500px"
            className="object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-[1.035] sm:p-4"
          />
        ) : (
          <span className="flex h-full items-center justify-center px-2 text-center text-xs text-black/45">
            No image
          </span>
        )}
        {statusText ? (
          <span
            className={
              "absolute left-2 top-2 max-w-[90%] rounded-sm px-2 py-1 text-[9px] font-semibold uppercase tracking-[.06em] sm:left-3 sm:top-3 sm:text-[10px] " +
              (!available ? "bg-[#252525] text-white" : "bg-white/95 text-[#001cac]")
            }
          >
            {statusText}
          </span>
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col px-2.5 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
        {product.category ? (
          <p
            className={
              "mb-1 truncate text-[9px] font-medium uppercase tracking-[.08em] sm:text-[10px] " +
              (theme === "dark" ? "text-white/55" : "text-[#737373]")
            }
          >
            {product.category}
          </p>
        ) : null}

        <h3
          className={
            "m-0 min-h-[2.8em] min-w-0 overflow-hidden text-[12px] font-semibold leading-[1.4] tracking-[-.015em] sm:text-sm " +
            (theme === "dark" ? "text-white" : "text-[#111]")
          }
        >
          <Link
            href={productHref}
            data-product-transition
            className="line-clamp-2 break-words hover:underline"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <strong
            className={
              "text-[13px] font-semibold tabular-nums sm:text-base " +
              (theme === "dark" ? "text-white" : "text-[#111]")
            }
          >
            {formatPrice(price)}
          </strong>
          {offerActive && product.price > price ? (
            <del
              className={
                "text-[10px] tabular-nums sm:text-xs " +
                (theme === "dark" ? "text-white/50" : "text-[#8b8b8b]")
              }
            >
              {formatPrice(product.price)}
            </del>
          ) : null}
        </div>

        <div className="min-w-0">
          <OfferCountdown product={product} now={now} theme={theme} compact />
        </div>

        <div className="mt-auto pt-3 sm:pt-4">
          <a
            href={whatsappHref}
            target={whatsappHref === "#" ? undefined : "_blank"}
            rel={whatsappHref === "#" ? undefined : "noopener noreferrer"}
            aria-disabled={whatsappHref === "#" ? "true" : undefined}
            onClick={(event) => {
              if (whatsappHref === "#") event.preventDefault();
            }}
            className={
              "home-product-whatsapp-button inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-full px-2 text-center text-[10px] font-semibold uppercase tracking-[.025em] transition-opacity sm:px-3 sm:text-[11px] " +
              (theme === "dark"
                ? "border border-white/30 bg-white !text-black "
                : "bg-black !text-white ") +
              (whatsappHref === "#"
                ? "cursor-default opacity-60"
                : "hover:opacity-85")
            }
            aria-label={"Order " + product.name + " on WhatsApp"}
          >
            {available ? (whatsappHref === "#" ? "Unavailable" : "WhatsApp") : "Sold out"}
          </a>
        </div>
      </div>
    </article>
  );
}
