"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types/product";

export function HomeProductCatalog({
  products,
  eyebrow,
  title,
}: {
  products: Product[];
  eyebrow: string;
  title: string;
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
    <section id="shop-products" data-shop-reveal className="ref-shell ref-arrivals" aria-label="Product catalog">
      <div className="ref-arrivals-head">
        <div>
          <p className="ref-kicker">{eyebrow}</p>
          <h2>{title}</h2>
        </div>

        <Link href="/products" className="ref-outline-pill">
          View all
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[440px]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, category, colour or size"
            aria-label="Search homepage products"
            className="h-[48px] w-full rounded-full border border-black/15 bg-white px-5 pr-12 text-[11px] font-medium text-[#111] outline-none transition placeholder:text-black/35 focus:border-black/35"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-[#f1f1f1] text-[12px] font-bold text-black/55"
              aria-label="Clear product search"
            >
              ×
            </button>
          ) : null}
        </div>

        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-black/40">
          {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="shop-category-filters" aria-label="Filter products by category">
        {["All", ...Array.from(new Set(activeProducts.map((product) => product.category).filter(Boolean)))].map((item) => (
          <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </div>
      {filteredProducts.length ? (
        <div className="ref-arrival-grid mt-5">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
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
