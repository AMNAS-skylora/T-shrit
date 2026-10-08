import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
  isAdminApiRequest,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { getAdminEnvironment } from "@/lib/server-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    configured: Boolean(getAdminEnvironment()),
    authenticated: await isAdminApiRequest(request),
  });
}

export async function POST(request: NextRequest) {
  const env = getAdminEnvironment();
  if (!env) {
    return NextResponse.json(
      {
        error:
          "Admin authentication is not configured. Add ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_SESSION_SECRET to .env.local, then restart the dev server.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  let account;
  try {
    account = body ? await verifyAdminCredentials(body.email ?? "", body.password ?? "") : null;
  } catch {
    return NextResponse.json({ error: "Could not verify login. Check the database connection." }, { status: 503 });
  }
  if (!account) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    ADMIN_COOKIE,
    createAdminSessionToken(account.email, account.version),
    adminCookieOptions,
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", {
    ...adminCookieOptions,
    maxAge: 0,
  });
  return response;
}
