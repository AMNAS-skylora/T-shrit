import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import {
  deleteAnimationBar,
  getAnimationBar,
  updateAnimationBar,
} from "@/lib/mongodb-animation-bars";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const bar = await getAnimationBar(id);

    if (!bar) {
      return NextResponse.json(
        { error: "Animation bar not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ bar });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const bar = await updateAnimationBar(id, body);

    if (!bar) {
      return NextResponse.json(
        { error: "Animation bar not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ bar });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const deleted = await deleteAnimationBar(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Animation bar not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
