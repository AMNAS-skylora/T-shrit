import "server-only";
import { getAdminAccount, verifyAccountPassword } from "@/lib/admin-account";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getAdminEnvironment } from "@/lib/server-env";

export const ADMIN_COOKIE = "kleidin_admin_session";
const SESSION_AGE_SECONDS = 60 * 60 * 12;

export const ADMIN_ROLE = "super-admin" as const;

export const ADMIN_PERMISSIONS = [
  "dashboard.view",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "inventory.view",
  "inventory.adjust",
  "orders.view",
  "orders.create",
  "orders.update",
  "orders.delete",
  "customers.view",
  "customers.update",
  "homepage.view",
  "homepage.create",
  "homepage.update",
  "homepage.delete",
  "settings.view",
  "settings.update",
  "uploads.create",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

type SessionPayload = {
  email: string;
  exp: number;
  version?: string;
};

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function verifyAdminCredentials(email: string, password: string) {
  if (typeof email !== "string" || typeof password !== "string" || password.length > 256) return null;
  const account = await getAdminAccount();
  if (!account || !safeEqual(email.trim().toLowerCase(), account.email) || !await verifyAccountPassword(account, password)) return null;
  return account;
}

export function createAdminSessionToken(email: string, version = "bootstrap") {
  const env = getAdminEnvironment();
  if (!env) throw new Error("Admin authentication is not configured.");

  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    version,
    exp: Math.floor(Date.now() / 1000) + SESSION_AGE_SECONDS,
  };
  const encoded = encode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded, env.sessionSecret)}`;
}

export async function verifyAdminSessionToken(token?: string | null) {
  if (!token) return false;
  const env = getAdminEnvironment();
  if (!env) return false;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;
  if (!safeEqual(signature, sign(encoded, env.sessionSecret))) return false;

  try {
    const payload = JSON.parse(decode(encoded)) as SessionPayload;
    if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return false;
    const account = await getAdminAccount();
    return Boolean(account && (
      payload.email === account.email &&
      (payload.version ?? "bootstrap") === account.version &&
      Number.isFinite(payload.exp) &&
      payload.exp > Math.floor(Date.now() / 1000)
    ));
  } catch {
    return false;
  }
}

export async function isAdminApiRequest(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function hasAdminPermission(
  request: NextRequest,
  permission?: AdminPermission,
) {
  if (!await isAdminApiRequest(request)) return false;
  if (!permission) return true;
  return ADMIN_PERMISSIONS.includes(permission);
}

export async function requireAdminPage() {
  const cookieStore = await cookies();
  if (!await verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_AGE_SECONDS,
};
