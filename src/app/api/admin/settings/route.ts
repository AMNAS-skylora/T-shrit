import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import {
  getStoreSettingsFromDb,
  saveStoreSettings,
} from "@/lib/mongodb-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ settings: await getStoreSettingsFromDb() });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    return NextResponse.json({ settings: await saveStoreSettings(body) });
  } catch (error) {
    return apiError(error);
  }
}
