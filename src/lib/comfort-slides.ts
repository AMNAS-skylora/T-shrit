import type { HeroSlideConfig } from "@/data/hero-slides";
import type { StoreSettings } from "@/types/commerce";
import type { Product } from "@/types/product";
import { getProductPrimaryImage } from "@/lib/product-images";

export type ComfortSlide = { id: string; title: string; imageUrl: string; imagePosition: "left" | "center" | "right"; button: string; href: string; product?: Product };
export function getComfortSlides(settings: StoreSettings, slides: HeroSlideConfig[], products: Product[], now: number): ComfortSlide[] {
  const active = products.filter((product) => product.status === "active");
  const candidates = active.filter((product) => getProductPrimaryImage(product));
  const spotlight = candidates.find((product) => product.spotlight) || candidates[0];
  const result: ComfortSlide[] = settings.homeDefaultHeroEnabled ? [{
    id: "default", title: settings.homeDefaultHeroTitle, imageUrl: settings.homeDefaultHeroImageUrl,
    imagePosition: settings.homeDefaultHeroImagePosition, button: settings.homeDefaultHeroButtonLabel || "Shop collection",
    href: settings.homeDefaultHeroButtonHref || "/products", product: spotlight,
  }] : [];
  for (const slide of [...slides].sort((a, b) => a.order - b.order)) {
    if (!slide.enabled) continue;
    const start = slide.startsAt ? Date.parse(slide.startsAt) : NaN;
    const end = slide.endsAt ? Date.parse(slide.endsAt) : NaN;
    if ((Number.isFinite(start) && now < start) || (Number.isFinite(end) && now >= end)) continue;
    const linked = active.find((product) => product.id === slide.productId);
    // A product campaign must not expose an unpublished or deleted product.
    if (slide.kind === "product" && !linked) continue;
    result.push({ id: slide.id, title: slide.title || linked?.name || "", imageUrl: slide.imageUrl || (linked ? getProductPrimaryImage(linked) : ""),
      imagePosition: slide.imagePosition || "center", button: slide.button || "Shop collection",
      href: slide.href || (linked ? "/products/" + linked.slug : "/products"), product: linked });
  }
  return result;
}
