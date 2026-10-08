"use client";

import { AdminCategorySelect } from "@/components/AdminCategorySelect";
import { useOfferClock } from "@/hooks/useOfferClock";
import Link from "next/link";
import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Product,
  ProductColorVariant,
  ProductOfferType,
  ProductStatus,
} from "@/types/product";
import { getProductOfferPrice, getProductOfferStatus, validateProductOffer } from "@/lib/product-offers";
import { getProductPrimaryImage } from "@/lib/product-images";
import { uploadAdminImage } from "@/lib/admin-image-upload";

const commonSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "Free Size"];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#001cac] focus:ring-2 focus:ring-[#001cac]/10";
const labelClass =
  "text-[10px] font-bold uppercase tracking-[.1em] text-black/45";

function cloneProduct(product: Product): Product {
  return {
    ...product,
    sizes: [...product.sizes],
    colors: [...product.colors],
    colorVariants: (product.colorVariants ?? []).map((variant) => ({
      ...variant,
      images: [...(variant.images ?? [])],
      sizeStocks: { ...(variant.sizeStocks ?? {}) },
    })),
  };
}

function variantStock(variant: ProductColorVariant, sizes: string[]) {
  if (sizes.length) {
    return sizes.reduce(
      (sum, size) => sum + Math.max(0, Number(variant.sizeStocks?.[size] ?? 0)),
      0,
    );
  }
  return Math.max(0, Number(variant.stock ?? 0));
}

function totalVariantStock(product: Product) {
  const variants = product.colorVariants ?? [];
  if (!variants.length) return Math.max(0, Number(product.stock ?? 0));
  return variants.reduce(
    (sum, variant) => sum + variantStock(variant, product.sizes),
    0,
  );
}

function toLocalDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIso(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function Toggle({
  checked,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  help?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="flex min-h-14 w-full items-center justify-between gap-4 rounded-xl border border-black/10 bg-white px-4 py-3 text-left"
    >
      <span>
        <strong className="block text-xs">{label}</strong>
        {help ? (
          <span className="mt-1 block text-[10px] leading-4 text-black/45">
            {help}
          </span>
        ) : null}
      </span>
      <span
        className={
          "relative h-6 w-11 shrink-0 rounded-full transition " +
          (checked ? "bg-[#001cac]" : "bg-black/15")
        }
      >
        <span
          className={
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition " +
            (checked ? "left-6" : "left-1")
          }
        />
      </span>
    </button>
  );
}

export function AdminProductDetail({ productId }: { productId: string }) {
  const [draft, setDraft] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [savedProduct, setSavedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setDraft(null); setSavedProduct(null); setLoading(true); setLoadError(""); setMessage(""); setNotFound(false); setCustomSize("");
    async function load() {
      try {
        const response = await fetch("/api/admin/products/" + encodeURIComponent(productId), { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) { setNotFound(response.status === 404); throw new Error(data.error || "Could not load product."); }
        if (controller.signal.aborted) return;
        setDraft(cloneProduct(data.product)); setSavedProduct(cloneProduct(data.product));
      } catch (error) { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Could not load product."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [productId, retry]);

  const totalStock = useMemo(
    () => (draft ? totalVariantStock(draft) : 0),
    [draft],
  );

  const offerNow = useOfferClock(draft ?? undefined, false);
  const offerStatus = useMemo(
    () => (draft ? getProductOfferStatus(draft, offerNow) : "off"),
    [draft, offerNow],
  );

  const offerPrice = useMemo(
    () => (draft ? getProductOfferPrice(draft, offerNow) : 0),
    [draft, offerNow],
  );

  function patch(patch: Partial<Product>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function setSizes(nextSizes: string[]) {
    setDraft((current) => {
      if (!current) return current;

      const unique = Array.from(new Set(nextSizes.filter(Boolean)));
      const variants = (current.colorVariants ?? []).map((variant) => {
        const sizeStocks = { ...(variant.sizeStocks ?? {}) };

        for (const key of Object.keys(sizeStocks)) {
          if (!unique.includes(key)) delete sizeStocks[key];
        }
        for (const size of unique) {
          if (sizeStocks[size] === undefined) sizeStocks[size] = 0;
        }

        return {
          ...variant,
          sizeStocks,
          stock: unique.reduce(
            (sum, size) => sum + Number(sizeStocks[size] ?? 0),
            0,
          ),
        };
      });

      return {
        ...current,
        sizes: unique,
        colorVariants: variants,
        stock: variants.length
          ? variants.reduce((sum, variant) => sum + Number(variant.stock ?? 0), 0)
          : current.stock,
      };
    });
  }

  function toggleSize(size: string) {
    if (!draft) return;
    setSizes(
      draft.sizes.includes(size)
        ? draft.sizes.filter((item) => item !== size)
        : [...draft.sizes, size],
    );
  }

  function addCustomSize() {
    const value = customSize.trim();
    if (!value || !draft) return;
    if (!draft.sizes.includes(value)) setSizes([...draft.sizes, value]);
    setCustomSize("");
  }

  function addColour() {
    setDraft((current) => {
      if (!current) return current;

      const name = "Colour " + ((current.colorVariants?.length ?? 0) + 1);
      const sizeStocks = Object.fromEntries(
        current.sizes.map((size) => [size, 0]),
      );

      return {
        ...current,
        colors: [...current.colors, name],
        colorVariants: [
          ...(current.colorVariants ?? []),
          {
            name,
            value: "#111111",
            images: [],
            sizeStocks,
            stock: 0,
          },
        ],
      };
    });
  }

  function updateVariant(
    index: number,
    updater: (variant: ProductColorVariant) => ProductColorVariant,
  ) {
    setDraft((current) => {
      if (!current) return current;
      const variants = [...(current.colorVariants ?? [])];
      const before = variants[index];
      if (!before) return current;

      const oldName = before.name;
      const updated = updater({
        ...before,
        images: [...(before.images ?? [])],
        sizeStocks: { ...(before.sizeStocks ?? {}) },
      });

      updated.stock = variantStock(updated, current.sizes);
      variants[index] = updated;

      const colors = current.colors.map((color) =>
        color === oldName ? updated.name : color,
      );

      return {
        ...current,
        colors: Array.from(new Set(colors)),
        colorVariants: variants,
        stock: variants.reduce(
          (sum, variant) => sum + variantStock(variant, current.sizes),
          0,
        ),
      };
    });
  }

  function removeVariant(index: number) {
    setDraft((current) => {
      if (!current) return current;
      const variants = [...(current.colorVariants ?? [])];
      const removed = variants[index];
      variants.splice(index, 1);

      return {
        ...current,
        colors: current.colors.filter(
          (color) => color.toLowerCase() !== removed?.name.toLowerCase(),
        ),
        colorVariants: variants,
        stock: variants.length
          ? variants.reduce(
              (sum, variant) => sum + variantStock(variant, current.sizes),
              0,
            )
          : 0,
      };
    });
  }

  function updateSizeStock(index: number, size: string, value: number) {
    updateVariant(index, (variant) => ({
      ...variant,
      sizeStocks: {
        ...(variant.sizeStocks ?? {}),
        [size]: Math.max(0, Math.floor(value || 0)),
      },
    }));
  }

  async function uploadFile(file: File, key: string) {
    setUploading(key);
    setMessage("");

    try {
      const uploaded = await uploadAdminImage(file, "kleidin/products");
      return uploaded.url;
    } finally {
      setUploading("");
    }
  }

  async function uploadMain(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const previous = draft?.image;
    const previewUrl = URL.createObjectURL(file);
    patch({ image: previewUrl });

    try {
      const url = await uploadFile(file, "main");
      patch({ image: url });
      setMessage("Main image uploaded. Save product to publish the change.");
    } catch (error) {
      patch({ image: previous });
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  }

  async function uploadAnimation(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const previous = draft?.featuredImage;
    const previewUrl = URL.createObjectURL(file);
    patch({ featuredImage: previewUrl });

    try {
      const url = await uploadFile(file, "animation");
      patch({ featuredImage: url });
      setMessage("Animation image uploaded. Save product to publish the change.");
    } catch (error) {
      patch({ featuredImage: previous });
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  }

  async function uploadShowcaseBackground(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const previous = draft?.showcaseBackgroundImage;
    const previewUrl = URL.createObjectURL(file);
    patch({ showcaseBackgroundImage: previewUrl });

    try {
      const url = await uploadFile(file, "showcase-background");
      patch({ showcaseBackgroundImage: url });
      setMessage(
        "Selector background uploaded. Save product to publish the change.",
      );
    } catch (error) {
      patch({ showcaseBackgroundImage: previous });
      setMessage(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  }

  async function uploadVariantImages(
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    const previewUrls = files.map((file) => URL.createObjectURL(file));

    updateVariant(index, (variant) => {
      const images = [...(variant.images ?? []), ...previewUrls];
      return {
        ...variant,
        image: images[0],
        images,
      };
    });

    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        uploadedUrls.push(await uploadFile(file, "variant-" + index));
      }

      updateVariant(index, (variant) => {
        const images = (variant.images ?? []).map((url) => {
          const previewIndex = previewUrls.indexOf(url);
          return previewIndex >= 0 ? uploadedUrls[previewIndex] : url;
        });

        return {
          ...variant,
          image: images[0],
          images,
        };
      });
      setMessage("Colour image uploaded. Save product to publish the change.");
    } catch (error) {
      updateVariant(index, (variant) => {
        const images = (variant.images ?? []).filter(
          (url) => !previewUrls.includes(url),
        );
        return {
          ...variant,
          image: images[0],
          images,
        };
      });
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    }
  }

  async function save() {
    if (saving || uploading) return;
    if (!draft) return;
    const offerError = validateProductOffer(draft);
    if (offerError) {
      setMessage(offerError);
      window.requestAnimationFrame(() => document.getElementById("product-feedback")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    setSaving(true);
    setMessage("");

    try {
      const normalizedVariants = (draft.colorVariants ?? []).map((variant) => ({
        ...variant,
        images: variant.images ?? [],
        image: variant.images?.[0] || variant.image,
        stock: variantStock(variant, draft.sizes),
      }));

      const stock = normalizedVariants.length
        ? normalizedVariants.reduce(
            (sum, variant) => sum + Number(variant.stock ?? 0),
            0,
          )
        : Math.max(0, Number(draft.stock ?? 0));

      const response = await fetch("/api/admin/products/" + productId, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...draft,
          compareAtPrice: draft.compareAtPrice ?? null,
          sortOrder: draft.sortOrder ?? null,
          featuredSortOrder: draft.featuredSortOrder ?? null,
          animationSortOrder: draft.animationSortOrder ?? null,
          spotlight: Boolean(draft.spotlight),
          featuredImage: draft.featuredImage ?? "",
          showcaseBackgroundImage: draft.showcaseBackgroundImage ?? "",
          offerValue: draft.offerEnabled ? draft.offerValue ?? null : null,
          offerLabel: draft.offerEnabled ? draft.offerLabel ?? "" : "",
          offerBadge: draft.offerEnabled ? draft.offerBadge ?? "" : "",
          offerStartsAt: draft.offerEnabled ? draft.offerStartsAt ?? "" : "",
          offerEndsAt: draft.offerEnabled ? draft.offerEndsAt ?? "" : "",
          offerCountdown:
            Boolean(draft.offerEnabled) && Boolean(draft.offerCountdown),
          stock,
          colors: normalizedVariants.length
            ? normalizedVariants.map((variant) => variant.name)
            : draft.colors,
          colorVariants: normalizedVariants,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save product.");
      }

      setDraft(cloneProduct(data.product));
      setSavedProduct(cloneProduct(data.product));
      setMessage("Product saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save product.",
      );
    } finally {
      setSaving(false);
    }
  }

  const dirty = Boolean(draft && savedProduct && JSON.stringify(draft) !== JSON.stringify(savedProduct));
  function reset() { if (savedProduct) { setDraft(cloneProduct(savedProduct)); setCustomSize(""); setMessage(""); } }

  if (!draft) {
    return <div className="min-w-0"><Link href="/admin/products" className="inline-flex min-h-11 items-center text-xs font-semibold !text-[#001cac]">← Back to products</Link>{loading ? <div role="status" aria-label="Loading product" className="mt-4 grid gap-4 lg:grid-cols-3"><div className="h-80 animate-pulse rounded-2xl bg-black/5 motion-reduce:animate-none lg:col-span-2" /><div className="h-80 animate-pulse rounded-2xl bg-black/5 motion-reduce:animate-none" /></div> : <div role="alert" className="mt-4 rounded-2xl bg-white p-5 ring-1 ring-black/5"><p className="text-sm text-red-600">{loadError || "Product not found."}</p>{!notFound ? <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 min-h-11 rounded-xl border border-black/10 px-4 text-xs font-semibold">Try again</button> : null}</div>}</div>;
  }

  const variants = draft.colorVariants ?? [];
  const primaryPreviewImage = getProductPrimaryImage(draft);

  return (
    <div className="min-w-0 pb-28">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex min-h-11 items-center text-xs font-semibold !text-[#001cac]"
          >
            ← Products
          </Link>
          <h1 className="mt-2 break-words text-3xl font-bold tracking-[-.045em]">
            {draft.name}
          </h1>
          <p className="mt-2 break-words text-xs text-black/45">
            {draft.sku} · {draft.category || "No category"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={reset} disabled={!dirty || saving || Boolean(uploading)} className="min-h-11 rounded-xl border border-black/10 px-4 text-xs font-semibold disabled:opacity-50">Reset changes</button>
          <Link
            href={"/products/" + draft.slug}
            target="_blank"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-xs font-bold"
          >
            View storefront ↗
          </Link>
          <button
            type="button"
            onClick={() => void save()}
            disabled={!dirty || saving || Boolean(uploading)}
            className="min-h-11 rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {message ? (
        <p id="product-feedback" role="status" aria-live="polite" className="mt-4 rounded-xl bg-white px-4 py-3 text-xs font-medium text-black/60 ring-1 ring-black/5">
          {message}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><nav aria-label="Product sections" className="flex flex-wrap gap-2">{[["details", "Details"], ["sizes", "Sizes"], ["colours", "Colours"], ["offer", "Offer"], ["homepage", "Homepage"], ["images", "Images"]].map(([id, label]) => <a key={id} href={"#product-" + id} className="inline-flex min-h-11 items-center rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold hover:bg-[#eef2ff]">{label}</a>)}</nav><p aria-live="polite" className={"text-xs font-semibold " + (dirty ? "text-amber-700" : "text-black/45")}>{dirty ? "Unsaved changes" : "All changes saved"}</p></div>
      <fieldset disabled={saving} className="mt-5 grid min-w-0 gap-4 border-0 p-0 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 min-w-0 space-y-4 xl:order-1">
          <section id="product-details" className="scroll-mt-6 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={labelClass}>Product details</p>
                <h2 className="mt-1 text-lg font-bold">Quick edit</h2>
              </div>
              <span className="rounded-full bg-black/[.04] px-3 py-1.5 text-[10px] font-bold uppercase">
                {draft.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label>
                <span className={labelClass}>Name</span>
                <input
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  className={inputClass}
                />
              </label>
              <AdminCategorySelect value={draft.category} onChange={(category) => patch({ category })} />
              <label>
                <span className={labelClass}>Price</span>
                <input
                  type="number"
                  min="0"
                  value={draft.price}
                  onChange={(event) =>
                    patch({ price: Math.max(0, Number(event.target.value)) })
                  }
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Cost price</span>
                <input
                  type="number"
                  min="0"
                  value={draft.costPrice ?? ""}
                  onChange={(event) =>
                    patch({
                      costPrice: event.target.value
                        ? Math.max(0, Number(event.target.value))
                        : undefined,
                    })
                  }
                  placeholder="Purchase / landed cost"
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Compare price</span>
                <input
                  type="number"
                  min="0"
                  value={draft.compareAtPrice ?? ""}
                  onChange={(event) =>
                    patch({
                      compareAtPrice: event.target.value
                        ? Math.max(0, Number(event.target.value))
                        : undefined,
                    })
                  }
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Status</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    patch({ status: event.target.value as ProductStatus })
                  }
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="sold-out">Sold out</option>
                </select>
              </label>
              <label>
                <span className={labelClass}>Catalog position</span>
                <input
                  type="number"
                  value={draft.sortOrder ?? ""}
                  onChange={(event) =>
                    patch({
                      sortOrder: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    })
                  }
                  className={inputClass}
                />
              </label>
              <label className="md:col-span-2">
                <span className={labelClass}>Description</span>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    patch({ description: event.target.value })
                  }
                  className={inputClass + " min-h-28 resize-y"}
                />
              </label>
            </div>
          </section>

          <section id="product-sizes" className="scroll-mt-6 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={labelClass}>Sizes</p>
                <h2 className="mt-1 text-lg font-bold">Size selection</h2>
              </div>
              <span className="text-[10px] font-medium text-black/45">
                {draft.sizes.length} selected
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {commonSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={
                    "min-h-10 rounded-xl border px-3 text-xs font-bold transition " +
                    (draft.sizes.includes(size)
                      ? "border-[#001cac] bg-[#001cac] !text-white"
                      : "border-black/10 bg-white text-black/65")
                  }
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={customSize}
                onChange={(event) => setCustomSize(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomSize();
                  }
                }}
                placeholder="Custom size, e.g. 32"
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#001cac]"
              />
              <button
                type="button"
                onClick={addCustomSize}
                className="min-h-11 rounded-xl border border-black/10 px-4 text-xs font-bold"
              >
                Add
              </button>
            </div>

            {draft.sizes.some((size) => !commonSizes.includes(size)) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {draft.sizes
                  .filter((size) => !commonSizes.includes(size))
                  .map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className="rounded-full bg-black/[.05] px-3 py-1.5 text-[10px] font-bold"
                    >
                      {size} ×
                    </button>
                  ))}
              </div>
            ) : null}
          </section>

          <section id="product-colours" className="scroll-mt-6 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={labelClass}>Variants</p>
                <h2 className="mt-1 text-lg font-bold">Colours + stock</h2>
              </div>
              <button
                type="button"
                onClick={addColour}
                className="min-h-11 rounded-xl bg-[#111] px-4 text-xs font-bold !text-white"
              >
                + Add colour
              </button>
            </div>

            {!variants.length ? (
              <div className="mt-4 rounded-2xl border border-dashed border-black/15 p-5">
                <p className="text-xs font-semibold">No colour variants yet.</p>
                <p className="mt-1 text-[10px] leading-5 text-black/45">
                  Add a colour to unlock colour-specific images and size stock.
                </p>
                <label className="mt-4 block max-w-[220px]">
                  <span className={labelClass}>Base stock</span>
                  <input
                    type="number"
                    min="0"
                    value={draft.stock}
                    onChange={(event) =>
                      patch({
                        stock: Math.max(0, Number(event.target.value)),
                      })
                    }
                    className={inputClass}
                  />
                </label>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {variants.map((variant, index) => (
                  <article
                    key={index}
                    className="rounded-2xl border border-black/10 bg-[#fafafa] p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-[1fr_150px_auto]">
                      <label>
                        <span className={labelClass}>Colour name</span>
                        <input
                          value={variant.name}
                          onChange={(event) =>
                            updateVariant(index, (current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </label>
                      <label>
                        <span className={labelClass}>Colour / hex</span>
                        <div className="mt-1.5 flex gap-2">
                          <input
                            type="color"
                            value={
                              /^#[0-9a-f]{6}$/i.test(variant.value)
                                ? variant.value
                                : "#111111"
                            }
                            onChange={(event) =>
                              updateVariant(index, (current) => ({
                                ...current,
                                value: event.target.value,
                              }))
                            }
                            className="h-11 w-12 rounded-lg border border-black/10 bg-white p-1"
                          />
                          <input
                            value={variant.value}
                            onChange={(event) =>
                              updateVariant(index, (current) => ({
                                ...current,
                                value: event.target.value,
                              }))
                            }
                            className="min-w-0 flex-1 rounded-xl border border-black/10 px-3 text-xs"
                          />
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="min-h-11 self-end rounded-xl border border-red-200 px-3 text-xs font-bold !text-red-600"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <span className={labelClass}>Colour images</span>
                        <span className="text-[10px] text-black/40">
                          {(variant.images ?? []).length} image(s)
                        </span>
                      </div>

                      {(variant.images ?? []).length ? (
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                          {(variant.images ?? []).map((url, imageIndex) => (
                            <div
                              key={url + imageIndex}
                              className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/5"
                            >
                              <img
                                src={url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                aria-label="Remove image"
                                onClick={() =>
                                  updateVariant(index, (current) => {
                                    const images = (current.images ?? []).filter(
                                      (_, currentIndex) =>
                                        currentIndex !== imageIndex,
                                    );
                                    return {
                                      ...current,
                                      images,
                                      image: images[0],
                                    };
                                  })
                                }
                                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs !text-white"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-black/20 bg-white px-3 text-[10px] font-bold">
                        {uploading === "variant-" + index
                          ? "Uploading…"
                          : "+ Add colour images"}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={Boolean(uploading)}
                          onChange={(event) =>
                            void uploadVariantImages(index, event)
                          }
                          className="sr-only"
                        />
                      </label>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <span className={labelClass}>Inventory</span>
                        <strong className="text-xs">
                          {variantStock(variant, draft.sizes)} units
                        </strong>
                      </div>

                      {draft.sizes.length ? (
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {draft.sizes.map((size) => (
                            <label
                              key={size}
                              className="rounded-xl border border-black/10 bg-white p-3"
                            >
                              <span className="text-[10px] font-bold text-black/45">
                                {size}
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={variant.sizeStocks?.[size] ?? 0}
                                onChange={(event) =>
                                  updateSizeStock(
                                    index,
                                    size,
                                    Number(event.target.value),
                                  )
                                }
                                className="mt-1 w-full bg-transparent text-lg font-bold outline-none"
                              />
                            </label>
                          ))}
                        </div>
                      ) : (
                        <label className="mt-2 block max-w-[220px]">
                          <span className={labelClass}>Colour stock</span>
                          <input
                            type="number"
                            min="0"
                            value={variant.stock ?? 0}
                            onChange={(event) =>
                              updateVariant(index, (current) => ({
                                ...current,
                                stock: Math.max(
                                  0,
                                  Number(event.target.value),
                                ),
                              }))
                            }
                            className={inputClass}
                          />
                        </label>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="product-offer" className="scroll-mt-6 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <p className={labelClass}>Offer</p>
            <div className="mt-3">
              <Toggle
                checked={Boolean(draft.offerEnabled)}
                onChange={(checked) => patch({ offerEnabled: checked })}
                label="Enable product offer"
                help="Offer card appears on storefront only when this is enabled and active."
              />
            </div>

            {draft.offerEnabled ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label>
                  <span className={labelClass}>Offer type</span>
                  <select
                    value={draft.offerType ?? "percentage"}
                    onChange={(event) =>
                      patch({
                        offerType: event.target.value as ProductOfferType,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="percentage">Percentage off</option>
                    <option value="fixed">Fixed amount off</option>
                    <option value="sale-price">Final sale price</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Offer value</span>
                  <input
                    type="number"
                    min="0"
                    value={draft.offerValue ?? ""}
                    onChange={(event) =>
                      patch({
                        offerValue: event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>Label</span>
                  <input
                    value={draft.offerLabel ?? ""}
                    onChange={(event) =>
                      patch({ offerLabel: event.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>Badge</span>
                  <input
                    value={draft.offerBadge ?? ""}
                    onChange={(event) =>
                      patch({ offerBadge: event.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>Starts at (your local time)</span>
                  <input
                    type="datetime-local"
                    value={toLocalDateTime(draft.offerStartsAt)}
                    onChange={(event) =>
                      patch({ offerStartsAt: toIso(event.target.value) })
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>Ends at (your local time)</span>
                  <input
                    type="datetime-local"
                    value={toLocalDateTime(draft.offerEndsAt)}
                    onChange={(event) =>
                      patch({ offerEndsAt: toIso(event.target.value) })
                    }
                    className={inputClass}
                  />
                </label>
                <div className="md:col-span-2">
                  <Toggle
                    checked={Boolean(draft.offerCountdown)}
                    onChange={(checked) =>
                      patch({ offerCountdown: checked })
                    }
                    label="Show countdown"
                    help="Requires an offer end time."
                  />
                </div>
              </div>
            ) : null}
          </section>

          <section id="product-homepage" className="scroll-mt-6 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <p className={labelClass}>Homepage placement</p>

            <div className="mt-3 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Toggle
                  checked={Boolean(draft.featured)}
                  onChange={(checked) => patch({ featured: checked })}
                  label="Featured product"
                  help="Adds this item to the Featured Products section. Reorder it from the Products page."
                />

                <Toggle
                  checked={Boolean(draft.spotlight)}
                  onChange={(checked) => patch({ spotlight: checked })}
                  label="Single product spotlight"
                  help="Only one product can be selected. Turning this on replaces the previous spotlight product."
                />
              </div>

              {draft.featured ? (
                <label className="block max-w-[220px]">
                  <span className={labelClass}>Featured position</span>
                  <input
                    type="number"
                    min="1"
                    value={draft.featuredSortOrder ?? ""}
                    onChange={(event) =>
                      patch({
                        featuredSortOrder: event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      })
                    }
                    placeholder="1"
                    className={inputClass}
                  />
                  <span className="mt-1 block text-[10px] text-black/40">
                    You can also use ↑ ↓ reorder controls on the Products page.
                  </span>
                </label>
              ) : null}

              <div className="mt-4 border-t border-black/10 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#001cac]">
                  Homepage selector
                </p>
                <p className="mt-1 text-[10px] leading-4 text-black/45">
                  Upload one foreground product image and one separate background image.
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-black/10 p-3">
                    <span className={labelClass}>Foreground product image</span>

                    {draft.featuredImage ? (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="relative h-28 w-24 overflow-hidden rounded-xl bg-[#f4f4f2]">
                          <img
                            src={draft.featuredImage}
                            alt=""
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => patch({ featuredImage: undefined })}
                          className="text-xs font-bold !text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}

                    <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-black/20 text-[10px] font-bold">
                      {uploading === "animation"
                        ? "Uploading…"
                        : "Choose foreground image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => void uploadAnimation(event)}
                        className="sr-only"
                      />
                    </label>

                    <span className="mt-2 block text-[10px] leading-4 text-black/40">
                      Transparent PNG/WebP works best for the front product layer.
                    </span>
                  </div>

                  <div className="rounded-xl border border-black/10 p-3">
                    <span className={labelClass}>Background image</span>

                    {draft.showcaseBackgroundImage ? (
                      <div className="mt-2">
                        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[#f4f4f2]">
                          <img
                            src={draft.showcaseBackgroundImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            patch({ showcaseBackgroundImage: undefined })
                          }
                          className="mt-2 text-xs font-bold !text-red-600"
                        >
                          Remove background
                        </button>
                      </div>
                    ) : null}

                    <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-black/20 text-[10px] font-bold">
                      {uploading === "showcase-background"
                        ? "Uploading…"
                        : "Choose background image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          void uploadShowcaseBackground(event)
                        }
                        className="sr-only"
                      />
                    </label>

                    <span className="mt-2 block text-[10px] leading-4 text-black/40">
                      Landscape lifestyle image recommended for the selector stage.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside id="product-images" className="order-1 min-w-0 scroll-mt-6 space-y-4 xl:order-2 xl:sticky xl:top-5 xl:self-start">
          <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
            <div className="relative h-60 bg-[#f1f1ef] xl:h-72">
              {primaryPreviewImage ? (
                <img
                  src={primaryPreviewImage}
                  alt={draft.name}
                  className="h-full w-full object-contain p-3"
                />
              ) : (
                <div className="grid h-full place-items-center text-xs text-black/40">
                  No main image
                </div>
              )}
            </div>
            <div className="p-4">
              <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-black/10 text-xs font-bold">
                {uploading === "main" ? "Uploading…" : "Change main image"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={Boolean(uploading)}
                  onChange={(event) => void uploadMain(event)}
                  className="sr-only"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <p className={labelClass}>Current draft summary</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-black/50">Stock</span>
                <strong>{totalStock}</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-black/50">Colours</span>
                <strong>{variants.length || draft.colors.length}</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-black/50">Sizes</span>
                <strong>{draft.sizes.length}</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-black/50">Offer</span>
                <strong className="capitalize">{offerStatus}</strong>
              </div>
              {draft.offerEnabled ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-black/50">Offer price</span>
                  <strong>₹{offerPrice.toLocaleString("en-IN")}</strong>
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </fieldset>

      <div className="fixed bottom-[78px] left-3 right-3 z-[90] flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-2 shadow-lg md:bottom-4 md:left-auto md:right-5">
        <span className="hidden px-2 text-xs text-black/50 sm:block">{dirty ? "Unsaved changes" : "Saved"}</span>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving || Boolean(uploading)}
          className="min-h-12 w-full rounded-xl bg-[#001cac] px-6 text-xs font-bold !text-white shadow-xl disabled:opacity-50 md:w-auto"
        >
          {saving ? "Saving product…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
