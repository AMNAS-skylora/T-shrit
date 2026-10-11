"use client";

import { useMemo, useState } from "react";
import { HomeProductGridCard } from "@/components/HomeProductGridCard";
import styles from "./HomeProductGrid.module.css";
import catalogStyles from "./HomeProductCatalog.module.css";
import type { Product } from "@/types/product";

export function HomeProductCatalog({
  products,
  eyebrow,
  title,
  whatsappNumber,
}: {
  products: Product[];
  eyebrow: string;
  title: string;
  whatsappNumber: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const activeProducts = useMemo(
    () => products.filter((product) => product.status !== "draft"),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return activeProducts.filter((product) =>
      (category === "All" || product.category === category) &&
      (!term ||
      [
        product.name,
        product.sku,
        product.category,
        ...product.colors,
        ...product.sizes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)),
    );
  }, [activeProducts, query, category]);

  return (
    <section id="shop-products" data-shop-reveal className={catalogStyles.section} aria-label="Product catalog">
      <div className={catalogStyles.heading}>
        <div>
          <p className={catalogStyles.eyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
        </div>

      </div>

      <div className={catalogStyles.toolbar}>
        <div className={catalogStyles.search}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, category, colour or size"
            aria-label="Search products"
            className={catalogStyles.input}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className={catalogStyles.clear}
              aria-label="Clear product search"
            >
              ×
            </button>
          ) : null}
        </div>

        <span className={catalogStyles.count}>
          {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className={catalogStyles.filters} aria-label="Filter products by category">
        {["All", ...Array.from(new Set(activeProducts.map((product) => product.category).filter(Boolean)))].map((item) => (
          <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </div>
      {filteredProducts.length ? (
        <div className={"mt-5 " + styles.grid}>
          {filteredProducts.map((product) => (
            <HomeProductGridCard key={product.id} product={product} whatsappNumber={whatsappNumber} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[16px] bg-[#f5f5f5] px-5 py-10 text-center">
          <strong className="text-[12px] font-semibold">{activeProducts.length ? "No products found" : "The collection is coming soon"}</strong>
          <p className="mt-1.5 text-[10px] text-black/45">
            {activeProducts.length ? "Try another product name, category, colour or size." : "Check back soon for our latest pieces."}
          </p>
        </div>
      )}
    </section>
  );
}
