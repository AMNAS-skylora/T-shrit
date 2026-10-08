import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import { createOrder, listOrders } from "@/lib/mongodb-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ orders: await listOrders() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const order = await createOrder(body);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
