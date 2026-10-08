import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import { getDashboardMetrics } from "@/lib/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdminRequest(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await getDashboardMetrics());
  } catch (error) {
    return apiError(error);
  }
}
