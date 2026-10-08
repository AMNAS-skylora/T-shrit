"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminDrawer } from "@/components/AdminDrawer";
import { AdminProductImport } from "@/components/AdminProductImport";
import { AdminProductPlacementManager } from "@/components/AdminProductPlacementManager";
import type {
  Product,
  ProductOfferType,
  ProductStatus,
} from "@/types/product";
import { getProductOfferStatus } from "@/lib/product-offers";
import { getProductPrimaryImage } from "@/lib/product-images";
import { uploadAdminImage } from "@/lib/admin-image-upload";

type Draft = {
  name: string;
  sku: string;
  slug: string;
  category: string;
  price: string;
  costPrice: string;
  compareAtPrice: string;
  stock: string;
  description: string;
  sizes: string;
  colors: string;
  status: ProductStatus;
  sortOrder: string;
  featured: boolean;
  featuredSortOrder: string;
  featuredAnimationEnabled: boolean;
  animationSortOrder: string;
  spotlight: boolean;
  image: string;
  featuredImage: string;
  offerEnabled: boolean;
  offerType: ProductOfferType;
  offerValue: string;
  offerLabel: string;
  offerBadge: string;
  offerStartsAt: string;
  offerEndsAt: string;
  offerCountdown: boolean;
  wholesaleEnabled: boolean;
  wholesalePrice: string;
  wholesaleMinOrder: string;
};

