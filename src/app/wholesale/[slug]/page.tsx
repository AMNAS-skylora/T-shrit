import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getWholesaleProductBySlug } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/site-settings";
import { getWholesaleProductWhatsappUrl } from "@/lib/format";
import { getProductPrimaryImage } from "@/lib/product-images";

export const dynamic = "force-dynamic";

type WholesaleProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: WholesaleProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getWholesaleProductBySlug(slug);

  if (!product) return { title: "Dealer product not found" };

  return {
    title: `${product.name} — Dealers`,
    description: `Dealer enquiry for ${product.name}.`,
  };
}

export default async function WholesaleProductPage({
  params,
}: WholesaleProductPageProps) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getWholesaleProductBySlug(slug),
    getStoreSettings(),
  ]);

  if (!product) notFound();

  const minimum = product.wholesaleMinOrder ?? 12;
  const whatsappHref = getWholesaleProductWhatsappUrl(
    product,
    settings.whatsappNumber,
  );
  const productImage = getProductPrimaryImage(product);

  return (
    <main className="dealer-detail-page">
      <div className="dealer-detail-shell">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Dealers", href: "/wholesale" },
            { label: product.name },
          ]}
        />

        <section className="dealer-detail-grid">
          <div className="dealer-detail-media">
            {productImage ? (
              <Image
                src={productImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 820px) 100vw, 55vw"
                className="dealer-detail-image"
              />
            ) : (
              <span>No image</span>
            )}
          </div>

          <div className="dealer-detail-info">
            <p className="dealer-detail-eyebrow">DEALER PRODUCT</p>
            <h1>{product.name}</h1>

            <div className="dealer-detail-facts">
              <div>
                <span>Minimum quantity</span>
                <strong>{minimum} pcs</strong>
              </div>
              <div>
                <span>Available colours</span>
                <strong>{product.colors.length}</strong>
              </div>
            </div>

            <div className="dealer-detail-colours">
              {product.colors.map((colour) => (
                <span key={colour}>{colour}</span>
              ))}
            </div>

            {whatsappHref !== "#" && product.status !== "sold-out" ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="dealer-detail-whatsapp"
              >
                Enquire on WhatsApp
              </a>
            ) : (
              <button className="dealer-detail-whatsapp is-disabled" disabled>
                WhatsApp unavailable
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
