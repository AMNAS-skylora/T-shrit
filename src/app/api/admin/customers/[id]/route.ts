import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import { getDb } from "@/lib/mongodb";
import { getCustomerDetails } from "@/lib/mongodb-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const details = await getCustomerDetails(id);
    if (!details) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    return NextResponse.json(details);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      status?: "active" | "blocked";
      notes?: string;
    };
    const db = await getDb();
    const result = await db.collection("customers").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...(body.status ? { status: body.status === "blocked" ? "blocked" : "active" } : {}),
          ...(body.notes !== undefined ? { notes: String(body.notes).trim() } : {}),
          updatedAt: new Date(),
        },
      },
    );

    if (!result.matchedCount) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
