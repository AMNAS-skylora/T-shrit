import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import {
  createHeroSlide,
  listHeroSlides,
} from "@/lib/mongodb-hero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ slides: await listHeroSlides() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    return NextResponse.json(
      { slide: await createHeroSlide(body) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
