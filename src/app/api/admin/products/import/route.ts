import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import {
  createProduct,
  listProducts,
  updateProduct,
} from "@/lib/mongodb-products";
import type {
  ProductColorVariant,
  ProductOfferType,
  ProductStatus,
} from "@/types/product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportRow = Record<string, string>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value: unknown) {
  const normalized = text(value).toLowerCase();
  return ["1", "true", "yes", "on", "y"].includes(normalized);
}

function status(value: unknown): ProductStatus {
  const normalized = text(value).toLowerCase();
  if (normalized === "draft" || normalized === "sold-out") return normalized;
  return "active";
}

function offerType(value: unknown): ProductOfferType | undefined {
  const normalized = text(value);
  if (
    normalized === "percentage" ||
    normalized === "fixed" ||
    normalized === "sale-price"
  ) {
    return normalized;
  }
  return undefined;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as { rows?: ImportRow[] };
    const rows = Array.isArray(body.rows) ? body.rows : [];

    if (!rows.length) {
      return NextResponse.json(
        { error: "No import rows were provided." },
        { status: 400 },
      );
    }

    const groups = new Map<string, ImportRow[]>();

    for (const row of rows) {
      const sku = text(row.sku).toUpperCase();
      if (!sku) continue;
      const current = groups.get(sku) ?? [];
      current.push(row);
      groups.set(sku, current);
    }

    if (!groups.size) {
      return NextResponse.json(
        { error: "Every imported product needs an SKU." },
        { status: 400 },
      );
    }

    const existingProducts = await listProducts();
    const existingBySku = new Map(
      existingProducts.map((product) => [product.sku.toUpperCase(), product]),
    );

    const results: Array<{
      sku: string;
      action: "created" | "updated" | "failed";
      error?: string;
    }> = [];

    for (const [sku, productRows] of groups) {
      try {
        const first = productRows[0];
        const existing = existingBySku.get(sku);

        const sizes = unique(
          productRows.flatMap((row) => {
            const direct = text(row.size);
            const list = text(row.sizes);
            return [
              direct,
              ...list.split(/[|;]/g).map((value) => value.trim()),
            ];
          }),
        );

        const colors = unique(
          productRows.flatMap((row) => {
            const direct = text(row.color);
            const list = text(row.colors);
            return [
              direct,
              ...list.split(/[|;]/g).map((value) => value.trim()),
            ];
          }),
        );

        const variants: ProductColorVariant[] = colors.map((color) => {
          const colorRows = productRows.filter(
            (row) => text(row.color).toLowerCase() === color.toLowerCase(),
          );

          const sizeStocks: Record<string, number> = {};
          for (const row of colorRows) {
            const size = text(row.size);
            if (!size) continue;
            sizeStocks[size] = Math.max(0, Math.floor(num(row.stock)));
          }

          const images = unique(
            colorRows.flatMap((row) =>
              text(row.color_image_url)
                .split("|")
                .map((value) => value.trim()),
            ),
          );

          const explicitStock = colorRows
            .filter((row) => !text(row.size))
            .reduce((sum, row) => sum + Math.max(0, Math.floor(num(row.stock))), 0);

          const sizeStock = Object.values(sizeStocks).reduce(
            (sum, value) => sum + value,
            0,
          );

          return {
            name: color,
            value:
              text(colorRows.find((row) => text(row.color_value))?.color_value) ||
              color,
            image: images[0] || undefined,
            images,
            stock: sizeStock || explicitStock,
            sizeStocks,
          };
        });

        const variantStock = variants.reduce(
          (sum, variant) => sum + Math.max(0, Number(variant.stock ?? 0)),
          0,
        );

        const baseStock = productRows
          .filter((row) => !text(row.color))
          .reduce((sum, row) => sum + Math.max(0, Math.floor(num(row.stock))), 0);

        const name = text(first.name) || existing?.name || sku;
        const price = Math.max(0, num(first.price, existing?.price ?? 0));
        const mainImage =
          text(first.main_image_url) || existing?.image || variants[0]?.image || "";

        const payload: Record<string, unknown> = {
          name,
          sku,
          slug:
            text(first.slug) ||
            existing?.slug ||
            slugify(name),
          category: text(first.category) || existing?.category || "",
          price,
          compareAtPrice: text(first.compare_at_price)
            ? Math.max(0, num(first.compare_at_price))
            : existing?.compareAtPrice ?? null,
          description:
            text(first.description) || existing?.description || "",
          status: status(first.status || existing?.status),
          image: mainImage,
          sizes: sizes.length ? sizes : existing?.sizes ?? [],
          colors: colors.length ? colors : existing?.colors ?? [],
          colorVariants: variants.length
            ? variants
            : existing?.colorVariants ?? [],
          stock: variants.length ? variantStock : baseStock || existing?.stock || 0,
          sortOrder: text(first.sort_order)
            ? num(first.sort_order)
            : existing?.sortOrder ?? null,
          offerEnabled: text(first.offer_enabled)
            ? bool(first.offer_enabled)
            : existing?.offerEnabled ?? false,
          offerType:
            offerType(first.offer_type) || existing?.offerType,
          offerValue: text(first.offer_value)
            ? Math.max(0, num(first.offer_value))
            : existing?.offerValue ?? null,
          offerLabel:
            text(first.offer_label) || existing?.offerLabel || "",
          offerBadge:
            text(first.offer_badge) || existing?.offerBadge || "",
          featuredAnimationEnabled: text(first.animation_enabled)
            ? bool(first.animation_enabled)
            : existing?.featuredAnimationEnabled ?? false,
          featuredImage:
            text(first.animation_image) || existing?.featuredImage || "",
          featured: existing?.featured ?? false,
        };

        if (existing) {
          await updateProduct(existing.id, payload);
          results.push({ sku, action: "updated" });
        } else {
          const created = await createProduct(payload);
          if (!created) throw new Error("Product was not created.");
          existingBySku.set(sku, created);
          results.push({ sku, action: "created" });
        }
      } catch (error) {
        results.push({
          sku,
          action: "failed",
          error: error instanceof Error ? error.message : "Import failed.",
        });
      }
    }

    const created = results.filter((item) => item.action === "created").length;
    const updated = results.filter((item) => item.action === "updated").length;
    const failed = results.filter((item) => item.action === "failed").length;

    return NextResponse.json({
      ok: failed === 0,
      created,
      updated,
      failed,
      results,
    });
  } catch (error) {
    return apiError(error, "Product import failed.");
  }
}
