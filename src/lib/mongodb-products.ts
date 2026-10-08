import { getProductIdentifiers } from "@/lib/product-identifiers";
import { validateProductOffer } from "@/lib/product-offers";
import "server-only";

import { randomUUID } from "node:crypto";
import { ObjectId, type Document } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type {
  Product,
  ProductColorVariant,
  ProductOfferType,
  ProductStatus,
} from "@/types/product";

function objectId(id: string) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function strings(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => text(item)).filter(Boolean)
    : [];
}


function status(value: unknown): ProductStatus {
  return value === "draft" || value === "sold-out" ? value : "active";
}

function offerType(value: unknown): ProductOfferType | undefined {
  return value === "sale-price" || value === "percentage" || value === "fixed"
    ? value
    : undefined;
}

function variants(value: unknown): ProductColorVariant[] {
  if (!Array.isArray(value)) return [];

  return value
    .map<ProductColorVariant | null>((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const source = entry as Record<string, unknown>;
      const name = text(source.name);
      if (!name) return null;

      const rawSizeStocks =
        source.sizeStocks && typeof source.sizeStocks === "object"
          ? (source.sizeStocks as Record<string, unknown>)
          : {};

      const sizeStocks = Object.fromEntries(
        Object.entries(rawSizeStocks)
          .map(([key, stock]) => [key, Math.max(0, number(stock))] as const)
          .filter(([key]) => Boolean(key)),
      ) as Record<string, number>;

      return {
        name,
        value: text(source.value, name),
        image: text(source.image) || undefined,
        images: strings(source.images),
        stock: Math.max(0, number(source.stock)),
        sizeStocks,
      } satisfies ProductColorVariant;
    })
    .filter((entry): entry is ProductColorVariant => entry !== null);
}

function toProduct(doc: Document): Product {
  return {
    id: String(doc._id),
    sku: text(doc.sku),
    name: text(doc.name),
    slug: text(doc.slug),
    wholesaleSlug: text(doc.wholesaleSlug) || undefined,
    category: text(doc.category),
    price: number(doc.price),
    costPrice:
      doc.costPrice === null || doc.costPrice === undefined
        ? undefined
        : Math.max(0, number(doc.costPrice)),
    compareAtPrice:
      doc.compareAtPrice === null || doc.compareAtPrice === undefined
        ? undefined
        : number(doc.compareAtPrice),
    offerEnabled: bool(doc.offerEnabled),
    offerType: offerType(doc.offerType),
    offerValue:
      doc.offerValue === null || doc.offerValue === undefined
        ? undefined
        : number(doc.offerValue),
    offerLabel: text(doc.offerLabel) || undefined,
    offerBadge: text(doc.offerBadge) || undefined,
    offerStartsAt: text(doc.offerStartsAt) || undefined,
    offerEndsAt: text(doc.offerEndsAt) || undefined,
    offerCountdown: bool(doc.offerCountdown),
    saleEndsAt: text(doc.saleEndsAt) || undefined,
    saleLabel: text(doc.saleLabel) || undefined,
    description: text(doc.description),
    sizes: strings(doc.sizes),
    colors: strings(doc.colors),
    colorVariants: variants(doc.colorVariants),
    stock: Math.max(0, number(doc.stock)),
    wholesaleEnabled: bool(doc.wholesaleEnabled),
    wholesalePrice:
      doc.wholesalePrice === null || doc.wholesalePrice === undefined
        ? undefined
        : number(doc.wholesalePrice),
    wholesaleMinOrder:
      doc.wholesaleMinOrder === null || doc.wholesaleMinOrder === undefined
        ? undefined
        : number(doc.wholesaleMinOrder),
    featured: bool(doc.featured),
    featuredSortOrder:
      doc.featuredSortOrder === null || doc.featuredSortOrder === undefined
        ? undefined
        : number(doc.featuredSortOrder),
    featuredAnimationEnabled: bool(doc.featuredAnimationEnabled),
    animationSortOrder:
      doc.animationSortOrder === null || doc.animationSortOrder === undefined
        ? undefined
        : number(doc.animationSortOrder),
    spotlight: bool(doc.spotlight),
    featuredImage: text(doc.featuredImage) || undefined,
    showcaseBackgroundImage:
      text(doc.showcaseBackgroundImage) || undefined,
    status: status(doc.status),
    image: text(doc.image) || undefined,
    sortOrder:
      doc.sortOrder === null || doc.sortOrder === undefined
        ? undefined
        : number(doc.sortOrder),
  };
}

