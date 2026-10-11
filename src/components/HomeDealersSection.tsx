import Link from "next/link";
import { getDealerProducts } from "@/lib/dealer-products";
import { getWholesaleWhatsappUrl } from "@/lib/format";
import type { Product } from "@/types/product";
import styles from "./HomeDealersSection.module.css";

export function HomeDealersSection({ products, whatsappNumber }: { products: Product[]; whatsappNumber: string }) {
  if (!getDealerProducts(products).length) return null;
  const whatsappHref = getWholesaleWhatsappUrl(whatsappNumber);
  return <section id="dealers" aria-labelledby="home-dealers-title" className={styles.section}>
    <div className={styles.layout}>
      <div>
        <p className={styles.eyebrow}>DEALERS</p>
        <h2 id="home-dealers-title" className={styles.title}>Bring KLEID.IN.<br />to your store.</h2>
        <p className={styles.body}>For retailers, resellers and independent stores. Explore our dealer catalog and get in touch to discuss the styles, quantities and availability for your next order.</p>
        <div className={styles.actions}>
          <Link href="/wholesale" className={styles.primary}>Explore dealer catalog ↗</Link>
          {whatsappHref !== "#" ? <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.secondary}>Contact us on WhatsApp ↗</a> : null}
        </div>
      </div>
      <div className={styles.details}>
        <div><h3>Find your styles</h3><p>Browse the dedicated dealer catalog for the products available to your business.</p></div>
        <div><h3>Plan your quantity</h3><p>Check dealer prices and minimum order quantities for each product.</p></div>
        <div><h3>Talk to us</h3><p>Confirm colours, sizes, current stock and delivery details before placing your order.</p></div>
      </div>
    </div>
  </section>;
}
