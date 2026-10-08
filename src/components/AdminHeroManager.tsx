"use client";

import Image from "next/image";
import { AdminHeroImageControls } from "@/components/AdminHeroImageControls";
import { normalizeHeroImagePlacement, type HeroImagePlacement } from "@/lib/hero-image-placement";
import { HomeHeroSlider } from "@/components/HomeHeroSlider";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AdminDrawer } from "@/components/AdminDrawer";
import type {
  HeroCtaStyle,
  HeroSlideConfig,
  HeroSlideKind,
} from "@/data/hero-slides";
import type { Product } from "@/types/product";
import type { StoreSettings } from "@/types/commerce";
import { getProductPrimaryImage } from "@/lib/product-images";
import { uploadAdminImage } from "@/lib/admin-image-upload";

type Draft = {
  title: string;
  label: string;
  subtitle: string;
  button: string;
  href: string;
  badge: string;
  discountText: string;
  imageUrl: string;
  kind: HeroSlideKind;
  productId: string;
  startsAt: string;
  endsAt: string;
  showCountdown: boolean;
  ctaStyle: HeroCtaStyle;
  imagePlacement: HeroImagePlacement;
  enabled: boolean;
  order: string;
};

const emptyDraft: Draft = {
  title: "",
  label: "KLEID.IN",
  subtitle: "",
  button: "Shop now",
  href: "/products",
  badge: "",
  discountText: "",
  imageUrl: "",
  kind: "custom",
  productId: "",
  startsAt: "",
  endsAt: "",
  showCountdown: false,
  ctaStyle: "dark",
  imagePlacement: normalizeHeroImagePlacement(undefined),
  enabled: true,
  order: "0",
};

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#001cac] focus:ring-2 focus:ring-[#001cac]/10";
const labelClass =
  "text-[10px] font-bold uppercase tracking-[.1em] text-black/45";

function dateTimeInput(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(
    parsed.getTime() - parsed.getTimezoneOffset() * 60_000,
  );
  return local.toISOString().slice(0, 16);
}

function apiDate(value: string) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function kindLabel(kind: HeroSlideKind) {
  if (kind === "product") return "Product";
  if (kind === "offer") return "Offer";
  if (kind === "collection") return "Collection";
  return "Custom";
}

function scheduleStatus(slide: HeroSlideConfig) {
  const now = Date.now();
  const start = slide.startsAt ? new Date(slide.startsAt).getTime() : null;
  const end = slide.endsAt ? new Date(slide.endsAt).getTime() : null;

  if (!slide.enabled) return "Hidden";
  if (start && Number.isFinite(start) && now < start) return "Scheduled";
  if (end && Number.isFinite(end) && now > end) return "Ended";
  return "Live";
}

