import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import { createProduct, listProducts } from "@/lib/mongodb-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ products: await listProducts() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const product = await createProduct(body);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
