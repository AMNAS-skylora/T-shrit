import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { getWholesaleProductWhatsappUrl } from "@/lib/format";
import { getProductPrimaryImage } from "@/lib/product-images";

export function WholesaleProductCard({
  product,
  whatsappNumber,
}: {
  product: Product;
  whatsappNumber: string;
}) {
  const soldOut = product.status === "sold-out" || product.stock <= 0;
  const minOrder = product.wholesaleMinOrder ?? 12;
  const enquiryHref = getWholesaleProductWhatsappUrl(product, whatsappNumber);
  const wholesaleSlug = product.wholesaleSlug ?? `${product.slug}-dealer`;
  const productImage = getProductPrimaryImage(product);

  return (
    <article className="product-card product-card-refined dealer-unified-card">
      <div className="product-visual product-card-visual-refined">
        <Link
          href={`/wholesale/${wholesaleSlug}`}
          className="product-card-image-link"
          aria-label={product.name}
        >
          {productImage ? (
            <Image
              src={productImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 980px) 33vw, 25vw"
              className="product-image product-card-image-refined"
            />
          ) : (
            <span className="product-image-empty">No image</span>
          )}
        </Link>

        <div className="product-card-badges">
          <span className="product-card-status">
            {soldOut ? "Unavailable" : "Dealer order"}
          </span>
        </div>
      </div>

      <div className="product-card-info product-card-info-refined">
        <Link href={`/wholesale/${wholesaleSlug}`} className="product-name">
          {product.name}
        </Link>

        <div className="dealer-unified-meta">
          <span>Minimum order</span>
          <strong>{minOrder} pcs</strong>
        </div>

        <div className="product-card-stock-row">
          <span
            className={
              "product-card-stock-dot " + (soldOut ? "sold-out" : "in-stock")
            }
            aria-hidden="true"
          />
          <span>{soldOut ? "Unavailable" : `Stock ${product.stock}`}</span>
        </div>

        {soldOut || enquiryHref === "#" ? (
          <button
            type="button"
            className="product-whatsapp-cta is-disabled"
            disabled
          >
            {soldOut ? "Unavailable" : "WhatsApp unavailable"}
          </button>
        ) : (
          <a
            href={enquiryHref}
            target="_blank"
            rel="noreferrer"
            className="product-whatsapp-cta"
          >
            Enquire on WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}
