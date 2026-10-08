import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAdminEnvironment, getCloudinaryEnvironment, getMongoEnvironment } from "@/lib/server-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let database = "not-configured";
  let adminConfigured = false;
  let cloudinaryConfigured = false;
  try {
    adminConfigured = Boolean(getAdminEnvironment());
    cloudinaryConfigured = Boolean(getCloudinaryEnvironment());
    if (getMongoEnvironment()) {
      database = "error";
      const db = await getDb();
      await db.command({ ping: 1 });
      database = "ok";
    }
  } catch {
    database = "error";
  }
  const ok = database === "ok" && adminConfigured && cloudinaryConfigured;
  return NextResponse.json({ ok, database, adminConfigured, cloudinaryConfigured }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
