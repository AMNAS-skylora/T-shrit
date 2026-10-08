"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/types/product";

type Scope = "featured" | "animation";

function orderValue(product: Product, scope: Scope) {
  if (scope === "featured") {
    return product.featuredSortOrder ?? product.sortOrder ?? 9999;
  }

  return (
    product.animationSortOrder ??
    product.featuredSortOrder ??
    product.sortOrder ??
    9999
  );
}

function PlacementList({
  title,
  description,
  products,
  scope,
  onChanged,
}: {
  title: string;
  description: string;
  products: Product[];
  scope: Scope;
  onChanged: () => void | Promise<void>;
}) {
  const [busyId, setBusyId] = useState("");

  const ordered = useMemo(
    () =>
      [...products].sort(
        (a, b) =>
          orderValue(a, scope) - orderValue(b, scope) ||
          a.name.localeCompare(b.name),
      ),
    [products, scope],
  );

  async function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= ordered.length) return;

    const reordered = [...ordered];
    [reordered[index], reordered[nextIndex]] = [
      reordered[nextIndex],
      reordered[index],
    ];

    setBusyId(ordered[index].id);

    try {
      const response = await fetch("/api/admin/products/reorder", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scope,
          productIds: reordered.map((product) => product.id),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not reorder products.");
      }

      await onChanged();
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#001cac]">
          Homepage order
        </p>
        <h2 className="mt-1 text-sm font-bold">{title}</h2>
        <p className="mt-1 text-[10px] leading-5 text-black/45">
          {description}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {ordered.map((product, index) => (
          <div
            key={product.id}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2"
          >
            <span className="w-6 shrink-0 text-center text-[10px] font-bold text-black/35">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0 flex-1">
              <Link
                href={"/admin/products/" + product.id}
                className="block truncate text-xs font-bold hover:text-[#001cac]"
              >
                {product.name}
              </Link>
              <span className="mt-0.5 block truncate text-[9px] text-black/40">
                {product.sku}
              </span>
            </div>

            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => void move(index, -1)}
                disabled={index === 0 || Boolean(busyId)}
                aria-label={"Move " + product.name + " up"}
                className="grid h-10 w-10 place-items-center rounded-lg border border-black/10 bg-white text-sm font-bold disabled:opacity-25"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => void move(index, 1)}
                disabled={
                  index === ordered.length - 1 || Boolean(busyId)
                }
                aria-label={"Move " + product.name + " down"}
                className="grid h-10 w-10 place-items-center rounded-lg border border-black/10 bg-white text-sm font-bold disabled:opacity-25"
              >
                ↓
              </button>
            </div>
          </div>
        ))}

        {!ordered.length ? (
          <div className="rounded-xl border border-dashed border-black/15 px-4 py-6 text-center">
            <p className="text-[10px] text-black/40">
              No products enabled for this section.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function AdminProductPlacementManager({
  products,
  onChanged,
}: {
  products: Product[];
  onChanged: () => void | Promise<void>;
}) {
  const featured = products.filter(
    (product) => product.featured && product.status === "active",
  );
  const animation = products.filter(
    (product) =>
      product.featuredAnimationEnabled && product.status === "active",
  );
  const spotlight = products.find(
    (product) => product.spotlight && product.status === "active",
  );

  return (
    <div className="mt-5 space-y-3">
      <div className="grid gap-3 xl:grid-cols-2">
        <PlacementList
          title="Featured products"
          description="Move products up or down. Number 01 appears first in the featured products section."
          products={featured}
          scope="featured"
          onChanged={onChanged}
        />
        <PlacementList
          title="Product animation"
          description="Animation order is independent. Number 01 is the first animated product shown."
          products={animation}
          scope="animation"
          onChanged={onChanged}
        />
      </div>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#001cac]">
            Single product spotlight
          </p>
          <h2 className="mt-1 text-sm font-bold">
            {spotlight ? spotlight.name : "No spotlight product selected"}
          </h2>
          <p className="mt-1 text-[10px] leading-5 text-black/45">
            Only one product can be selected at a time. Select it inside the
            product management page.
          </p>
        </div>

        {spotlight ? (
          <Link
            href={"/admin/products/" + spotlight.id}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/10 px-4 text-xs font-bold"
          >
            Manage spotlight
          </Link>
        ) : null}
      </section>
    </div>
  );
}
