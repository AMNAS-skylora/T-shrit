import Link from "next/link";
import type { CSSProperties } from "react";
import { getCategoryShopHref } from "@/lib/storefront-categories";
import styles from "./HomeCategoryMarquee.module.css";

export function HomeCategoryMarquee({ categories }: { categories: string[] }) {
  return (
    <section className={styles.section} aria-label="Shop by category">
      <div className={styles.inner}>
        <div className={styles.labelBlock}>
          <span className={styles.label}>Categories</span>
          <Link href="/products" className={styles.browse}>
            Browse all <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {categories.length ? (
          <div className={styles.window} aria-label="Categories - select to filter the shop">
            <div
              className={styles.track}
              style={{ "--marquee-duration": `${Math.max(18, categories.length * 5)}s` } as CSSProperties}
            >
              {[0, 1].map((repeat) => (
                <div
                  className={styles.group}
                  key={repeat}
                  aria-hidden={repeat === 1 ? true : undefined}
                >
                  {categories.map((category, index) => (
                    <Link
                      key={`${repeat}-${category}`}
                      href={getCategoryShopHref(category)}
                      className={styles.category}
                      tabIndex={repeat === 1 ? -1 : undefined}
                    >
                      <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                      <span>{category}</span>
                      <span className={styles.arrow} aria-hidden="true">↗</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className={styles.empty}>Categories will appear as they are added to the store.</p>
        )}
      </div>
    </section>
  );
}
