import { getActiveHeroSlides } from "@/lib/hero";
import { getActiveAnimationBars } from "@/lib/animation-bars";
import { HomepageAnimationBars } from "@/components/HomepageAnimationBars";
import { TopFashionHero } from "@/components/TopFashionHero";
import { AutoOutfitHero } from "@/components/AutoOutfitHero";
import { FeaturedProductMotion } from "@/components/FeaturedProductMotion";
import { HomeAboutSection } from "@/components/HomeAboutSection";
import { HomeAllProductsSection } from "@/components/HomeAllProductsSection";
import { HomeDealerSection } from "@/components/HomeDealerSection";
import { HomeSpotlightSection } from "@/components/HomeSpotlightSection";
import { getCatalogProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

function productSlugFromUrl(value: string) {
  const input = value.trim();
  if (!input) return "";

  try {
    const url = new URL(input, "https://kleid.in");
    const parts = url.pathname.split("/").filter(Boolean);
    const productsIndex = parts.lastIndexOf("products");

    if (productsIndex >= 0 && parts[productsIndex + 1]) {
      return decodeURIComponent(parts[productsIndex + 1]).toLowerCase();
    }

    return decodeURIComponent(parts.at(-1) || "").toLowerCase();
  } catch {
    return input
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean)
      .at(-1)
      ?.toLowerCase() || "";
  }
}

export default async function Home() {
  const [products, settings, heroSlides, animationBars] = await Promise.all([
    getCatalogProducts(),
    getStoreSettings(),
    getActiveHeroSlides(),
    getActiveAnimationBars(),
  ]);

  const activeProducts = products
    .filter((product) => product.status === "active")
    .sort(
      (a, b) =>
        (a.sortOrder ?? a.featuredSortOrder ?? 100) -
        (b.sortOrder ?? b.featuredSortOrder ?? 100),
    );

  const requestedShowcaseSlugs = settings.homeShowcaseProductUrls
    .map(productSlugFromUrl)
    .filter(Boolean)
    .slice(0, 8);

  const activeBySlug = new Map(
    activeProducts.map((product) => [product.slug.toLowerCase(), product]),
  );

  const linkedShowcaseProducts = requestedShowcaseSlugs
    .map((slug) => activeBySlug.get(slug))
    .filter((product): product is (typeof activeProducts)[number] =>
      Boolean(product),
    );

  const linkedIds = new Set(
    linkedShowcaseProducts.map((product) => product.id),
  );

  const showcaseProducts = [
    ...linkedShowcaseProducts,
    ...activeProducts.filter((product) => !linkedIds.has(product.id)),
  ].slice(0, 20);

  const featuredProducts = activeProducts.filter((product) => product.featuredAnimationEnabled || product.featured)
    .sort((a, b) => (a.animationSortOrder ?? a.featuredSortOrder ?? 100) - (b.animationSortOrder ?? b.featuredSortOrder ?? 100));
  const customSlides = heroSlides.filter((slide) => slide.kind !== "product").slice(0, 5);
  const productSlides = heroSlides.filter((slide) => slide.kind === "product");

  const mostLoved = products.find(
    (product) => product.spotlight && product.status === "active",
  );
  return (
    <div className="reference-home">
      {settings.homeAnimationBarsEnabled ? <HomepageAnimationBars bars={animationBars} placement="before-hero" /> : null}
      {settings.homeProductHeroEnabled && settings.homeProductSelectorEnabled ? <AutoOutfitHero products={showcaseProducts} /> : null}
      {settings.homeProductHeroEnabled && productSlides.length ? <TopFashionHero products={activeProducts} heroSlides={productSlides} /> : null}
      {settings.homeAnimationBarsEnabled ? <HomepageAnimationBars bars={animationBars} placement="after-hero" /> : null}

      {settings.homeCustomOffersEnabled && customSlides.length ? <TopFashionHero products={[]} heroSlides={customSlides} fullscreen /> : null}

      {settings.homeFeaturedEnabled ? <FeaturedProductMotion products={featuredProducts} /> : null}

      {settings.homeAboutEnabled ? <HomeAboutSection settings={settings} /> : null}


      {settings.homeCatalogEnabled ? <HomeAllProductsSection products={activeProducts} title={settings.homeCatalogTitle} eyebrow={settings.homeCatalogEyebrow} whatsappNumber={settings.whatsappNumber} /> : null}

      {settings.homeDealersEnabled ? <HomeDealerSection settings={settings} /> : null}

      {settings.homeSpotlightEnabled ? <HomeSpotlightSection
        product={mostLoved}
        badge={settings.homeSpotlightBadge}
      /> : null}
    </div>
  );
}
