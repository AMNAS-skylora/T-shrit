"use client";

import styles from "./HomeProductCatalog.module.css";
import { useMemo, useState } from "react";
import { WholesaleProductCard } from "@/components/WholesaleProductCard";
import type { Product } from "@/types/product";

export function DealerProductCatalog({
  products,
  whatsappNumber,
}: {
  products: Product[];
  whatsappNumber: string;
}) {
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(products.map((product) => product.category).filter(Boolean)),
      ),
    ],
    [products],
  );

  const visibleProducts = useMemo(
    () =>
      category === "All"
        ? products
        : products.filter((product) => product.category === category),
    [category, products],
  );

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.filters} aria-label="Filter dealer products by category">
          {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        <span className={styles.count} role="status">{visibleProducts.length} product{visibleProducts.length === 1 ? "" : "s"}</span>
      </div>
      {!visibleProducts.length ? <div className="mb-6 rounded-xl bg-[#f5f5f5] px-5 py-10 text-center"><p className="text-sm font-semibold">No dealer products available</p><p className="mt-2 text-xs text-black/50">{products.length ? "Choose another category." : "Contact us for current availability and dealer ordering."}</p></div> : null}

      <section
        className="dealer-product-grid dealer-product-grid-unified"
        aria-label="Dealer products"
      >
        {visibleProducts.map((product) => (
          <WholesaleProductCard
            key={product.id}
            product={product}
            whatsappNumber={whatsappNumber}
          />
        ))}
      </section>
    </>
  );
}
