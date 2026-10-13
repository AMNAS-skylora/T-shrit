import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { MongoError } from "mongodb";
import {
  hasAdminPermission,
  type AdminPermission,
} from "@/lib/admin-auth";

export async function requireAdminRequest(
  request: NextRequest,
  permission?: AdminPermission,
) {
  if (await hasAdminPermission(request, permission)) return null;

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
  // Duplicate values are a known user-facing conflict, not a server failure.
  const duplicate = error instanceof MongoError && "code" in error && error.code === 11000 ||
    /duplicate key/i.test(message);
  if (duplicate) {
    return NextResponse.json(
      { error: "A record with the same unique value already exists." },
      { status: 409 },
    );
  }

  // Never return raw MongoDB connection strings, topology or driver exceptions
  // through the admin API. A connection outage is a service error, not bad input.
  if (
    error instanceof MongoError ||
    /^(MongoDB is not configured|Invalid MongoDB connection string)/i.test(message)
  ) {
    console.error("KLEID.IN database request failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Database temporarily unavailable. Check the connection and try again." },
      { status: 503 },
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
  }

  if (error instanceof TypeError || error instanceof RangeError) {
    console.error("KLEID.IN unexpected API error:", error.name);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }

  // Preserve the existing field/domain validation messages from server models.
  return NextResponse.json({ error: message }, { status: 400 });
}
