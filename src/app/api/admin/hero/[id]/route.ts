import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import {
  deleteHeroSlide,
  getHeroSlide,
  updateHeroSlide,
} from "@/lib/mongodb-hero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const slide = await getHeroSlide(id);
    if (!slide) {
      return NextResponse.json({ error: "Hero slide not found." }, { status: 404 });
    }
    return NextResponse.json({ slide });
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
    const slide = await updateHeroSlide(id, body);
    if (!slide) {
      return NextResponse.json({ error: "Hero slide not found." }, { status: 404 });
    }
    return NextResponse.json({ slide });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const deleted = await deleteHeroSlide(id);
    if (!deleted) {
      return NextResponse.json({ error: "Hero slide not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
