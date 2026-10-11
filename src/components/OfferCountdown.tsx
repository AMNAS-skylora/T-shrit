import { getProductOfferCountdown } from "@/lib/product-offers";
import type { Product } from "@/types/product";
import styles from "./OfferCountdown.module.css";

export function OfferCountdown({ product, now, theme = "light" }: {
  product: Product;
  now: number;
  theme?: "light" | "dark";
}) {
  const remaining = getProductOfferCountdown(product, now);
  if (!remaining) return null;
  const values = remaining.split(" ").map(value => value.slice(0, -1));

  return <div className={styles.timer} data-theme={theme} role="timer" aria-live="off" aria-label={`Offer ends in ${remaining}`}>
    <span className={styles.heading} aria-hidden="true">Offer ends in</span>
    <div className={styles.units} aria-hidden="true">
      {["Days", "Hours", "Min", "Sec"].map((label, index) => <span className={styles.unit} key={label}>
        <strong>{values[index].padStart(2, "0")}</strong>
        <small>{label}</small>
      </span>)}
    </div>
  </div>;
}
