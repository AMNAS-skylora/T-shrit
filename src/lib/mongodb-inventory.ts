import "server-only";

import { ObjectId, type Document } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getProductById } from "@/lib/mongodb-products";
import type { ProductColorVariant } from "@/types/product";
import type { InventoryMovement, InventoryStockAlert } from "@/types/admin";

function toMovement(doc: Document): InventoryMovement {
  return {
    id: String(doc._id),
    productId: String(doc.productId ?? ""),
    productName: String(doc.productName ?? ""),
    sku: String(doc.sku ?? ""),
    color: typeof doc.color === "string" && doc.color ? doc.color : undefined,
    size: typeof doc.size === "string" && doc.size ? doc.size : undefined,
    delta: Number(doc.delta ?? 0),
    reason: String(doc.reason ?? ""),
    reference:
      typeof doc.reference === "string" && doc.reference
        ? doc.reference
        : undefined,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : new Date(doc.createdAt ?? Date.now()).toISOString(),
  };
}

export async function adjustInventory(input: {
  productId: string;
  delta: number;
  color?: string;
  size?: string;
  reason: string;
  reference?: string;
}) {
  const delta = Number(input.delta);
  if (!Number.isSafeInteger(delta) || delta === 0 || Math.abs(delta) > 100000) {
    throw new Error("Inventory adjustment must be a non-zero whole number up to 100,000 units.");
  }
  if (!ObjectId.isValid(input.productId)) throw new Error("Product not found.");

  const color = input.color?.trim() || undefined;
  const size = input.size?.trim() || undefined;
  const db = await getDb();
  const collection = db.collection("products");
  const _id = new ObjectId(input.productId);

  // Compare-and-swap on updatedAt stops simultaneous orders from both selling
  // the same final units. Admin product edits also advance this timestamp.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const doc = await collection.findOne({ _id });
    if (!doc) throw new Error("Product not found.");

    let stock = Math.max(0, Number(doc.stock ?? 0));
    const colorVariants: ProductColorVariant[] = Array.isArray(doc.colorVariants)
      ? (doc.colorVariants as ProductColorVariant[]).map((variant) => ({
          ...variant,
          sizeStocks: { ...(variant.sizeStocks ?? {}) },
        }))
      : [];
    const colors: string[] = Array.isArray(doc.colors) ? [...doc.colors] : [];
    const sizes: string[] = Array.isArray(doc.sizes) ? [...doc.sizes] : [];

    if (color) {
      let index = colorVariants.findIndex(
        (variant) => variant.name.toLowerCase() === color.toLowerCase(),
      );
      if (index < 0) {
        if (delta < 0) throw new Error("Not enough stock for this colour.");
        colorVariants.push({ name: color, value: color, stock: 0, sizeStocks: {} });
        if (!colors.includes(color)) colors.push(color);
        index = colorVariants.length - 1;
      }

      const variant = { ...colorVariants[index] };
      const sizeStocks = { ...(variant.sizeStocks ?? {}) };
      const trackedSizes = Object.keys(sizeStocks).length > 0;

      if (size && (trackedSizes || Number(variant.stock ?? 0) === 0)) {
        const next = Number(sizeStocks[size] ?? 0) + delta;
        if (!Number.isFinite(next) || next < 0) {
          throw new Error("Not enough stock for this size.");
        }
        sizeStocks[size] = next;
        if (!sizes.includes(size)) sizes.push(size);
        variant.sizeStocks = sizeStocks;
        variant.stock = Object.values(sizeStocks).reduce((sum, count) => sum + Number(count || 0), 0);
      } else {
        // Products without a size-level breakdown still use their colour stock.
        const next = Number(variant.stock ?? 0) + delta;
        if (!Number.isFinite(next) || next < 0) {
          throw new Error("Not enough stock for this colour.");
        }
        variant.stock = next;
      }

      colorVariants[index] = variant;
      stock = colorVariants.reduce((sum, item) => sum + Math.max(0, Number(item.stock ?? 0)), 0);
    } else {
      if (!Number.isFinite(stock + delta) || stock + delta < 0) {
        throw new Error("Not enough stock.");
      }
      stock += delta;
    }

    const status = doc.status === "draft"
      ? "draft"
      : stock <= 0 ? "sold-out" : doc.status === "sold-out" ? "active" : doc.status;
    const updated = await collection.updateOne(
      {
        _id,
        stock: doc.stock === undefined ? { $exists: false } : doc.stock,
        inventoryVersion: doc.inventoryVersion === undefined ? { $exists: false } : doc.inventoryVersion,
        updatedAt: doc.updatedAt === undefined ? { $exists: false } : doc.updatedAt,
      },
      {
        $set: { stock, colors, sizes, colorVariants, status, updatedAt: new Date() },
        $inc: { inventoryVersion: 1 },
      },
    );
    if (updated.modifiedCount !== 1) continue;

    await db.collection("inventoryMovements").insertOne({
      productId: input.productId,
      productName: String(doc.name ?? ""),
      sku: String(doc.sku ?? ""),
      color,
      size,
      delta,
      reason: input.reason.trim() || "Manual adjustment",
      reference: input.reference?.trim() || undefined,
      createdAt: new Date(),
    });
    return getProductById(input.productId);
  }

  throw new Error("Stock changed while processing this request. Please retry.");
}

