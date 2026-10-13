import Link from "next/link";
import { getDealerProducts } from "@/lib/dealer-products";
import { getWholesaleWhatsappUrl } from "@/lib/format";
import type { Product } from "@/types/product";
import styles from "./HomeDealersSection.module.css";

export function HomeDealersSection({ products, whatsappNumber, enabled }: { products: Product[]; whatsappNumber: string; enabled: boolean }) {
  if (!enabled) return (
    <section id="everyday-style" aria-labelledby="everyday-style-title" className={`${styles.section} ${styles.everydayBlue}`}>
      <div className={styles.layout}>
        <div className={styles.everydayIntro}>
          <p className={styles.eyebrow}>KLEID.IN / EVERYDAY</p>
          <h2 id="everyday-style-title" className={styles.title}>Simple pieces.<br />Your own style.</h2>
          <p className={styles.body}>A wardrobe starts with the pieces you love wearing. Find your colours, choose your fit and make every outfit feel like you.</p>
        </div>
        <div className={styles.details}>
          {[
            { number: "01", title: "Wear it your way", copy: "Keep it simple or layer it up. Let your everyday look reflect your own style." },
            { number: "02", title: "Find your colour", copy: "Start with familiar shades or try something different. Build combinations that feel right for you." },
            { number: "03", title: "Choose your fit", copy: "Explore the size and product details to find the piece that belongs in your wardrobe." },
          ].map((point) => (
            <div key={point.number} className={styles.everydayFeature}>
              <span className={styles.featureNumber} aria-hidden="true">{point.number}</span>
              <div className={styles.featureCopy}>
                <h3>{point.title}</h3>
                <p>{point.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
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
