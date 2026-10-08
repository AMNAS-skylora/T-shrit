"use client";

import Image from "next/image";
import { ComfortHero } from "@/components/ComfortHero";
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
  HeroImagePosition,
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
  imagePosition: HeroImagePosition;
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
  imagePosition: "center",
  enabled: true,
  order: "0",
};

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#001cac] focus:ring-2 focus:ring-[#001cac]/10";
const labelClass =
  "text-[9px] font-bold uppercase tracking-[.1em] text-black/45";

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
  const [defaultDrawerOpen, setDefaultDrawerOpen] = useState(false);
  const [defaultSaving, setDefaultSaving] = useState(false);
  const [defaultUploading, setDefaultUploading] = useState(false);

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
      throw new Error(settingsData.error || "Could not load default hero.");
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

  const defaultPreviewImage = storeSettings?.homeDefaultHeroImageUrl || "";

  function patchDefaultHero(patch: Partial<StoreSettings>) {
    setStoreSettings((current) =>
      current ? ({ ...current, ...patch } as StoreSettings) : current,
    );
  }

  async function persistDefaultHero(settings: StoreSettings) {
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(Object.entries(settings).filter(([key]) => key.startsWith("homeDefaultHero")))),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not save default hero.");
    }

    setStoreSettings(data.settings);
    return data.settings as StoreSettings;
  }

  async function toggleDefaultHero() {
    if (!storeSettings || defaultSaving) return;
    setDefaultSaving(true);
    setMessage("");

    try {
      const next = {
        ...storeSettings,
        homeDefaultHeroEnabled: !storeSettings.homeDefaultHeroEnabled,
      };
      await persistDefaultHero(next);
      setMessage(
        next.homeDefaultHeroEnabled
          ? "First hero enabled."
          : "First hero disabled.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update default hero.",
      );
    } finally {
      setDefaultSaving(false);
    }
  }

  async function uploadDefaultHero(file: File) {
    if (!storeSettings) return;
    setDefaultUploading(true);
    setMessage("");

    const previous = storeSettings.homeDefaultHeroImageUrl;
    const previewUrl = URL.createObjectURL(file);
    patchDefaultHero({ homeDefaultHeroImageUrl: previewUrl });

    try {
      const uploaded = await uploadAdminImage(file, "kleidin/hero");
      patchDefaultHero({ homeDefaultHeroImageUrl: uploaded.url });
      setMessage(
        "First hero image uploaded. Save default hero to publish the change.",
      );
    } catch (error) {
      patchDefaultHero({ homeDefaultHeroImageUrl: previous });
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setDefaultUploading(false);
    }
  }

  async function saveDefaultHero() {
    if (!storeSettings || defaultSaving) return;
    setDefaultSaving(true);
    setMessage("");

    try {
      await persistDefaultHero(storeSettings);
      setDefaultDrawerOpen(false);
      setMessage("First hero saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save default hero.",
      );
    } finally {
      setDefaultSaving(false);
    }
  }

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
      imagePosition: slide.imagePosition ?? "center",
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
            Manage the first hero, then add extra slides. The first hero uses a large title, model image and a real product card.
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

      {storeSettings ? (
        <section className="mt-5 overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[.06]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
            <div className="min-w-0"><ComfortHero settings={storeSettings} products={products} preview /></div>

            <div className="flex flex-col justify-between p-4 sm:p-5">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={labelClass}>System hero</p>
                    <h2 className="mt-1 text-lg font-bold tracking-[-.025em]">
                      First hero
                    </h2>
                  </div>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[8px] font-bold uppercase " +
                      (storeSettings.homeDefaultHeroEnabled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-black/[.04] text-black/45")
                    }
                  >
                    {storeSettings.homeDefaultHeroEnabled ? "LIVE" : "HIDDEN"}
                  </span>
                </div>

                <p className="mt-3 text-[10px] leading-5 text-black/45">
                  Always available as the first hero. Custom, product and offer
                  heroes are shown after this slide.
                </p>

                <div className="mt-4 rounded-xl bg-[#f7f7f8] p-3">
                  <span className="block text-[8px] font-bold uppercase tracking-[.08em] text-black/30">
                    Image
                  </span>
                  <strong className="mt-1 block text-[10px]">
                    {storeSettings.homeDefaultHeroImageUrl
                      ? "Custom hero image"
                      : "No image · light background"}
                  </strong>
                  <span className="mt-1 block text-[8px] text-black/35">
                    1920 × 1080 · 16:9 HERO IMAGE
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={defaultSaving}
                  role="switch"
                  aria-checked={storeSettings.homeDefaultHeroEnabled}
                  aria-label="First hero enabled"
                  onClick={() => void toggleDefaultHero()}
                  className={
                    "min-h-11 rounded-xl px-3 text-[10px] font-bold disabled:opacity-50 " +
                    (storeSettings.homeDefaultHeroEnabled
                      ? "border border-black/10 bg-white"
                      : "bg-[#001cac] !text-white")
                  }
                >
                  {defaultSaving
                    ? "Saving…"
                    : storeSettings.homeDefaultHeroEnabled
                      ? "Turn off"
                      : "Turn on"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setDefaultDrawerOpen(true);
                  }}
                  className="min-h-11 rounded-xl bg-[#111] px-3 text-[10px] font-bold !text-white"
                >
                  Edit default hero
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-5">
        <div className="mb-3">
          <p className={labelClass}>Custom hero slides</p>
          <p className="mt-1 text-[10px] text-black/40">
            These slides appear after the default hero when enabled.
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

      {storeSettings ? (
        <AdminDrawer
          open={defaultDrawerOpen}
          title="Edit default hero"
          description="This built-in hero is always Hero 01 when enabled. Custom hero slides follow after it."
          onClose={() => {
            if (!defaultSaving && !defaultUploading) {
              setDefaultDrawerOpen(false);
              void load();
            }
          }}
          footer={
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <button
                type="button"
                disabled={defaultSaving || defaultUploading}
                onClick={() => {
                  setDefaultDrawerOpen(false);
                  void load();
                }}
                className="min-h-11 rounded-xl border border-black/10 px-5 text-xs font-bold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={defaultSaving || defaultUploading}
                onClick={() => void saveDefaultHero()}
                className="min-h-11 rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white disabled:opacity-50"
              >
                {defaultSaving ? "Saving…" : "Save default hero"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={labelClass}>First hero status</p>
                  <p className="mt-1 text-[10px] text-black/45">
                    When off, only your additional hero slides are shown.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    patchDefaultHero({
                      homeDefaultHeroEnabled:
                        !storeSettings.homeDefaultHeroEnabled,
                    })
                  }
                  className={
                    "min-h-10 rounded-full px-4 text-[9px] font-bold uppercase " +
                    (storeSettings.homeDefaultHeroEnabled
                      ? "bg-[#001cac] !text-white"
                      : "bg-black/[.05] text-black/50")
                  }
                >
                  {storeSettings.homeDefaultHeroEnabled ? "ON" : "OFF"}
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <p className={labelClass}>Content</p>
              <div className="mt-3 grid gap-3">
                <label>
                  <span className={labelClass}>Label</span>
                  <input
                    value={storeSettings.homeDefaultHeroLabel}
                    onChange={(event) =>
                      patchDefaultHero({
                        homeDefaultHeroLabel: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>Brand</span>
                  <input value={storeSettings.homeDefaultHeroBrand} onChange={(event) => patchDefaultHero({ homeDefaultHeroBrand: event.target.value })} className={inputClass} />
                </label>
                <label>
                  <span className={labelClass}>Title</span>
                  <textarea
                    value={storeSettings.homeDefaultHeroTitle}
                    onChange={(event) =>
                      patchDefaultHero({
                        homeDefaultHeroTitle: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>Subtitle</span>
                  <textarea
                    value={storeSettings.homeDefaultHeroSubtitle}
                    onChange={(event) =>
                      patchDefaultHero({
                        homeDefaultHeroSubtitle: event.target.value,
                      })
                    }
                    className={inputClass + " min-h-24 resize-y py-3"}
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label>
                    <span className={labelClass}>Button text</span>
                    <input
                      value={storeSettings.homeDefaultHeroButtonLabel}
                      onChange={(event) =>
                        patchDefaultHero({
                          homeDefaultHeroButtonLabel: event.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className={labelClass}>Button link</span>
                    <input
                      value={storeSettings.homeDefaultHeroButtonHref}
                      onChange={(event) =>
                        patchDefaultHero({
                          homeDefaultHeroButtonHref: event.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={labelClass}>First hero image</p>
                  <p className="mt-1 text-[10px] text-black/45">
                    Recommended: 1920 × 1080 (16:9). Uploads preserve subject framing.
                  </p>
                </div>
                {defaultUploading ? (
                  <span className="text-[9px] font-bold uppercase text-[#001cac]">
                    Uploading…
                  </span>
                ) : null}
              </div>

              <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-xl bg-[#e9e7e2]">
                {defaultPreviewImage ? (
                  storeSettings.homeDefaultHeroImageUrl.startsWith("blob:") ? (
                    <img
                      src={storeSettings.homeDefaultHeroImageUrl}
                      alt=""
                      className={
                        "h-full w-full object-contain " +
                        (storeSettings.homeDefaultHeroImagePosition === "left"
                          ? "object-left"
                          : storeSettings.homeDefaultHeroImagePosition === "right"
                            ? "object-right"
                            : "object-center")
                      }
                    />
                  ) : (
                    <Image
                      src={defaultPreviewImage}
                      alt=""
                      fill
                      sizes="640px"
                      className={
                        "object-contain " +
                        (storeSettings.homeDefaultHeroImagePosition === "left"
                          ? "object-left"
                          : storeSettings.homeDefaultHeroImagePosition === "right"
                            ? "object-right"
                            : "object-center")
                      }
                    />
                  )
                ) : (
                  <div className="grid h-full place-items-center text-[10px] text-black/35">
                    Light default background
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-black/20 px-3 text-center text-[10px] font-bold">
                  {storeSettings.homeDefaultHeroImageUrl
                    ? "Replace image"
                    : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={defaultUploading}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadDefaultHero(file);
                      event.target.value = "";
                    }}
                    className="sr-only"
                  />
                </label>

                <button
                  type="button"
                  disabled={!storeSettings.homeDefaultHeroImageUrl}
                  onClick={() =>
                    patchDefaultHero({ homeDefaultHeroImageUrl: "" })
                  }
                  className="min-h-11 rounded-xl border border-black/10 px-3 text-[10px] font-bold disabled:opacity-35"
                >
                  Remove image
                </button>
              </div>

              <label className="mt-3 block">
                <span className={labelClass}>Image position</span>
                <select
                  value={storeSettings.homeDefaultHeroImagePosition}
                  onChange={(event) =>
                    patchDefaultHero({
                      homeDefaultHeroImagePosition: event.target.value as
                        | "left"
                        | "center"
                        | "right",
                    })
                  }
                  className={inputClass}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </section>
          </div>
        </AdminDrawer>
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
        <form
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
              <label>
                <span className={labelClass}>Eyebrow / label</span>
                <input
                  value={draft.label}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  placeholder="KLEID.IN"
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>Badge</span>
                <input
                  value={draft.badge}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      badge: event.target.value,
                    }))
                  }
                  placeholder="NEW DROP"
                  className={inputClass}
                />
              </label>

              {draft.kind === "offer" ? (
                <label className="md:col-span-2">
                  <span className={labelClass}>Offer / discount text</span>
                  <input
                    value={draft.discountText}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        discountText: event.target.value,
                      }))
                    }
                    placeholder="UP TO 40% OFF"
                    className={inputClass}
                  />
                </label>
              ) : null}

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

              <label className="md:col-span-2">
                <span className={labelClass}>Subtitle</span>
                <textarea
                  value={draft.subtitle}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      subtitle: event.target.value,
                    }))
                  }
                  placeholder={
                    draft.kind === "product"
                      ? "Leave empty to use product description"
                      : "Short hero description"
                  }
                  className={inputClass + " min-h-24 resize-y py-3"}
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

              <label>
                <span className={labelClass}>Button style</span>
                <select
                  value={draft.ctaStyle}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      ctaStyle: event.target.value as HeroCtaStyle,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="outline">Outline</option>
                </select>
              </label>

              <label>
                <span className={labelClass}>Image position</span>
                <select
                  value={draft.imagePosition}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      imagePosition: event.target.value as HeroImagePosition,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
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

            {previewImage ? (
              <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-xl bg-black/[.04]">
                {draft.imageUrl.startsWith("blob:") ? (
                  <img
                    src={draft.imageUrl}
                    alt=""
                    className={
                      "h-full w-full object-contain " +
                      (draft.imagePosition === "left"
                        ? "object-left"
                        : draft.imagePosition === "right"
                          ? "object-right"
                          : "object-center")
                    }
                  />
                ) : (
                  <Image
                    src={previewImage}
                    alt=""
                    fill
                    sizes="640px"
                    className={
                      "object-contain " +
                      (draft.imagePosition === "left"
                        ? "object-left"
                        : draft.imagePosition === "right"
                          ? "object-right"
                          : "object-center")
                    }
                  />
                )}
              </div>
            ) : null}

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
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    showCountdown:
                      Boolean(current.endsAt) && !current.showCountdown,
                  }))
                }
                disabled={!draft.endsAt}
                className={
                  "flex min-h-12 items-center justify-between rounded-xl border px-4 text-left text-xs font-bold disabled:opacity-40 " +
                  (draft.showCountdown
                    ? "border-[#001cac] bg-[#001cac]/[.04] text-[#001cac]"
                    : "border-black/10")
                }
              >
                <span>Countdown timer</span>
                <span>{draft.showCountdown ? "ON" : "OFF"}</span>
              </button>

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
                    className={
                      "object-contain " +
                      (slide.imagePosition === "left"
                        ? "object-left"
                        : slide.imagePosition === "right"
                          ? "object-right"
                          : "object-center")
                    }
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
