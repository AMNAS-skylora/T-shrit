import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  hasAdminPermission,
  type AdminPermission,
} from "@/lib/admin-auth";

export function requireAdminRequest(
  request: NextRequest,
  permission?: AdminPermission,
) {
  if (hasAdminPermission(request, permission)) return null;

  return NextResponse.json(
    {
      error: permission ? "Forbidden." : "Unauthorized.",
      ...(permission ? { permission } : {}),
    },
    { status: permission ? 403 : 401 },
  );
}

export function apiError(error: unknown, fallback = "Request failed.") {
  const message = error instanceof Error ? error.message : fallback;
  const duplicate = /duplicate key/i.test(message);
  return NextResponse.json(
    { error: duplicate ? "A record with the same unique value already exists." : message },
    { status: duplicate ? 409 : 400 },
  );
}
