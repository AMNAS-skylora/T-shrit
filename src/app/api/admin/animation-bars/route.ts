import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import {
  createAnimationBar,
  listAnimationBars,
} from "@/lib/mongodb-animation-bars";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  try {
    return NextResponse.json({ bars: await listAnimationBars() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    return NextResponse.json(
      { bar: await createAnimationBar(body) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
