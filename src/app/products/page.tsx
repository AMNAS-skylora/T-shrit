import { HomeProductCatalog } from "@/components/HomeProductCatalog";
import { getStoreSettings } from "@/lib/site-settings";
import { getCatalogProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop" };

export default async function ProductsPage() {
  const [catalog, settings] = await Promise.all([getCatalogProducts(), getStoreSettings()]);
  const products = catalog.filter((product) => product.status !== "draft");
  return <HomeProductCatalog whatsappNumber={settings.whatsappNumber} products={products} eyebrow="KLEID.IN / COLLECTION" title="Shop everyday essentials" />;
}
