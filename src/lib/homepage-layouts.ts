export const homepageLayoutGroups = [
  { key: "homeHeroLayout", title: "Hero section", options: [
    { value: "original", name: "Original", description: "Keep the current product and offer presentation." },
    { value: "split", name: "Split editorial", description: "Text and image side by side, stacked on mobile." },
    { value: "immersive", name: "Full-screen", description: "Large background image with text overlay." },
  ] },
  { key: "homeCatalogLayout", title: "Product catalog", options: [
    { value: "grid", name: "Classic grid", description: "Four columns on desktop, two on mobile." },
    { value: "rail", name: "Horizontal scroll", description: "Swipe through cards with scroll snapping." },
    { value: "editorial", name: "Large editorial", description: "Larger cards in a spacious two-column grid." },
  ] },
  { key: "homeFeaturedLayout", title: "Featured products", options: [
    { value: "motion", name: "Animated showcase", description: "Products rotate with image and text movement." },
    { value: "static", name: "Still spotlight", description: "Feature the first selected product without movement." },
  ] },
] as const;

export type HomepageLayouts = {
  homeHeroLayout: "original" | "split" | "immersive";
  homeCatalogLayout: "grid" | "rail" | "editorial";
  homeFeaturedLayout: "motion" | "static";
};
export function normalizeHomepageLayouts(source: Record<string, unknown>): HomepageLayouts {
  return {
    homeHeroLayout: source.homeHeroLayout === "split" || source.homeHeroLayout === "immersive" ? source.homeHeroLayout : "original",
    homeCatalogLayout: source.homeCatalogLayout === "rail" || source.homeCatalogLayout === "editorial" ? source.homeCatalogLayout : "grid",
    homeFeaturedLayout: source.homeFeaturedLayout === "static" ? "static" : "motion",
  };
}