export async function listInventoryMovements(productId?: string) {
  const db = await getDb();
  const rows = await db
    .collection("inventoryMovements")
    .find(productId ? { productId } : {})
    .sort({ createdAt: -1 })
    .limit(250)
    .toArray();
  return rows.map(toMovement);
}

export async function getInventorySummary(lowStockThreshold = 5) {
  const db = await getDb();
  const rows = await db.collection("products").find({ status: { $ne: "draft" } }).toArray();

  return {
    totalProducts: rows.length,
    totalUnits: rows.reduce((sum, row) => sum + Number(row.stock ?? 0), 0),
    lowStock: rows.filter(
      (row) => Number(row.stock ?? 0) > 0 && Number(row.stock ?? 0) <= lowStockThreshold,
    ).length,
    soldOut: rows.filter((row) => Number(row.stock ?? 0) <= 0).length,
  };
}


export async function listInventoryStockAlerts(lowStockThreshold = 5) {
  const db = await getDb();
  const rows = await db
    .collection("products")
    .find({ status: { $ne: "draft" } })
    .sort({ sortOrder: 1, createdAt: -1 })
    .toArray();

  const alerts: InventoryStockAlert[] = [];

  for (const row of rows) {
    const productId = String(row._id);
    const productName = String(row.name ?? "");
    const sku = String(row.sku ?? "");
    const variants = Array.isArray(row.colorVariants) ? row.colorVariants : [];
    const sizes = Array.isArray(row.sizes)
      ? row.sizes.map((value) => String(value)).filter(Boolean)
      : [];

    if (variants.length) {
      variants.forEach((rawVariant, variantIndex) => {
        if (!rawVariant || typeof rawVariant !== "object") return;
        const variant = rawVariant as Record<string, unknown>;
        const color = String(variant.name ?? "").trim() || undefined;
        const rawSizeStocks =
          variant.sizeStocks && typeof variant.sizeStocks === "object"
            ? (variant.sizeStocks as Record<string, unknown>)
            : {};
        const sizeKeys = Array.from(
          new Set([...sizes, ...Object.keys(rawSizeStocks)]),
        );

        if (sizeKeys.length) {
          for (const size of sizeKeys) {
            const stock = Math.max(0, Number(rawSizeStocks[size] ?? 0));
            if (stock > lowStockThreshold) continue;

            alerts.push({
              id: productId + ":" + variantIndex + ":" + size,
              productId,
              productName,
              sku,
              color,
              size,
              stock,
              threshold: lowStockThreshold,
              status: stock <= 0 ? "sold-out" : "low",
            });
          }
          return;
        }

        const stock = Math.max(0, Number(variant.stock ?? 0));
        if (stock <= lowStockThreshold) {
          alerts.push({
            id: productId + ":" + variantIndex,
            productId,
            productName,
            sku,
            color,
            stock,
            threshold: lowStockThreshold,
            status: stock <= 0 ? "sold-out" : "low",
          });
        }
      });

      continue;
    }

    const stock = Math.max(0, Number(row.stock ?? 0));
    if (stock <= lowStockThreshold) {
      alerts.push({
        id: productId + ":base",
        productId,
        productName,
        sku,
        stock,
        threshold: lowStockThreshold,
        status: stock <= 0 ? "sold-out" : "low",
      });
    }
  }

  return alerts.sort((a, b) => {
    if (a.status !== b.status) return a.status === "sold-out" ? -1 : 1;
    if (a.stock !== b.stock) return a.stock - b.stock;
    return a.productName.localeCompare(b.productName);
  });
}
