import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import {
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/lib/mongodb-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const product = await updateProduct(id, body);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const deleted = await deleteProduct(id);
    if (!deleted) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
