import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import { reorderProductGroup } from "@/lib/mongodb-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      scope?: "featured" | "animation";
      productIds?: string[];
    };

    if (body.scope !== "featured" && body.scope !== "animation") {
      return NextResponse.json(
        { error: "Invalid reorder scope." },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.productIds)) {
      return NextResponse.json(
        { error: "Product order is required." },
        { status: 400 },
      );
    }

    const products = await reorderProductGroup(
      body.scope,
      body.productIds,
    );

    return NextResponse.json({ products });
  } catch (error) {
    return apiError(error, "Could not reorder products.");
  }
}