function productFields(
  input: Record<string, unknown>,
  current?: Product,
): Omit<Product, "id"> {
  const name = text(input.name, current?.name);
  const { sku, slug } = getProductIdentifiers(name, {
    sku: text(input.sku), slug: text(input.slug),
  }, randomUUID(), current);

  if (!name) throw new Error("Product name is required.");

  const featured =
    typeof input.featured === "boolean" ? input.featured : current?.featured ?? false;
  const nextStatus =
    input.status !== undefined ? status(input.status) : current?.status ?? "active";

  return {
    sku,
    name,
    slug,
    wholesaleSlug:
      text(input.wholesaleSlug, current?.wholesaleSlug) || undefined,
    category: text(input.category, current?.category),
    price: Math.max(0, number(input.price, current?.price)),
    costPrice:
      input.costPrice === null
        ? undefined
        : input.costPrice !== undefined
          ? Math.max(0, number(input.costPrice))
          : current?.costPrice,
    compareAtPrice:
      input.compareAtPrice === null
        ? undefined
        : input.compareAtPrice !== undefined
          ? Math.max(0, number(input.compareAtPrice))
          : current?.compareAtPrice,
    offerEnabled:
      typeof input.offerEnabled === "boolean"
        ? input.offerEnabled
        : current?.offerEnabled ?? false,
    offerType:
      input.offerType !== undefined
        ? offerType(input.offerType)
        : current?.offerType,
    offerValue:
      input.offerValue === null
        ? undefined
        : input.offerValue !== undefined
          ? Math.max(0, number(input.offerValue))
          : current?.offerValue,
    offerLabel: text(input.offerLabel, current?.offerLabel) || undefined,
    offerBadge: text(input.offerBadge, current?.offerBadge) || undefined,
    offerStartsAt:
      text(input.offerStartsAt, current?.offerStartsAt) || undefined,
    offerEndsAt: text(input.offerEndsAt, current?.offerEndsAt) || undefined,
    offerCountdown:
      typeof input.offerCountdown === "boolean"
        ? input.offerCountdown
        : current?.offerCountdown ?? false,
    saleEndsAt: text(input.saleEndsAt, current?.saleEndsAt) || undefined,
    saleLabel: text(input.saleLabel, current?.saleLabel) || undefined,
    description: text(input.description, current?.description),
    sizes: input.sizes !== undefined ? strings(input.sizes) : current?.sizes ?? [],
    colors:
      input.colors !== undefined ? strings(input.colors) : current?.colors ?? [],
    colorVariants:
      input.colorVariants !== undefined
        ? variants(input.colorVariants)
        : current?.colorVariants ?? [],
    stock: Math.max(0, number(input.stock, current?.stock)),
    wholesaleEnabled:
      typeof input.wholesaleEnabled === "boolean"
        ? input.wholesaleEnabled
        : current?.wholesaleEnabled ?? false,
    wholesalePrice:
      input.wholesalePrice === null
        ? undefined
        : input.wholesalePrice !== undefined
          ? Math.max(0, number(input.wholesalePrice))
          : current?.wholesalePrice,
    wholesaleMinOrder:
      input.wholesaleMinOrder === null
        ? undefined
        : input.wholesaleMinOrder !== undefined
          ? Math.max(1, Math.floor(number(input.wholesaleMinOrder, 1)))
          : current?.wholesaleMinOrder,
    featured,
    featuredSortOrder:
      input.featuredSortOrder === null
        ? undefined
        : input.featuredSortOrder !== undefined
          ? number(input.featuredSortOrder)
          : current?.featuredSortOrder,
    featuredAnimationEnabled:
      typeof input.featuredAnimationEnabled === "boolean"
        ? input.featuredAnimationEnabled
        : current?.featuredAnimationEnabled ?? false,
    animationSortOrder:
      input.animationSortOrder === null
        ? undefined
        : input.animationSortOrder !== undefined
          ? number(input.animationSortOrder)
          : current?.animationSortOrder,
    spotlight:
      typeof input.spotlight === "boolean"
        ? input.spotlight
        : current?.spotlight ?? false,
    featuredImage:
      text(input.featuredImage, current?.featuredImage) || undefined,
    showcaseBackgroundImage:
      text(
        input.showcaseBackgroundImage,
        current?.showcaseBackgroundImage,
      ) || undefined,
    status: nextStatus,
    image: text(input.image, current?.image) || undefined,
    sortOrder:
      input.sortOrder === null
        ? undefined
        : input.sortOrder !== undefined
          ? number(input.sortOrder)
          : current?.sortOrder,
  };
}

