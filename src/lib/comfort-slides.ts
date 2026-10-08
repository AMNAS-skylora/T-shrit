import { normalizeHeroImagePlacement, type HeroImagePlacement } from "@/lib/hero-image-placement";
import type { HeroSection, HeroSlideConfig } from "@/data/hero-slides";
import type { Product } from "@/types/product";
import { getProductPrimaryImage } from "@/lib/product-images";

export type ComfortSlide = { id: string; title: string; subtitle: string; tickerText: string; imageUrl: string; imagePosition: "left" | "center" | "right"; imagePlacement: HeroImagePlacement; button: string; href: string; product?: Product };
export function getComfortSlides(slides: HeroSlideConfig[], products: Product[], now: number, section: HeroSection = "primary"): ComfortSlide[] {
  const active = products.filter((product) => product.status === "active");
  const result: ComfortSlide[] = [];
  for (const slide of [...slides].sort((a, b) => a.order - b.order)) {
    if (!slide.enabled || (slide.section || "primary") !== section) continue;
    const start = slide.startsAt ? Date.parse(slide.startsAt) : NaN;
    const end = slide.endsAt ? Date.parse(slide.endsAt) : NaN;
    if ((Number.isFinite(start) && now < start) || (Number.isFinite(end) && now >= end)) continue;
    const linked = active.find((product) => product.id === slide.productId);
    // A product campaign must not expose an unpublished or deleted product.
    if (slide.kind === "product" && !linked) continue;
    result.push({ id: slide.id, subtitle: slide.subtitle || "", tickerText: slide.tickerText || "", title: slide.title || linked?.name || "", imageUrl: slide.imageUrl || (linked ? getProductPrimaryImage(linked) : ""),
      imagePosition: "center", imagePlacement: normalizeHeroImagePlacement(slide.imagePlacement), button: slide.button || "Shop collection",
      href: slide.href || (linked ? "/products/" + linked.slug : "/products"), product: linked });
  }
  return result;
}
