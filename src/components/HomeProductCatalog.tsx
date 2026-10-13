"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCategoryShopHref, getStorefrontCategories, productMatchesCategory } from "@/lib/storefront-categories";
import { HomeProductGridCard } from "@/components/HomeProductGridCard";
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
  eyebrow: string;
  title: string;
  whatsappNumber: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);

  // Also update when a new category query arrives through client-side navigation.
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
