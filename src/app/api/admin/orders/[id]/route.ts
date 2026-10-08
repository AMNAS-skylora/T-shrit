import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import {
  deleteOrder,
  getOrderById,
  updateOrder,
} from "@/lib/mongodb-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ order });
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
    const order = await updateOrder(id, body);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const deleted = await deleteOrder(id);
    if (!deleted) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
