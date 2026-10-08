import "server-only";

import {
  type Collection,
  type CreateIndexesOptions,
  type Db,
  type Document,
  MongoClient,
} from "mongodb";
import { requireMongoEnvironment } from "@/lib/server-env";

declare global {
  var __kleidinMongoClientPromise: Promise<MongoClient> | undefined;
  var __kleidinIndexPromiseV2: Promise<void> | undefined;
}

function getClientPromise() {
  const { uri } = requireMongoEnvironment();

  if (!global.__kleidinMongoClientPromise) {
    const client = new MongoClient(uri, {
      appName: "kleidin-nextjs",
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30_000,
      serverSelectionTimeoutMS: 10_000,
      ignoreUndefined: true,
    });

    global.__kleidinMongoClientPromise = client.connect().catch((error) => {
      delete global.__kleidinMongoClientPromise;
      throw error;
    });
  }

  return global.__kleidinMongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const { dbName } = requireMongoEnvironment();
  const db = client.db(dbName);

  if (!global.__kleidinIndexPromiseV2) {
    global.__kleidinIndexPromiseV2 = ensureIndexes(db).catch((error) => {
      delete global.__kleidinIndexPromiseV2;
      throw error;
    });
  }

  await global.__kleidinIndexPromiseV2;
  return db;
}

function sameKey(left: Document, right: Document) {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);

  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(
      ([key, value], index) =>
        rightEntries[index]?.[0] === key && rightEntries[index]?.[1] === value,
    )
  );
}

async function ensureIndex(
  collection: Collection,
  key: Document,
  options: CreateIndexesOptions = {},
) {
  let indexes: Document[] = [];

  try {
    indexes = await collection.listIndexes().toArray();
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? Number((error as { code?: unknown }).code)
        : null;

    // NamespaceNotFound: the collection does not exist yet.
    if (code !== 26) throw error;
  }

  const existing = indexes.find(
    (index) => index.key && sameKey(index.key as Document, key),
  );

  if (existing) {
    if (options.unique === true && existing.unique !== true) {
      throw new Error(
        `MongoDB index ${existing.name ?? JSON.stringify(key)} exists but is not unique.`,
      );
    }

    return existing.name as string | undefined;
  }

  let createOptions = { ...options };

  if (
    createOptions.name &&
    indexes.some((index) => index.name === createOptions.name)
  ) {
    const keySuffix = Object.entries(key)
      .map(([field, direction]) => `${field}_${String(direction).replace(/[^a-zA-Z0-9-]/g, "")}`)
      .join("_");

    const baseName = `${createOptions.name}__${keySuffix}`.slice(0, 110);
    let candidate = baseName;
    let suffix = 2;

    while (indexes.some((index) => index.name === candidate)) {
      candidate = `${baseName}_${suffix}`.slice(0, 120);
      suffix += 1;
    }

    createOptions = {
      ...createOptions,
      name: candidate,
    };
  }

  return collection.createIndex(key, createOptions);
}

async function ensureIndexes(db: Db) {
  const products = db.collection("products");
  const orders = db.collection("orders");
  const customers = db.collection("customers");
  const inventory = db.collection("inventoryMovements");
  const settings = db.collection("siteSettings");
  const hero = db.collection("heroSlides");
  const animationBars = db.collection("animationBars");

  await Promise.all([
    // Names match the legacy KLEID.IN backend where possible. ensureIndex also
    // accepts an equivalent existing index with any other name.
    ensureIndex(products, { id: 1 }, { unique: true, name: "products_id_unique" }),
    ensureIndex(products, { sku: 1 }, { unique: true, name: "products_sku_unique" }),
    ensureIndex(products, { slug: 1 }, { unique: true, name: "products_slug_unique" }),
    ensureIndex(
      products,
      { wholesaleSlug: 1 },
      { unique: true, sparse: true, name: "products_wholesale_slug_unique" },
    ),
    ensureIndex(products, { status: 1, sortOrder: 1 }, { name: "products_status_sort" }),
    ensureIndex(
      products,
      { featured: 1, featuredSortOrder: 1 },
      { name: "products_featured_sort" },
    ),
    ensureIndex(
      products,
      { featuredAnimationEnabled: 1, animationSortOrder: 1 },
      { name: "products_animation_sort" },
    ),
    ensureIndex(
      products,
      { spotlight: 1 },
      { name: "products_spotlight" },
    ),

    ensureIndex(orders, { id: 1 }, { unique: true, name: "orders_id_unique" }),
    ensureIndex(
      orders,
      { orderNumber: 1 },
      { unique: true, name: "orders_number_unique" },
    ),
    ensureIndex(orders, { createdAt: -1 }, { name: "orders_created_desc" }),
    ensureIndex(
      orders,
      { status: 1, createdAt: -1 },
      { name: "orders_status_created" },
    ),

    ensureIndex(customers, { phone: 1 }, { name: "customers_phone" }),
    ensureIndex(customers, { email: 1 }, { name: "customers_email" }),

    ensureIndex(
      inventory,
      { productId: 1, createdAt: -1 },
      { name: "inventory_product_created" },
    ),

    ensureIndex(
      settings,
      { key: 1 },
      { unique: true, name: "site_settings_key_unique" },
    ),

    ensureIndex(hero, { id: 1 }, { unique: true, name: "hero_id_unique" }),
    ensureIndex(hero, { enabled: 1, order: 1 }, { name: "hero_enabled_order" }),

    ensureIndex(
      animationBars,
      { id: 1 },
      { unique: true, name: "animation_bars_id_unique" },
    ),
    ensureIndex(
      animationBars,
      { enabled: 1, placement: 1, order: 1 },
      { name: "animation_bars_enabled_placement_order" },
    ),
  ]);
}
