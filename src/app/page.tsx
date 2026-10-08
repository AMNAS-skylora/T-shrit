import { getActiveHeroSlides } from "@/lib/hero";
import { HomeHeroSlider } from "@/components/HomeHeroSlider";
import { HomeAllProductsSection } from "@/components/HomeAllProductsSection";
import { getCatalogProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, settings, slides] = await Promise.all([getCatalogProducts(), getStoreSettings(), getActiveHeroSlides()]);
  const activeProducts = products.filter((product) => product.status === "active")
    .sort((a, b) => (a.sortOrder ?? a.featuredSortOrder ?? 100) - (b.sortOrder ?? b.featuredSortOrder ?? 100));
  return <div className="reference-home">
    <HomeHeroSlider settings={settings} products={activeProducts} slides={slides} initialNow={Date.now()} />
    {settings.homeCatalogEnabled ? <HomeAllProductsSection theme="dark" layout={settings.homeCatalogLayout} products={activeProducts} title={settings.homeCatalogTitle} eyebrow={settings.homeCatalogEyebrow} whatsappNumber={settings.whatsappNumber} /> : null}
  </div>;
}
