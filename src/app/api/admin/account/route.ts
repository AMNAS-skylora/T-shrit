import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, apiError } from "@/lib/admin-api";
import { changeAdminAccount, getAdminAccount } from "@/lib/admin-account";
import { ADMIN_COOKIE, adminCookieOptions, createAdminSessionToken } from "@/lib/admin-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdminRequest(request, "settings.view");
  if (denied) return denied;
  try { return NextResponse.json({ email: (await getAdminAccount())?.email }); }
  catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdminRequest(request, "settings.update");
  if (denied) return denied;
  try {
    const body = await request.json();
    const account = await changeAdminAccount(body);
    const response = NextResponse.json({ email: account.email });
    response.cookies.set(ADMIN_COOKIE, createAdminSessionToken(account.email, account.version), adminCookieOptions);
    return response;
  } catch (error) { return apiError(error); }
}
