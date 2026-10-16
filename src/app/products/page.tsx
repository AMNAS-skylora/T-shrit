import { HomeProductCatalog } from "@/components/HomeProductCatalog";
import { getStoreSettings } from "@/lib/site-settings";
import { getCatalogProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const [catalog, settings, params] = await Promise.all([
    getCatalogProducts(),
    getStoreSettings(),
    searchParams,
  ]);
  const selectedCategory = Array.isArray(params.category)
    ? params.category[0] ?? "All"
    : params.category || "All";
  const products = catalog.filter((product) => product.status !== "draft");
  return <HomeProductCatalog whatsappNumber={settings.whatsappNumber} products={products} initialCategory={selectedCategory} title="Shop everyday essentials" />;
}
