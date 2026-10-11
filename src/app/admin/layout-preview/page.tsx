import { requireAdminPage } from "@/lib/admin-auth";
import { getCatalogProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/site-settings";
import { getActiveHeroSlides } from "@/lib/hero";
import { normalizeHomepageLayouts } from "@/lib/homepage-layouts";
import { HomeHeroSlider } from "@/components/HomeHeroSlider";
import { FeaturedProductMotion } from "@/components/FeaturedProductMotion";
import { getFeaturedProducts } from "@/lib/featured-products";
import { HomeAllProductsSection } from "@/components/HomeAllProductsSection";
export const dynamic = "force-dynamic";

export default async function LayoutPreview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPage();
  const params = await searchParams;
  const layouts = normalizeHomepageLayouts(params);
  const [products, settings, slides] = await Promise.all([getCatalogProducts(), getStoreSettings(), getActiveHeroSlides()]);
  return <main className="bg-white text-black">
    <p className="border-b border-black/10 px-4 py-3 text-xs font-semibold">Layout preview · Unsaved selection</p>
    {params.section === "homeHeroLayout" ? <HomeHeroSlider settings={settings} products={products} slides={slides} initialNow={Date.now()} preview /> : null}
    {params.section === "homeCatalogLayout" ? <HomeAllProductsSection theme="light" products={products} layout={layouts.homeCatalogLayout} title={settings.homeCatalogTitle} eyebrow={settings.homeCatalogEyebrow} whatsappNumber={settings.whatsappNumber} /> : null}
    {params.section === "homeFeaturedLayout" ? getFeaturedProducts(products).length ? <FeaturedProductMotion products={products} layout={layouts.homeFeaturedLayout} /> : <p className="p-6 text-sm">Enable Featured product on an active product with an image to preview this section.</p> : null}
  </main>;
}