export function AdminHeroManager() {
  const [slides, setSlides] = useState<HeroSlideConfig[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  async function load() {
    const [heroResponse, productResponse, settingsResponse] = await Promise.all([
      fetch("/api/admin/hero", { cache: "no-store" }),
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch("/api/admin/settings", { cache: "no-store" }),
    ]);

    const [heroData, productData, settingsData] = await Promise.all([
      heroResponse.json(),
      productResponse.json(),
      settingsResponse.json(),
    ]);

    if (!heroResponse.ok) {
      throw new Error(heroData.error || "Could not load hero slides.");
    }
    if (!productResponse.ok) {
      throw new Error(productData.error || "Could not load products.");
    }
    if (!settingsResponse.ok) {
      throw new Error(settingsData.error || "Could not load hero settings.");
    }

    setSlides(heroData.slides || []);
    setProducts(productData.products || []);
    setStoreSettings(settingsData.settings || null);
  }

  useEffect(() => {
    void load().catch((error) =>
      setMessage(
        error instanceof Error ? error.message : "Could not load hero.",
      ),
    );
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === draft.productId),
    [draft.productId, products],
  );

  const productImage = selectedProduct
    ? getProductPrimaryImage(selectedProduct)
    : "";

  const previewImage = draft.imageUrl || productImage;


  function reset() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  function openCreate(kind: HeroSlideKind = "custom") {
    reset();
    setDraft({
      ...emptyDraft,
      kind,
      button:
        kind === "product"
          ? "View product"
          : kind === "offer"
            ? "Shop offer"
            : kind === "collection"
              ? "Explore collection"
              : "Shop now",
    });
    setMessage("");
    setDrawerOpen(true);
  }

  function edit(slide: HeroSlideConfig) {
    setEditingId(slide.id);
    setDraft({
      title: slide.title,
      label: slide.label,
      subtitle: slide.subtitle,
      button: slide.button,
      href: slide.href,
      badge: slide.badge,
      discountText: slide.discountText || "",
      imageUrl: slide.imageUrl,
      kind: slide.kind,
      productId: slide.productId || "",
      startsAt: dateTimeInput(slide.startsAt),
      endsAt: dateTimeInput(slide.endsAt),
      showCountdown: Boolean(slide.showCountdown),
      ctaStyle: slide.ctaStyle ?? "dark",
      imagePlacement: normalizeHeroImagePlacement(slide.imagePlacement),
      enabled: slide.enabled,
      order: String(slide.order),
    });
    setMessage("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (uploading || saving) return;
    setDrawerOpen(false);
    reset();
  }

  function changeKind(kind: HeroSlideKind) {
    setDraft((current) => ({
      ...current,
      kind,
      productId:
        kind === "product" || kind === "offer" ? current.productId : "",
      discountText: kind === "offer" ? current.discountText : "",
      showCountdown: kind === "offer" ? current.showCountdown : false,
      button:
        kind === "product"
          ? current.button || "View product"
          : kind === "offer"
            ? current.button || "Shop offer"
            : kind === "collection"
              ? current.button || "Explore collection"
              : current.button || "Shop now",
    }));
  }

  function selectProduct(productId: string) {
    const product = products.find((item) => item.id === productId);

    setDraft((current) => ({
      ...current,
      productId,
      title:
        current.title ||
        (current.kind === "product" ? product?.name || "" : current.title),
      subtitle:
        current.subtitle ||
        (current.kind === "product"
          ? product?.description || ""
          : current.subtitle),
      label:
        current.label === "KLEID.IN" && product?.category
          ? product.category
          : current.label,
      href:
        product && (!current.href || current.href === "/products")
          ? "/products/" + product.slug
          : current.href,
    }));
  }

  async function upload(file: File) {
    setUploading(true);
    setMessage("");

    const previous = draft.imageUrl;
    const previewUrl = URL.createObjectURL(file);
    setDraft((current) => ({ ...current, imageUrl: previewUrl }));

    try {
      const uploaded = await uploadAdminImage(file, "kleidin/hero");

      setDraft((current) => ({
        ...current,
        imageUrl: uploaded.url,
      }));
      setMessage("Hero image uploaded. Original composition is preserved for responsive cropping.");
    } catch (error) {
      setDraft((current) => ({ ...current, imageUrl: previous }));
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploading(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      if (draft.kind === "product" && !draft.productId) {
        throw new Error("Choose a product for a product hero.");
      }

      if (
        draft.startsAt &&
        draft.endsAt &&
        new Date(draft.endsAt).getTime() <= new Date(draft.startsAt).getTime()
      ) {
        throw new Error("Hero end time must be after the start time.");
      }

      const payload = {
        ...draft,
        imagePosition: "center",
        title:
          draft.title ||
          (draft.kind === "product" ? selectedProduct?.name || "" : ""),
        subtitle:
          draft.subtitle ||
          (draft.kind === "product"
            ? selectedProduct?.description || ""
            : ""),
        href:
          draft.href ||
          (selectedProduct
            ? "/products/" + selectedProduct.slug
            : "/products"),
        startsAt: draft.startsAt ? apiDate(draft.startsAt) : "",
        endsAt: draft.endsAt ? apiDate(draft.endsAt) : "",
        showCountdown:
          draft.showCountdown && Boolean(draft.endsAt),
        order: Number(draft.order || 0),
      };

      const response = await fetch(
        editingId ? "/api/admin/hero/" + editingId : "/api/admin/hero",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save hero slide.");
      }

      reset();
      setDrawerOpen(false);
      setMessage("Hero saved.");
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save hero slide.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this hero slide?")) return;

    const response = await fetch("/api/admin/hero/" + id, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not delete hero slide.");
      return;
    }

    setMessage("Hero deleted.");
    await load();
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[.16em] text-[#001cac]">
            HOMEPAGE
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">
            Hero builder
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-5 text-black/45">
            Create as many slides as you need. Enabled live slides rotate every five seconds, in position order. Images stay centered; adjust image size separately for desktop and mobile.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreate("custom")}
          className="min-h-11 w-full rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white sm:w-auto"
        >
          + Add hero
        </button>
      </div>

      {storeSettings ? <div className="mt-5 overflow-hidden rounded-2xl border border-black/10"><HomeHeroSlider settings={storeSettings} products={products} slides={slides} initialNow={Date.now()} preview /></div> : null}

      <div className="mt-5">
        <div className="mb-3">
          <p className={labelClass}>Hero slides</p>
          <p className="mt-1 text-[10px] text-black/40">
            Every slide uses the same layout. There is no default slide or slide-count limit. Only enabled, live slides are shown.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {(
          [
            ["product", "Product hero"],
            ["offer", "Offer hero"],
            ["collection", "Collection"],
            ["custom", "Custom hero"],
          ] as Array<[HeroSlideKind, string]>
        ).map(([kind, text]) => (
          <button
            key={kind}
            type="button"
            onClick={() => openCreate(kind)}
            className="min-h-[74px] rounded-2xl bg-white p-4 text-left ring-1 ring-black/5 transition hover:ring-[#001cac]/20"
          >
            <span className="text-[9px] font-bold uppercase tracking-[.1em] text-[#001cac]">
              {kind}
            </span>
            <strong className="mt-1 block text-xs">{text}</strong>
          </button>
        ))}
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl bg-white px-4 py-3 text-xs font-medium text-black/60 ring-1 ring-black/5">
          {message}
        </p>
      ) : null}

      <AdminDrawer
        open={drawerOpen}
        title={editingId ? "Edit hero" : "Create hero"}
        description="Choose a hero type, content, schedule, image and action. Empty product fields can inherit from the selected product."
        onClose={closeDrawer}
        footer={
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={closeDrawer}
              disabled={uploading || saving}
              className="min-h-11 rounded-xl border border-black/10 px-5 text-xs font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="hero-builder-form"
              disabled={uploading || saving}
              className="min-h-11 rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : editingId
                  ? "Update hero"
                  : "Create hero"}
            </button>
          </div>
        }
      >
        <form data-admin-form
          id="hero-builder-form"
          onSubmit={save}
          className="space-y-4"
        >
          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <p className={labelClass}>Hero type</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  ["product", "Product"],
                  ["offer", "Offer"],
                  ["collection", "Collection"],
                  ["custom", "Custom"],
                ] as Array<[HeroSlideKind, string]>
              ).map(([kind, text]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => changeKind(kind)}
                  className={
                    "min-h-12 rounded-xl border px-3 text-xs font-bold transition " +
                    (draft.kind === kind
                      ? "border-[#001cac] bg-[#001cac] !text-white"
                      : "border-black/10 bg-white text-black/60")
                  }
                >
                  {text}
                </button>
              ))}
            </div>
          </section>

          {(draft.kind === "product" || draft.kind === "offer") ? (
            <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <label>
                <span className={labelClass}>
                  {draft.kind === "product"
                    ? "Product"
                    : "Linked product (optional)"}
                </span>
                <select
                  value={draft.productId}
                  onChange={(event) => selectProduct(event.target.value)}
                  required={draft.kind === "product"}
                  className={inputClass}
                >
                  <option value="">
                    {draft.kind === "product"
                      ? "Choose product"
                      : "No linked product"}
                  </option>
                  {products
                    .filter((product) => product.status !== "draft")
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {product.sku}
                      </option>
                    ))}
                </select>
              </label>

              {selectedProduct ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-black/[.025] p-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-black/[.04]">
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <strong className="block truncate text-xs">
                      {selectedProduct.name}
                    </strong>
                    <span className="mt-1 block text-[10px] text-black/45">
                      ₹{selectedProduct.price.toLocaleString("en-IN")} ·{" "}
                      {selectedProduct.stock} stock
                    </span>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <p className={labelClass}>Content</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">

              <label className="md:col-span-2">
                <span className={labelClass}>Hero title</span>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder={
                    draft.kind === "product"
                      ? "Leave empty to use product name"
                      : "Hero title"
                  }
                  required={draft.kind !== "product"}
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <p className={labelClass}>Button / action</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label>
                <span className={labelClass}>Button text</span>
                <input
                  value={draft.button}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      button: event.target.value,
                    }))
                  }
                  placeholder="Shop now"
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>Button link</span>
                <input
                  value={draft.href}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      href: event.target.value,
                    }))
                  }
                  placeholder="/products or https://..."
                  className={inputClass}
                />
              </label>


            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={labelClass}>Hero image</p>
                <p className="mt-1 text-[10px] text-black/45">
                  Custom image overrides the linked product image. Uploads are automatically normalized to 1920 × 1080 (16:9).
                </p>
              </div>
              {uploading ? (
                <span className="text-[9px] font-bold uppercase text-[#001cac]">
                  Uploading…
                </span>
              ) : null}
            </div>

            {storeSettings ? <AdminHeroImageControls
              value={draft.imagePlacement}
              onChange={(imagePlacement) => setDraft((current) => ({ ...current, imagePlacement }))}
              settings={{ ...storeSettings, homeDefaultHeroTitle: draft.title || selectedProduct?.name || "", homeDefaultHeroImageUrl: previewImage, homeDefaultHeroImagePosition: "center", homeDefaultHeroButtonLabel: draft.button, homeDefaultHeroButtonHref: draft.href }}
              products={selectedProduct ? [selectedProduct] : []}
              disabled={saving || uploading}
            /> : null}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-black/20 px-3 text-center text-[10px] font-bold">
                {draft.imageUrl ? "Replace image" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0];
                    if (file) void upload(file);
                    event.target.value = "";
                  }}
                  className="sr-only"
                />
              </label>

              <button
                type="button"
                disabled={!draft.imageUrl}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    imageUrl: "",
                  }))
                }
                className="min-h-11 rounded-xl border border-black/10 px-3 text-[10px] font-bold disabled:opacity-35"
              >
                Use product / no image
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <p className={labelClass}>Schedule / timing</p>
            <p className="mt-1 text-[10px] leading-5 text-black/45">
              Leave both empty for an always-live hero. Add start/end times for
              campaigns and limited offers.
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label>
                <span className={labelClass}>Start time</span>
                <input
                  type="datetime-local"
                  value={draft.startsAt}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      startsAt: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>End time</span>
                <input
                  type="datetime-local"
                  value={draft.endsAt}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      endsAt: event.target.value,
                      showCountdown: event.target.value
                        ? current.showCountdown
                        : false,
                    }))
                  }
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">

              <label className="flex min-h-12 items-center justify-between rounded-xl border border-black/10 px-4 text-xs font-bold">
                <span>Slide enabled</span>
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      enabled: event.target.checked,
                    }))
                  }
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <label>
              <span className={labelClass}>Slide position / order</span>
              <input
                type="number"
                value={draft.order}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    order: event.target.value,
                  }))
                }
                placeholder="1, 2, 3…"
                className={inputClass}
              />
            </label>
          </section>

          {message ? (
            <p className="rounded-xl bg-white px-4 py-3 text-xs font-medium text-black/60 ring-1 ring-black/5">
              {message}
            </p>
          ) : null}
        </form>
      </AdminDrawer>

      <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {slides.map((slide) => {
          const linkedProduct = slide.productId
            ? products.find((product) => product.id === slide.productId)
            : undefined;
          const image =
            slide.imageUrl ||
            (linkedProduct ? getProductPrimaryImage(linkedProduct) : "");
          const status = scheduleStatus(slide);

          return (
            <article
              key={slide.id}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5"
            >
              <div className="relative aspect-[16/9] bg-black/[.04]">
                {image ? (
                  <Image
                    src={image}
                    alt={slide.title || linkedProduct?.name || "Hero"}
                    fill
                    sizes="420px"
                    className="object-contain object-center"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-[10px] text-black/35">
                    No hero image
                  </div>
                )}

                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-bold uppercase backdrop-blur">
                    {kindLabel(slide.kind)}
                  </span>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[8px] font-bold uppercase backdrop-blur " +
                      (status === "Live"
                        ? "bg-emerald-100/95 text-emerald-800"
                        : status === "Scheduled"
                          ? "bg-amber-100/95 text-amber-800"
                          : "bg-white/90 text-black/55")
                    }
                  >
                    {status}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <p className="text-[9px] font-bold uppercase tracking-[.1em] text-[#001cac]">
                  Position {slide.order}
                </p>
                <h2 className="mt-2 truncate font-bold">
                  {slide.title || linkedProduct?.name || "Untitled hero"}
                </h2>

                {linkedProduct ? (
                  <p className="mt-1 truncate text-[10px] text-black/45">
                    Product · {linkedProduct.name}
                  </p>
                ) : null}

                {slide.discountText ? (
                  <p className="mt-2 text-[10px] font-bold text-black/65">
                    {slide.discountText}
                  </p>
                ) : null}

                {(slide.startsAt || slide.endsAt) ? (
                  <div className="mt-3 rounded-xl bg-black/[.025] p-3 text-[9px] leading-5 text-black/50">
                    {slide.startsAt ? (
                      <p>
                        Start:{" "}
                        {new Date(slide.startsAt).toLocaleString("en-IN")}
                      </p>
                    ) : null}
                    {slide.endsAt ? (
                      <p>
                        End: {new Date(slide.endsAt).toLocaleString("en-IN")}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => edit(slide)}
                    className="min-h-10 rounded-lg border border-black/10 px-3 text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(slide.id)}
                    className="min-h-10 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!slides.length ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white p-6 md:col-span-2 xl:col-span-3">
            <strong className="text-sm">No hero slides yet.</strong>
            <p className="mt-1 text-[10px] text-black/45">
              Create a Product, Offer, Collection or Custom hero above.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
