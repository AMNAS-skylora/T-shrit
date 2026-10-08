"use client";

import { useOfferClock } from "@/hooks/useOfferClock";
import { getProductOfferPrice, isProductOfferActive } from "@/lib/product-offers";
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

  return (
    <article className="group relative min-w-0">
      <Link
        href={"/products/" + product.slug}
        className="absolute inset-0 z-10"
        data-product-transition
        aria-label={"View " + product.name}
      />

      <div className="relative aspect-[4/5] overflow-hidden bg-[#f1f1ef]">
        {image ? <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
          className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.025]"
        /> : <span className="flex h-full items-center justify-center text-xs text-black/50">No image</span>}
      </div>

      <div className="pt-3">
        <h3 className={"m-0 min-h-[2.5em] text-[11px] font-semibold tracking-[-.01em] sm:text-[12px] " + (theme === "dark" ? "text-white" : "text-[#111]")}>
          {product.name}
        </h3>

        <p className={"mt-1 text-[10px] font-medium sm:text-[11px] " + (theme === "dark" ? "text-white/65" : "text-black/52")}>
          {formatPrice(price)}
          {offerActive ? <del className={"ml-2 " + (theme === "dark" ? "text-white/45" : "text-black/35")}>{formatPrice(product.price)}</del> : null}
        </p>

        <a
          href={whatsappHref}
          target={whatsappHref === "#" ? undefined : "_blank"}
          rel={whatsappHref === "#" ? undefined : "noreferrer"}
          aria-disabled={whatsappHref === "#" ? "true" : undefined}
          onClick={(event) => { if (whatsappHref === "#") event.preventDefault(); }}
          className={
            "home-product-whatsapp-button relative z-20 mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full px-3 text-[8px] font-semibold uppercase tracking-[.07em] transition sm:min-h-11 sm:text-[9px] " +
            (theme === "dark" ? "border border-white/30 bg-white !text-black " : "bg-black !text-white ") +
            (whatsappHref === "#"
              ? "cursor-default opacity-70"
              : "hover:opacity-90")
          }
          aria-label={"Order " + product.name + " on WhatsApp"}
        >
          {available ? (whatsappHref === "#" ? "Unavailable" : "WhatsApp") : "Sold out"}
        </a>
      </div>
    </article>
  );
}