export async function listProducts(options?: { activeOnly?: boolean }) {
  const db = await getDb();
  const filter = options?.activeOnly ? { status: { $ne: "draft" } } : {};
  const rows = await db
    .collection("products")
    .find(filter)
    .sort({ sortOrder: 1, createdAt: -1 })
    .toArray();
  return rows.map(toProduct);
}

export async function getProductById(id: string) {
  const _id = objectId(id);
  if (!_id) return null;
  const db = await getDb();
  const row = await db.collection("products").findOne({ _id });
  return row ? toProduct(row) : null;
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  const row = await db.collection("products").findOne({ slug });
  return row ? toProduct(row) : null;
}

export async function getWholesaleProductBySlug(slug: string) {
  const db = await getDb();
  const row = await db.collection("products").findOne({
    wholesaleEnabled: true,
    $or: [{ wholesaleSlug: slug }, { slug }],
  });
  return row ? toProduct(row) : null;
}

export async function createProduct(input: Record<string, unknown>) {
  const db = await getDb();
  const now = new Date();
  const product = productFields(input);
  const offerError = validateProductOffer(product);
  if (offerError) throw new Error(offerError);
  const result = await db.collection("products").insertOne({
    id: randomUUID(),
    ...product,
    createdAt: now,
    updatedAt: now,
  });

  if (product.spotlight) {
    await db.collection("products").updateMany(
      { _id: { $ne: result.insertedId }, spotlight: true },
      { $set: { spotlight: false, updatedAt: now } },
    );
  }

  return getProductById(result.insertedId.toHexString());
}

export async function updateProduct(
  id: string,
  input: Record<string, unknown>,
) {
  const current = await getProductById(id);
  if (!current) return null;

  const _id = objectId(id);
  if (!_id) return null;
  const db = await getDb();
  const product = productFields(input, current);
  const offerError = validateProductOffer(product);
  if (offerError) throw new Error(offerError);

  const now = new Date();

  await db.collection("products").updateOne(
    { _id },
    { $set: { ...product, updatedAt: now } },
  );

  if (product.spotlight) {
    await db.collection("products").updateMany(
      { _id: { $ne: _id }, spotlight: true },
      { $set: { spotlight: false, updatedAt: now } },
    );
  }

  return getProductById(id);
}

export async function deleteProduct(id: string) {
  const _id = objectId(id);
  if (!_id) return false;
  const db = await getDb();
  const result = await db.collection("products").deleteOne({ _id });
  return result.deletedCount === 1;
}


export async function reorderProductGroup(
  scope: "featured" | "animation",
  productIds: string[],
) {
  const db = await getDb();
  const field =
    scope === "featured" ? "featuredSortOrder" : "animationSortOrder";
  const now = new Date();

  const operations = productIds
    .map((id, index) => {
      const _id = objectId(id);
      if (!_id) return null;

      return {
        updateOne: {
          filter: { _id },
          update: {
            $set: {
              [field]: index + 1,
              updatedAt: now,
            },
          },
        },
      };
    })
    .filter((operation): operation is NonNullable<typeof operation> =>
      Boolean(operation),
    );

  if (operations.length) {
    await db.collection("products").bulkWrite(operations);
  }

  return listProducts();
}
