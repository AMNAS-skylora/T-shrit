"use client";

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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex w-full max-w-[360px] flex-col gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-[.12em] text-black/45">Category</span>
          <select
            className="h-12 w-full rounded-full border border-black/12 bg-white px-5 text-[11px] font-semibold text-[#111] outline-none transition focus:border-black/30"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter dealer products by category"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <span className="text-[9px] font-semibold uppercase tracking-[.1em] text-black/40">
          {visibleProducts.length} product{visibleProducts.length === 1 ? "" : "s"}
        </span>
      </div>

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
