import type { Metadata } from "next";
import { CartPage } from "@/components/CartPage";
import { getCatalogProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shopping bag",
  robots: { index: false, follow: false },
};

export default async function ShoppingBagPage() {
  const [products, settings] = await Promise.all([
    getCatalogProducts(),
    getStoreSettings(),
  ]);
  return <CartPage products={products} whatsappNumber={settings.whatsappNumber} />;
}
