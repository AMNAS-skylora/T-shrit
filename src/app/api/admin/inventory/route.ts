import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import {
  adjustInventory,
  getInventorySummary,
  listInventoryMovements,
  listInventoryStockAlerts,
} from "@/lib/mongodb-inventory";
import { listProducts } from "@/lib/mongodb-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;
  try {
    const productId = request.nextUrl.searchParams.get("productId") || undefined;
    const thresholdParam = Number(
      request.nextUrl.searchParams.get("threshold") ?? "5",
    );
    const threshold =
      Number.isFinite(thresholdParam) && thresholdParam >= 0
        ? Math.floor(thresholdParam)
        : 5;

    const [products, movements, summary, alerts] = await Promise.all([
      listProducts(),
      listInventoryMovements(productId),
      getInventorySummary(threshold),
      listInventoryStockAlerts(threshold),
    ]);

    return NextResponse.json({
      products,
      movements,
      summary,
      alerts,
      lowStockThreshold: threshold,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as {
      productId?: string;
      delta?: number;
      color?: string;
      size?: string;
      reason?: string;
      reference?: string;
    };
    if (!body.productId) throw new Error("Product is required.");
    const product = await adjustInventory({
      productId: body.productId,
      delta: Number(body.delta ?? 0),
      color: body.color,
      size: body.size,
      reason: body.reason ?? "Manual adjustment",
      reference: body.reference,
    });
    return NextResponse.json({ product });
  } catch (error) {
    return apiError(error);
  }
}
