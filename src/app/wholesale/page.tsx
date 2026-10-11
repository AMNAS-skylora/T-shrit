import styles from "./page.module.css";
import { getDealerProducts } from "@/lib/dealer-products";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DealerProductCatalog } from "@/components/DealerProductCatalog";
import { getCatalogProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/site-settings";
import { getWholesaleWhatsappUrl } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dealers",
  description:
    "Dealer enquiries for KLEID.IN products, minimum quantities and current availability.",
};

export const dynamic = "force-dynamic";

export default async function WholesalePage() {
  const [products, settings] = await Promise.all([
    getCatalogProducts(),
    getStoreSettings(),
  ]);

  const activeProducts = getDealerProducts(products);
  const whatsappHref = getWholesaleWhatsappUrl(settings.whatsappNumber);
  const contactHref =
    whatsappHref !== "#"
      ? whatsappHref
      : settings.supportEmail
        ? "mailto:" + settings.supportEmail
        : "/";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Dealers" },
          ]}
        />

        <section className={styles.intro}>
          <div className={styles.heading}>
            <p>DEALERS</p>
            <h1>Stock KLEID.IN.</h1>
          </div>

          <div className={styles.content}>
            <span>
              For retailers, resellers and independent stores looking for current
              availability, minimum quantities and dealer ordering.
            </span>
            <a
              href={contactHref}
              target={whatsappHref !== "#" ? "_blank" : undefined}
              rel={whatsappHref !== "#" ? "noreferrer" : undefined}
            >
              {whatsappHref !== "#" ? "Enquire on WhatsApp" : settings.supportEmail ? "Enquire by email" : "Back to home"}
            </a>
          </div>
        </section>

        <section className={styles.catalogHeading}>
          <div>
            <span>DEALER CATALOG</span>
            <h2>Available products</h2>
          </div>
          <p>{activeProducts.length} styles</p>
        </section>

        <DealerProductCatalog
          products={activeProducts}
          whatsappNumber={settings.whatsappNumber}
        />
      </div>
    </main>
  );
}
