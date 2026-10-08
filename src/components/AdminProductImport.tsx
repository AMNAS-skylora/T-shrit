"use client";

import { ChangeEvent, useState } from "react";
import { AdminDrawer } from "@/components/AdminDrawer";

type ImportResult = {
  created: number;
  updated: number;
  failed: number;
  results?: Array<{
    sku: string;
    action: "created" | "updated" | "failed";
    error?: string;
  }>;
};

const headers = [
  "sku",
  "name",
  "category",
  "price",
  "compare_at_price",
  "status",
  "description",
  "color",
  "color_value",
  "size",
  "stock",
  "main_image_url",
  "color_image_url",
  "offer_enabled",
  "offer_type",
  "offer_value",
  "offer_label",
  "offer_badge",
  "animation_enabled",
  "animation_image",
  "sort_order",
];

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function templateCsv() {
  return [
    headers.map(csvEscape).join(","),
  ].join("\r\n");
}

function parseCsv(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);

  if (!rows.length) return [];

  const header = rows[0].map((cell) =>
    cell.replace(/^\uFEFF/, "").trim().toLowerCase(),
  );

  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      if (!key) return;
      record[key] = cells[index]?.trim() ?? "";
    });
    return record;
  });
}

export function AdminProductImport({
  onImported,
}: {
  onImported: () => void | Promise<void>;
}) …7088 tokens truncated…ceholder="Search name, SKU, category…"
              className="min-h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-sm outline-none transition focus:border-[#001cac] focus:bg-white focus:ring-2 focus:ring-[#001cac]/10 sm:w-72"
            />
          </div>
        </div>

        {loading ? (
          <div role="status" className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <span className="sr-only">Loading products…</span>
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-64 rounded-2xl bg-black/[.03]" />)}
          </div>
        ) : filtered.length ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((product) => {
              const offerStatus = getProductOfferStatus(product);
              const image = getProductPrimaryImage(product);

              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[20px] border border-black/[.07] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-black/[.12] hover:shadow-[0_14px_36px_rgba(0,0,0,.07)]"
                >
                  <Link
                    href={"/admin/products/" + product.id}
                    className="relative block aspect-[4/4.6] overflow-hidden bg-[#f4f4f5]"
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-black/25">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-black/[.04] text-lg">
                          ◻
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[.1em]">
                          No image
                        </span>
                      </div>
                    )}

                    <div className="absolute left-3 top-3 flex max-w-[calc(100%-24px)] flex-wrap gap-1.5">
                      <span
                        className={
                          "rounded-full px-2.5 py-1 text-[8px] font-bold uppercase backdrop-blur-md " +
                          (product.status === "active"
                            ? "bg-white/90 text-emerald-700"
                            : product.status === "sold-out"
                              ? "bg-red-50/95 text-red-700"
                              : "bg-white/90 text-black/55")
                        }
                      >
                        {product.status}
                      </span>

                      {offerStatus !== "off" ? (
                        <span className="rounded-full bg-[#001cac]/90 px-2.5 py-1 text-[8px] font-bold uppercase text-white backdrop-blur-md">
                          Offer {offerStatus}
                        </span>
                      ) : null}

                      {product.featured ? (
                        <span className="rounded-full bg-black/75 px-2.5 py-1 text-[8px] font-bold uppercase text-white backdrop-blur-md">
                          Featured
                        </span>
                      ) : null}
                    </div>

                    <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-bold uppercase text-black/55 backdrop-blur-md">
                      Stock {product.stock}
                    </div>
                  </Link>

                  <div className="p-3.5 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={"/admin/products/" + product.id}
                          className="block truncate text-[13px] font-bold tracking-[-.02em] transition hover:text-[#001cac]"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 truncate text-[9px] uppercase tracking-[.06em] text-black/35">
                          {product.category || "Uncategorized"} · {product.sku}
                        </p>
                      </div>

                      {product.featuredAnimationEnabled ? (
                        <span
                          title="Product animation enabled"
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#001cac]/[.07] text-[9px] font-black text-[#001cac]"
                        >
                          A
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-[#f7f7f8] p-2.5">
                        <span className="block text-[7px] font-bold uppercase tracking-[.08em] text-black/30">
                          Price
                        </span>
                        <strong className="mt-1 block truncate text-[11px]">
                          ₹{product.price.toLocaleString("en-IN")}
                        </strong>
                      </div>
                      <div className="rounded-xl bg-[#f7f7f8] p-2.5">
                        <span className="block text-[7px] font-bold uppercase tracking-[.08em] text-black/30">
                          Cost
                        </span>
                        <strong className="mt-1 block truncate text-[11px]">
                          {product.costPrice !== undefined
                            ? "₹" + product.costPrice.toLocaleString("en-IN")
                            : "—"}
                        </strong>
                      </div>
                      <div className="rounded-xl bg-[#f7f7f8] p-2.5">
                        <span className="block text-[7px] font-bold uppercase tracking-[.08em] text-black/30">
                          Order
                        </span>
                        <strong className="mt-1 block truncate text-[11px]">
                          {product.sortOrder ?? "—"}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
                      <Link
                        href={"/admin/products/" + product.id}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#111] px-3 text-[10px] font-bold !text-white transition hover:bg-black/85"
                      >
                        Manage
                      </Link>

                      <button
                        type="button"
                        onClick={() => edit(product)}
                        className="min-h-11 rounded-xl border border-black/10 bg-white px-3 text-[10px] font-bold transition hover:bg-black/[.025]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void remove(product.id)}
                        aria-label={"Delete " + product.name}
                        className="min-h-11 rounded-xl border border-red-100 bg-red-50 px-3 text-[10px] font-bold text-red-600 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-[18px] border border-dashed border-black/10 bg-[#fafafa] px-5 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-black/[.04] text-lg text-black/25">
              ◻
            </span>
            <p className="mt-3 text-xs font-bold">
              {products.length ? "No matching products" : "No products yet"}
            </p>
            <p className="mt-1 max-w-xs text-[9px] leading-4 text-black/35">
              {products.length
                ? "Try another product name, SKU or category."
                : "Create your first product and its image will appear here."}
            </p>
            {!products.length ? (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 min-h-11 rounded-xl bg-[#001cac] px-4 text-[10px] font-bold !text-white"
              >
                + Add product
              </button>
            ) : null}
          </div>
        )}
      </section>

      <AdminDrawer
        open={drawerOpen}
        title={editingId ? "Edit product" : "Add product"}
        description="Basic details, offer, animation image and storefront placement are controlled here."
        onClose={closeDrawer}
        footer={
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={closeDrawer}
              disabled={busy || Boolean(uploading)}
              className="min-h-11 rounded-xl border border-black/10 px-5 text-xs font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="admin-product-form"
              disabled={busy || Boolean(uploading)}
              className="min-h-11 rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white disabled:opacity-50"
            >
              {busy
                ? "Saving…"
                : editingId
                  ? "Update product"
                  : "Create product"}
            </button>
          </div>
        }
      >
        <form id="admin-product-form" onSubmit={submit} className="space-y-5">
          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <h3 className="text-sm font-bold">Product details</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {field(
                "Name",
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                  className={inputClass}
                />,
              )}
              {field(
                "Category",
                <input
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  className={inputClass}
                />,
              )}
              {field(
                "Price",
                <input
                  type="number"
                  min="0"
                  value={draft.price}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  required
                  className={inputClass}
                />,
              )}
              {field(
                "Cost price",
                <input
                  type="number"
                  min="0"
                  value={draft.costPrice}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      costPrice: event.target.value,
                    }))
                  }
                  placeholder="Purchase / landed cost"
                  className={inputClass}
                />,
              )}
              {field(
                "Compare price",
                <input
                  type="number"
                  min="0"
                  value={draft.compareAtPrice}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      compareAtPrice: event.target.value,
                    }))
                  }
                  className={inputClass}
                />,
              )}
              {field(
                "Stock",
                <input
                  type="number"
                  min="0"
                  value={draft.stock}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      stock: event.target.value,
                    }))
                  }
                  className={inputClass}
                />,
              )}
              {field(
                "Status",
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as ProductStatus,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="sold-out">Sold out</option>
                </select>,
              )}
              {field(
                "Catalog position",
                <input
                  type="number"
                  value={draft.sortOrder}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sortOrder: event.target.value,
                    }))
                  }
                  placeholder="1, 2, 3…"
                  className={inputClass}
                />,
              )}
              {field(
                "Sizes",
                <input
                  value={draft.sizes}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sizes: event.target.value,
                    }))
                  }
                  placeholder="S, M, L, XL"
                  className={inputClass}
                />,
              )}
              {field(
                "Colours",
                <input
                  value={draft.colors}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      colors: event.target.value,
                    }))
                  }
                  placeholder="Black, White"
                  className={inputClass}
                />,
                true,
              )}
              {field(
                "Description",
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className={inputClass + " min-h-28 resize-y"}
                />,
                true,
              )}
            </div>
          </section>

          <section className="space-y-3">
            {fileInput(
              "Product image",
              "image",
              "Main storefront image. JPG, PNG or WebP.",
            )}
          </section>

          <section className="space-y-3">
            <Toggle
              checked={draft.offerEnabled}
              onChange={(checked) =>
                setDraft((current) => ({
                  ...current,
                  offerEnabled: checked,
                }))
              }
              title="Product offer"
              description="Only shows on the storefront while this offer is enabled and within its schedule."
            />

            {draft.offerEnabled ? (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                <div className="grid gap-3 md:grid-cols-2">
                  {field(
                    "Offer type",
                    <select
                      value={draft.offerType}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          offerType: event.target.value as ProductOfferType,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="percentage">Percentage off</option>
                      <option value="fixed">Fixed amount off</option>
                      <option value="sale-price">Final sale price</option>
                    </select>,
                  )}
                  {field(
                    draft.offerType === "percentage"
                      ? "Discount %"
                      : draft.offerType === "fixed"
                        ? "Discount amount"
                        : "Sale price",
                    <input
                      type="number"
                      min="0"
                      value={draft.offerValue}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          offerValue: event.target.value,
                        }))
                      }
                      required={draft.offerEnabled}
                      className={inputClass}
                    />,
                  )}
                  {field(
                    "Offer label",
                    <input
                      value={draft.offerLabel}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          offerLabel: event.target.value,
                        }))
                      }
                      placeholder="Festive offer"
                      className={inputClass}
                    />,
                  )}
                  {field(
                    "Offer badge",
                    <input
                      value={draft.offerBadge}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          offerBadge: event.target.value,
                        }))
                      }
                      placeholder="20% OFF"
                      className={inputClass}
                    />,
                  )}
                  {field(
                    "Starts at",
                    <input
                      type="datetime-local"
                      value={draft.offerStartsAt}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          offerStartsAt: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />,
                  )}
                  {field(
                    "Ends at",
                    <input
                      type="datetime-local"
                      value={draft.offerEndsAt}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          offerEndsAt: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />,
                  )}
                </div>

                <label className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-black/10 px-3 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={draft.offerCountdown}
                    disabled={!draft.offerEndsAt}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        offerCountdown: event.target.checked,
                      }))
                    }
                  />
                  Show countdown on product card
                </label>
              </div>
            ) : null}
          </section>

          <section className="space-y-3">
            <Toggle
              checked={draft.featuredAnimationEnabled}
              onChange={(checked) =>
                setDraft((current) => ({
                  ...current,
                  featuredAnimationEnabled: checked,
                }))
              }
              title="Homepage transparent animation"
              description="This is the animated product showcase. It is independent from the Featured product flag."
            />

            {draft.featuredAnimationEnabled ? (
              <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-black/5">
                {fileInput(
                  "Animation image",
                  "featuredImage",
                  "Best result: transparent PNG/WebP with the full garment visible.",
                )}
                {field(
                  "Animation position",
                  <input
                    type="number"
                    min="1"
                    value={draft.animationSortOrder}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        animationSortOrder: event.target.value,
                      }))
                    }
                    placeholder="1, 2, 3, 4"
                    className={inputClass}
                  />,
                )}
              </div>
            ) : null}
          </section>

          <section className="space-y-3">
            <Toggle
              checked={draft.featured}
              onChange={(checked) =>
                setDraft((current) => ({ ...current, featured: checked }))
              }
              title="Featured product"
              description="Adds this product to the Featured Products section. Order can be changed with ↑ ↓ on the Products page."
            />

            {draft.featured ? (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                {field(
                  "Featured position",
                  <input
                    type="number"
                    min="1"
                    value={draft.featuredSortOrder}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        featuredSortOrder: event.target.value,
                      }))
                    }
                    placeholder="1"
                    className={inputClass}
                  />,
                )}
              </div>
            ) : null}

            <Toggle
              checked={draft.spotlight}
              onChange={(checked) =>
                setDraft((current) => ({ ...current, spotlight: checked }))
              }
              title="Single product spotlight"
              description="Only one product can be selected at a time. Enabling this product automatically replaces the previous spotlight."
            />

            <Toggle
              checked={draft.wholesaleEnabled}
              onChange={(checked) =>
                setDraft((current) => ({
                  ...current,
                  wholesaleEnabled: checked,
                }))
              }
              title="Dealer / wholesale"
              description="Enable wholesale pricing and minimum order quantity for this product."
            />

            {draft.wholesaleEnabled ? (
              <div className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 md:grid-cols-2">
                {field(
                  "Wholesale price",
                  <input
                    type="number"
                    min="0"
                    value={draft.wholesalePrice}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        wholesalePrice: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />,
                )}
                {field(
                  "Minimum order",
                  <input
                    type="number"
                    min="1"
                    value={draft.wholesaleMinOrder}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        wholesaleMinOrder: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />,
                )}
              </div>
            ) : null}
          </section>

          {message ? (
            <p className="rounded-xl bg-white px-4 py-3 text-xs font-medium text-black/60 ring-1 ring-black/5">
              {message}
            </p>
          ) : null}
        </form>
      </AdminDrawer>
    </div>
  );
}
