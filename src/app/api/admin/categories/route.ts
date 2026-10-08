import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import { addCategory, listCategories } from "@/lib/mongodb-categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdminRequest(request, "products.view");
  if (denied) return denied;
  try {
    return NextResponse.json({ categories: await listCategories() });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  const denied = requireAdminRequest(request, "products.create");
  if (denied) return denied;
  try {
    const body = await request.json();
    return NextResponse.json({ category: await addCategory(body.name) }, { status: 201 });
  } catch (error) { return apiError(error); }
}
