import Link from "next/link";
import type { CSSProperties } from "react";
import { getCategoryShopHref } from "@/lib/storefront-categories";
import styles from "./HomeCategoryMarquee.module.css";

export function HomeCategoryMarquee({ categories }: { categories: string[] }) {
  // A continuously moving track on desktop, with real native touch scrolling
  // on mobile so a visitor can reach every category using a finger.
  const approximateCycleWidth = categories.reduce(
    (total, category) => total + Math.max(125, category.length * 13 + 75),
    0,
  );
  const repetitions = categories.length
    ? Math.max(1, Math.ceil(2200 / approximateCycleWidth))
    : 0;
  const visibleItems = Array.from(
    { length: repetitions },
    (_, repeat) => categories.map((category) => ({ category, key: `${repeat}-${category}` })),
  ).flat();

  return (
    <section className={styles.section} aria-label="Shop by category">
      {categories.length ? (
        <>
          <div className={styles.window} aria-label="Browse categories">
            <div
              className={styles.track}
              style={{ "--marquee-duration": `${Math.max(30, visibleItems.length * 3.5)}s` } as CSSProperties}
            >
              {[0, 1].map((copy) => (
                <div
                  className={styles.group}
                  key={copy}
                  aria-hidden={copy === 1 ? true : undefined}
                >
                  {visibleItems.map(({ category, key }) => (
                    <Link
                      key={`${copy}-${key}`}
                      href={getCategoryShopHref(category)}
                      className={styles.category}
                      tabIndex={copy === 1 ? -1 : undefined}
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <nav
            className={styles.mobileScroll}
            aria-label="Swipe horizontally to browse product categories"
          >
            <div className={styles.mobileGroup}>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={getCategoryShopHref(category)}
                  className={styles.category}
                >
                  {category}
                </Link>
              ))}
            </div>
          </nav>
        </>
      ) : (
        <p className={styles.empty}>Categories will appear when added to the store.</p>
      )}
    </section>
  );
}