const emptyDraft: Draft = {
  name: "",
  sku: "",
  slug: "",
  category: "",
  price: "",
  costPrice: "",
  compareAtPrice: "",
  stock: "0",
  description: "",
  sizes: "",
  colors: "",
  status: "active",
  sortOrder: "",
  featured: false,
  featuredSortOrder: "",
  featuredAnimationEnabled: true,
  animationSortOrder: "",
  spotlight: false,
  image: "",
  featuredImage: "",
  offerEnabled: false,
  offerType: "percentage",
  offerValue: "",
  offerLabel: "",
  offerBadge: "",
  offerStartsAt: "",
  offerEndsAt: "",
  offerCountdown: false,
  wholesaleEnabled: false,
  wholesalePrice: "",
  wholesaleMinOrder: "12",
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#001cac] focus:ring-2 focus:ring-[#001cac]/10";
const labelClass = "text-[10px] font-bold uppercase tracking-[.08em] text-black/50";

function csv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dateTimeInput(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 16);
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function apiDate(value: string) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function Toggle({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-4 text-left"
      aria-pressed={checked}
    >
      <span>
        <strong className="block text-sm">{title}</strong>
        <span className="mt-1 block text-[11px] leading-5 text-black/45">
          {description}
        </span>
      </span>
      <span
        className={
          "relative h-6 w-11 shrink-0 rounded-full transition " +
          (checked ? "bg-[#001cac]" : "bg-black/15")
        }
      >
        <span
          className={
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition " +
            (checked ? "left-6" : "left-1")
          }
        />
      </span>
    </button>
  );
}

export function AdminProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");

  async function load() {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load products.");
    setProducts(data.products || []);
  }

  useEffect(() => {
    void load().catch((error) =>
      setMessage(
        error instanceof Error ? error.message : "Could not load products.",
      ),
    );

    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setEditingId(null);
      setDraft(emptyDraft);
      setUploading("");
      setMessage("");
      setDrawerOpen(true);

      const cleanUrl = window.location.pathname;
      window.history.replaceState(window.history.state, "", cleanUrl);
    }
  }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return products;

    return products.filter((product) =>
      [product.name, product.sku, product.category, product.slug]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [products, query]);

  const stats = useMemo(
    () => ({
      active: products.filter((product) => product.status === "active").length,
      offers: products.filter(
        (product) => getProductOfferStatus(product) === "active",
      ).length,
      animations: products.filter(
        (product) => product.featuredAnimationEnabled,
      ).length,
    }),
    [products],
  );

  function clearDraft() {
    setEditingId(null);
    setDraft(emptyDraft);
    setUploading("");
  }

  function openCreate() {
    clearDraft();
    setMessage("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (busy || uploading) return;
    setDrawerOpen(false);
    clearDraft();
  }

  function edit(product: Product) {
    setEditingId(product.id);
    setDraft({
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      category: product.category,
      price: String(product.price),
      costPrice:
        product.costPrice !== undefined ? String(product.costPrice) : "",
      compareAtPrice:
        product.compareAtPrice !== undefined
          ? String(product.compareAtPrice)
          : "",
      stock: String(product.stock),
      description: product.description,
      sizes: product.sizes.join(", "),
      colors: product.colors.join(", "),
      status: product.status,
      sortOrder:
        product.sortOrder !== undefined ? String(product.sortOrder) : "",
      featured: Boolean(product.featured),
      featuredSortOrder:
        product.featuredSortOrder !== undefined
          ? String(product.featuredSortOrder)
          : "",
      featuredAnimationEnabled: Boolean(product.featuredAnimationEnabled),
      animationSortOrder:
        product.animationSortOrder !== undefined
          ? String(product.animationSortOrder)
          : "",
      spotlight: Boolean(product.spotlight),
      image: product.image || "",
      featuredImage: product.featuredImage || "",
      offerEnabled: Boolean(product.offerEnabled),
      offerType: product.offerType || "percentage",
      offerValue:
        product.offerValue !== undefined ? String(product.offerValue) : "",
      offerLabel: product.offerLabel || "",
      offerBadge: product.offerBadge || "",
      offerStartsAt: dateTimeInput(product.offerStartsAt),
      offerEndsAt: dateTimeInput(product.offerEndsAt),
      offerCountdown: Boolean(product.offerCountdown),
      wholesaleEnabled: Boolean(product.wholesaleEnabled),
      wholesalePrice:
        product.wholesalePrice !== undefined
          ? String(product.wholesalePrice)
          : "",
      wholesaleMinOrder: String(product.wholesaleMinOrder || 12),
    });
    setMessage("");
    setDrawerOpen(true);
  }

  async function upload(
    file: File,
    field: "image" | "featuredImage",
  ) {
    setUploading(field);
    setMessage("");

    const previous = draft[field];
    const previewUrl = URL.createObjectURL(file);

    setDraft((current) => ({
      ...current,
      [field]: previewUrl,
    }));

    try {
      const uploaded = await uploadAdminImage(file, "kleidin/products");

      setDraft((current) => ({
        ...current,
        [field]: uploaded.url,
      }));
      setMessage("Image uploaded to Cloudinary. Save the product to publish it.");
    } catch (error) {
      setDraft((current) => ({
        ...current,
        [field]: previous,
      }));
      setMessage(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploading("");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (draft.offerEnabled && Number(draft.offerValue) <= 0) {
        throw new Error("Offer value must be greater than 0.");
      }

      const payload = {
        ...draft,
        price: Number(draft.price || 0),
        costPrice: draft.costPrice ? Number(draft.costPrice) : null,
        compareAtPrice: draft.compareAtPrice
          ? Number(draft.compareAtPrice)
          : null,
        stock: Number(draft.stock || 0),
        sizes: csv(draft.sizes),
        colors: csv(draft.colors),
        sortOrder: draft.sortOrder ? Number(draft.sortOrder) : null,
        featuredSortOrder: draft.featuredSortOrder
          ? Number(draft.featuredSortOrder)
          : null,
        animationSortOrder: draft.animationSortOrder
          ? Number(draft.animationSortOrder)
          : null,
        spotlight: draft.spotlight,
        offerEnabled: draft.offerEnabled,
        offerType: draft.offerEnabled ? draft.offerType : undefined,
        offerValue:
          draft.offerEnabled && draft.offerValue
            ? Number(draft.offerValue)
            : null,
        offerLabel: draft.offerEnabled ? draft.offerLabel : "",
        offerBadge: draft.offerEnabled ? draft.offerBadge : "",
        offerStartsAt:
          draft.offerEnabled && draft.offerStartsAt
            ? apiDate(draft.offerStartsAt)
            : "",
        offerEndsAt:
          draft.offerEnabled && draft.offerEndsAt
            ? apiDate(draft.offerEndsAt)
            : "",
        offerCountdown:
          draft.offerEnabled && draft.offerCountdown && Boolean(draft.offerEndsAt),
        wholesalePrice: draft.wholesalePrice
          ? Number(draft.wholesalePrice)
          : null,
        wholesaleMinOrder: draft.wholesaleMinOrder
          ? Number(draft.wholesaleMinOrder)
          : null,
      };

      const wasEditing = Boolean(editingId);
      const response = await fetch(
        editingId
          ? "/api/admin/products/" + editingId
          : "/api/admin/products",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save product.");
      }

      await load();
      setDrawerOpen(false);
      clearDraft();
      setMessage(wasEditing ? "Product updated." : "Product created.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save product.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this product?")) return;

    setMessage("");
    const response = await fetch("/api/admin/products/" + id, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not delete product.");
      return;
    }

    await load();
    setMessage("Product deleted.");
  }

  function fileInput(
    label: string,
    field: "image" | "featuredImage",
    helper: string,
  ) {
    const value = draft[field];
    const contain = field === "featuredImage";

    return (
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-bold">{label}</span>
            <p className="mt-1 text-[10px] leading-4 text-black/45">{helper}</p>
          </div>
          {uploading === field ? (
            <span className="text-[9px] font-bold uppercase tracking-[.08em] text-[#001cac]">
              Uploading…
            </span>
          ) : null}
        </div>

        {value ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-[#f1f1f1]">
              <img
                src={value}
                alt=""
                className={
                  "h-full w-full " +
                  (contain ? "object-contain p-1" : "object-cover")
                }
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setDraft((current) => ({ ...current, [field]: "" }))
              }
              className="rounded-lg border border-red-200 px-3 py-2 text-[10px] font-bold text-red-600"
            >
              Remove
            </button>
          </div>
        ) : null}

        <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-black/20 bg-black/[.015] px-3 text-[10px] font-bold transition hover:border-[#001cac]/40 hover:bg-[#001cac]/[.03]">
          {value ? "Replace image" : "Choose image"}
          <input
            type="file"
            accept="image/*"
            disabled={Boolean(uploading)}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];
              if (file) void upload(file, field);
              event.target.value = "";
            }}
            className="sr-only"
          />
        </label>
      </div>
    );
  }

  const field = (
    title: string,
    control: ReactNode,
    wide = false,
  ) => (
    <label className={wide ? "block md:col-span-2" : "block"}>
      <span className={labelClass}>{title}</span>
      {control}
    </label>
  );

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[.16em] text-[#001cac]">
            CATALOG
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">
            Products
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-5 text-black/45">
            Product data stays clean on the page. Add and edit actions open in a
            focused panel.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <AdminProductImport onImported={load} />
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white sm:w-auto"
          >
            + Add product
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Products", products.length],
          ["Active", stats.active],
          ["Live offers", stats.offers],
          ["Animations", stats.animations],
        ].map(([label, value]) => (
          <article
            key={String(label)}
            className="rounded-2xl bg-white p-4 ring-1 ring-black/5"
          >
            <p className="text-[9px] font-bold uppercase tracking-[.1em] text-black/40">
              {label}
            </p>
            <strong className="mt-2 block text-2xl tracking-[-.04em]">
              {value}
            </strong>
          </article>
        ))}
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-black/5 bg-white px-4 py-3 text-xs font-medium text-black/60">
          {message}
        </div>
      ) : null}

      <AdminProductPlacementManager
        products={products}
        onChanged={load}
      />

      <section className="mt-4 rounded-[22px] bg-white p-4 ring-1 ring-black/[.06] md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#001cac]">
              Product catalog
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-[-.025em]">
              All products
            </h2>
            <p className="mt-1 text-[10px] text-black/40">
              {filtered.length} of {products.length} products
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, SKU, category…"
              className="min-h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-sm outline-none transition focus:border-[#001cac] focus:bg-white focus:ring-2 focus:ring-[#001cac]/10 sm:w-72"
            />
          </div>
        </div>

        {filtered.length ? (
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
                      slug: current.slug || slugify(event.target.value),
                    }))
                  }
                  required
                  className={inputClass}
                />,
              )}
              {field(
                "SKU",
                <input
                  value={draft.sku}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sku: event.target.value,
                    }))
                  }
                  required
                  className={inputClass}
                />,
              )}
              {field(
                "Slug",
                <input
                  value={draft.slug}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      slug: event.target.value,
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
