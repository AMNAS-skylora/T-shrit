import { requireAdminPage } from "@/lib/admin-auth";
import { getProductPrimaryImage } from "@/lib/product-images";
import { getCatalogProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/site-settings";
import { getActiveHeroSlides } from "@/lib/hero";
import { normalizeHomepageLayouts } from "@/lib/homepage-layouts";
import { TopFashionHero } from "@/components/TopFashionHero";
import { HomeAllProductsSection } from "@/components/HomeAllProductsSection";
import { FeaturedProductMotion } from "@/components/FeaturedProductMotion";
export const dynamic = "force-dynamic";

export default async function LayoutPreview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPage();
  const params = await searchParams;
  const layouts = normalizeHomepageLayouts(params);
  const [products, settings, slides] = await Promise.all([getCatalogProducts(), getStoreSettings(), getActiveHeroSlides()]);
  const featured = products.filter((product) => (product.featuredAnimationEnabled || product.featured) && Boolean(getProductPrimaryImage(product)));
  const empty = <p className="p-8 text-sm text-black/55">Add published content to see this layout with your images and products. The layout cards show its structure.</p>;
  return <main className="bg-white text-black">
    <p className="border-b border-black/10 px-4 py-3 text-xs font-semibold">Layout preview · Unsaved selection</p>
    {params.section === "homeHeroLayout" ? (slides.length ? <TopFashionHero products={products} heroSlides={slides} fullscreen={layouts.homeHeroLayout === "immersive" || (layouts.homeHeroLayout === "original" && slides[0]?.kind !== "product")} /> : empty) : null}
    {params.section === "homeCatalogLayout" ? <HomeAllProductsSection products={products} layout={layouts.homeCatalogLayout} title={settings.homeCatalogTitle} eyebrow={settings.homeCatalogEyebrow} whatsappNumber={settings.whatsappNumber} /> : null}
    {params.section === "homeFeaturedLayout" ? (featured.length ? <FeaturedProductMotion products={featured} layout={layouts.homeFeaturedLayout} /> : empty) : null}
  </main>;
}
