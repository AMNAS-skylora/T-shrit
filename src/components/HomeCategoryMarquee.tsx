import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/UiIcons";
import type { CSSProperties } from "react";
import { getCategoryShopHref } from "@/lib/storefront-categories";
import styles from "./HomeCategoryMarquee.module.css";

export function HomeCategoryMarquee({ categories }: { categories: string[] }) {
  // Fill at least a wide desktop viewport before repeating: the two groups
  // then have identical width, so translating by 50% loops without a gap.
  const approximateCycleWidth = categories.reduce(
    (total, category) => total + Math.max(125, category.length * 13 + 75),
    0,
  );
  const repetitions = categories.length
    ? Math.max(1, Math.ceil(2200 / approximateCycleWidth))
    : 0;
  const visibleItems = Array.from(
    { length: repetitions },
    (_, repeat) => categories.map((category) => ({
      category,
      key: `${repeat}-${category}`,
    })),
  ).flat();

  // Auto-scroll only, on every screen size and with either Reduce Motion
  // setting. Do not register drag/touch handlers or create a manual scroller.
  const duration = Math.max(
    30,
    Math.round((approximateCycleWidth * repetitions) / 52),
  );

  return (
    <section className={styles.section} aria-label="Shop by category">
      {visibleItems.length ? (
        <div className={styles.window} aria-label="Automatically scrolling product categories">
          <div
            className={styles.track}
            style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
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
                    <span>{category}</span>
                    <ArrowUpRightIcon width={18} height={18} />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.empty}>Categories will appear when added to the store.</p>
      )}
    </section>
  );
}
