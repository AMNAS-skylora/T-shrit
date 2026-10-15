import { getActiveHeroSlides } from "@/lib/hero";
import { HomeDealersSection } from "@/components/HomeDealersSection";
import { HomeSpotlightSection } from "@/components/HomeSpotlightSection";
import { FeaturedProductMotion } from "@/components/FeaturedProductMotion";
import { HomeAboutSection } from "@/components/HomeAboutSection";
import { HomeHeroSlider } from "@/components/HomeHeroSlider";
import { StaticEditorialHero } from "@/components/StaticEditorialHero";
import { HomeCategoryMarquee } from "@/components/HomeCategoryMarquee";
import { HomeAllProductsSection } from "@/components/HomeAllProductsSection";
import { getCatalogProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/site-settings";
import { getMongoEnvironment } from "@/lib/server-env";
import { listCategories } from "@/lib/mongodb-categories";
import { getStorefrontCategories } from "@/lib/storefront-categories";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, settings, slides, savedCategories] = await Promise.all([
    getCatalogProducts(),
    getStoreSettings(),
    getActiveHeroSlides(),
    getMongoEnvironment() ? listCategories() : Promise.resolve([]),
  ]);
  const activeProducts = products.filter((product) => product.status === "active")
    .sort((a, b) => (a.sortOrder ?? a.featuredSortOrder ?? 100) - (b.sortOrder ?? b.featuredSortOrder ?? 100));
  return <div className="reference-home">
    <StaticEditorialHero photos={settings.homeEditorialPhotos} />
    <HomeCategoryMarquee categories={getStorefrontCategories(activeProducts, savedCategories)} />
    <HomeHeroSlider section="secondary" settings={settings} products={activeProducts} slides={slides} initialNow={Date.now()} />
    <HomeHeroSlider section="tertiary" settings={settings} products={activeProducts} slides={slides} initialNow={Date.now()} />
    <FeaturedProductMotion products={activeProducts} layout={settings.homeFeaturedLayout} />
    <HomeAboutSection />
    {settings.homeCatalogEnabled ? <HomeAllProductsSection theme="light" layout={settings.homeCatalogLayout} products={activeProducts} title={settings.homeCatalogTitle} eyebrow={settings.homeCatalogEyebrow} whatsappNumber={settings.whatsappNumber} /> : null}
    <HomeDealersSection enabled={settings.homeDealersEnabled} products={products} whatsappNumber={settings.whatsappNumber} />
    <HomeSpotlightSection product={activeProducts.find((product) => product.spotlight)} badge="Single product spotlight" />
  </div>;
}
