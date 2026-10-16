"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCategoryShopHref, getStorefrontCategories, productMatchesCategory } from "@/lib/storefront-categories";
import { HomeProductGridCard } from "@/components/HomeProductGridCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import breadcrumbStyles from "@/components/StoreBreadcrumbs.module.css";
import styles from "./HomeProductGrid.module.css";
import catalogStyles from "./HomeProductCatalog.module.css";
import type { Product } from "@/types/product";

export function HomeProductCatalog({
  products,
  eyebrow,
  title,
  whatsappNumber,
  initialCategory = "All",
}: {
  products: Product[];
  eyebrow?: string;
  title: string;
  whatsappNumber: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  const activeProducts = useMemo(
    () => products.filter((product) => product.status !== "draft"),
    [products],
  );

  const categoryOptions = useMemo(() => {
    const names = getStorefrontCategories(activeProducts);
    const hasSelected = names.some((name) =>
      name.toLocaleLowerCase() === category.trim().toLocaleLowerCase()
    );
    if (category.trim().toLocaleLowerCase() !== "all" && !hasSelected && category.trim()) {
      names.push(category.trim());
    }
    return ["All", ...names];
  }, [activeProducts, category]);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return activeProducts.filter((product) =>
      productMatchesCategory(product.category, category) &&
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
      <div className={`${breadcrumbStyles.bar} ${breadcrumbStyles.catalog}`}>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      </div>
      <div className={catalogStyles.heading}>
        {eyebrow ? <p className={catalogStyles.eyebrow}>{eyebrow}</p> : null}
        <h1>{title}</h1>
      </div>

      <div className={catalogStyles.toolbar}>
        <div className={catalogStyles.search} role="search" aria-label="Search the product catalog">
          <svg className={catalogStyles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products..."
            aria-label="Search products by name, category, colour or size"
            autoComplete="off"
            className={catalogStyles.input}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className={catalogStyles.clear}
              aria-label="Clear product search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M5 5 19 19M19 5 5 19" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      <div className={catalogStyles.filterBar}>
        <div className={catalogStyles.filters} role="group" aria-label="Filter products by category">
          {categoryOptions.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category.trim().toLocaleLowerCase() === item.toLocaleLowerCase()}
              onClick={() => {
                setCategory(item);
                router.replace(item === "All" ? "/products" : getCategoryShopHref(item), { scroll: false });
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <span className={catalogStyles.count} aria-live="polite">
          {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
        </span>
      </div>

      {filteredProducts.length ? (
        <div className={styles.grid + " " + catalogStyles.catalogGrid + (filteredProducts.length === 1 ? " " + catalogStyles.singleGrid : "")}>
          {filteredProducts.map((product) => (
            <HomeProductGridCard key={product.id} product={product} whatsappNumber={whatsappNumber} />
          ))}
        </div>
      ) : (
        <div className={catalogStyles.emptyState} role="status">
          <strong>{activeProducts.length ? "No products found" : "The collection is coming soon"}</strong>
          <p>{activeProducts.length ? "Try another product name, category, colour or size." : "Check back soon for our latest pieces."}</p>
          {activeProducts.length > 0 && Boolean(query) ? (
            <button type="button" onClick={() => setQuery("")}>Clear search</button>
          ) : null}
        </div>
      )}
    </section>
  );
}
