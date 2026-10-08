import { HomeProductCatalog } from "@/components/HomeProductCatalog";
import { getCatalogProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop" };

export default async function ProductsPage() {
  const catalog = await getCatalogProducts();
  const products = catalog.filter((product) => product.status !== "draft");
  return <HomeProductCatalog products={products} eyebrow="KLEID.IN / COLLECTION" title="Shop everyday essentials" />;
}
