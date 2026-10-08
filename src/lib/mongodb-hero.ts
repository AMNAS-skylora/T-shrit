import "server-only";
import { normalizeHeroImagePlacement } from "@/lib/hero-image-placement";

import { createHash, randomUUID } from "node:crypto";
import { ObjectId, type Document } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type {
  HeroCtaStyle,
  HeroImagePosition,
  HeroSlideConfig,
  HeroSlideKind,
} from "@/data/hero-slides";

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function kind(value: unknown): HeroSlideKind {
  return value === "product" ||
    value === "offer" ||
    value === "collection"
    ? value
    : "custom";
}

function ctaStyle(value: unknown): HeroCtaStyle {
  return value === "dark" || value === "outline" ? value : "light";
}

function imagePosition(value: unknown): HeroImagePosition {
  return "center";
}

function toSlide(doc: Document): HeroSlideConfig {
  return {
    id: String(doc._id),
    kind: kind(doc.kind),
    section: doc.section === "secondary" ? "secondary" : "primary",
    tickerText: text(doc.tickerText),
    productId: text(doc.productId) || null,
    label: text(doc.label),
    title: text(doc.title),
    subtitle: text(doc.subtitle),
    button: text(doc.button),
    href: text(doc.href),
    badge: text(doc.badge),
    discountText: text(doc.discountText) || undefined,
    imageUrl: text(doc.imageUrl),
    startsAt: text(doc.startsAt) || null,
    endsAt: text(doc.endsAt) || null,
    showCountdown: bool(doc.showCountdown),
    ctaStyle: ctaStyle(doc.ctaStyle),
    imagePosition: imagePosition(doc.imagePosition),
    imagePlacement: normalizeHeroImagePlacement(doc.imagePlacement),
    enabled: bool(doc.enabled, true),
    order: number(doc.order),
  };
}

function fields(input: Record<string, unknown>, current?: HeroSlideConfig) {
  return {
    section: input.section !== undefined ? (input.section === "secondary" ? "secondary" : "primary") : current?.section ?? "primary",
    tickerText: text(input.tickerText, current?.tickerText),
    kind: input.kind !== undefined ? kind(input.kind) : current?.kind ?? "custom",
    productId: text(input.productId, current?.productId ?? "") || null,
    label: text(input.label, current?.label),
    title: text(input.title, current?.title),
    subtitle: text(input.subtitle, current?.subtitle),
    button: text(input.button, current?.button),
    href: text(input.href, current?.href),
    badge: text(input.badge, current?.badge),
    discountText:
      text(input.discountText, current?.discountText) || undefined,
    imageUrl: text(input.imageUrl, current?.imageUrl),
    startsAt: text(input.startsAt, current?.startsAt ?? "") || null,
    endsAt: text(input.endsAt, current?.endsAt ?? "") || null,
    showCountdown:
      typeof input.showCountdown === "boolean"
        ? input.showCountdown
        : current?.showCountdown ?? false,
    ctaStyle:
      input.ctaStyle !== undefined
        ? ctaStyle(input.ctaStyle)
        : current?.ctaStyle ?? "light",
    imagePosition:
      input.imagePosition !== undefined
        ? imagePosition(input.imagePosition)
        : current?.imagePosition ?? "center",
    imagePlacement: normalizeHeroImagePlacement(input.imagePlacement, current?.imagePlacement),
    enabled:
      typeof input.enabled === "boolean"
        ? input.enabled
        : current?.enabled ?? true,
    order:
      input.order !== undefined ? number(input.order) : current?.order ?? 0,
  };
}

// Convert the existing first hero into a regular editable slide once.
// A stable id makes concurrent admin/storefront reads safe; the marker prevents
// deleted or disabled slides from being recreated from the old settings.
async function migrateFirstHero(db: Awaited<ReturnType<typeof getDb>>) {
  const settings = await db.collection("siteSettings").findOne({ key: "storefront" });
  if (!settings || settings.homeDefaultHeroMigrated || (!settings.homeDefaultHeroEnabled && !text(settings.homeDefaultHeroImageUrl))) return;
  const id = new ObjectId(createHash("sha256").update("kleidin/legacy-first-hero").digest("hex").slice(0, 24));
  const first = await db.collection("heroSlides").find({}).sort({ order: 1 }).limit(1).toArray();
  await db.collection("heroSlides").updateOne({ _id: id }, { $setOnInsert: {
    id: randomUUID(), kind: "custom", title: text(settings.homeDefaultHeroTitle),
    imageUrl: text(settings.homeDefaultHeroImageUrl), imagePosition: "center",
    imagePlacement: normalizeHeroImagePlacement(settings.homeDefaultHeroImagePlacement),
    button: text(settings.homeDefaultHeroButtonLabel, "Shop collection"),
    href: text(settings.homeDefaultHeroButtonHref, "/products"),
    enabled: bool(settings.homeDefaultHeroEnabled), order: first.length ? number(first[0].order) - 1 : 0,
    createdAt: new Date(), updatedAt: new Date(),
  } }, { upsert: true });
  await db.collection("siteSettings").updateOne({ key: "storefront" }, { $set: { homeDefaultHeroMigrated: true, homeDefaultHeroEnabled: false } });
}

export async function listHeroSlides(options?: { enabledOnly?: boolean }) {
  const db = await getDb();
  await migrateFirstHero(db);
  const rows = await db
    .collection("heroSlides")
    .find(options?.enabledOnly ? { enabled: true } : {})
    .sort({ order: 1, createdAt: 1 })
    .toArray();
  return rows.map(toSlide);
}

export async function getHeroSlide(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const row = await db
    .collection("heroSlides")
    .findOne({ _id: new ObjectId(id) });
  return row ? toSlide(row) : null;
}

export async function createHeroSlide(input: Record<string, unknown>) {
  const db = await getDb();
  const now = new Date();
  const result = await db.collection("heroSlides").insertOne({
    id: randomUUID(),
    ...fields(input),
    createdAt: now,
    updatedAt: now,
  });
  return getHeroSlide(result.insertedId.toHexString());
}

export async function updateHeroSlide(
  id: string,
  input: Record<string, unknown>,
) {
  const current = await getHeroSlide(id);
  if (!current || !ObjectId.isValid(id)) return null;
  const db = await getDb();
  await db.collection("heroSlides").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...fields(input, current), updatedAt: new Date() } },
  );
  return getHeroSlide(id);
}

export async function deleteHeroSlide(id: string) {
  if (!ObjectId.isValid(id)) return false;
  const db = await getDb();
  const result = await db
    .collection("heroSlides")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
