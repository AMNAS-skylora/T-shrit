import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { getCatalogProductBySlug } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product =
    await getCatalogProductBySlug(slug);

  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [catalogProduct, settings] = await Promise.all([
    getCatalogProductBySlug(slug),
    getStoreSettings(),
  ]);
  const product = catalogProduct;

  if (!product || product.status === "draft") notFound();

  return (
    <>
      <div className="product-breadcrumb-shell">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/#all-products" },
            { label: product.name },
          ]}
        />
      </div>

      <section className="product-page product-page-premium">
        <ProductDetailClient
          product={product}
          whatsappNumber={settings.whatsappNumber}
        />
      </section>
    </>
  );
}
