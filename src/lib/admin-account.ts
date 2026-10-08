import "server-only";
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getDb } from "@/lib/mongodb";
import { getAdminEnvironment, getMongoEnvironment } from "@/lib/server-env";

const deriveKey = promisify(scrypt);
type AccountDocument = { _id: string; email: string; passwordHash: string; version: string };
export type AdminAccount = { email: string; version: string; passwordHash?: string; password?: string };

export async function getAdminAccount(): Promise<AdminAccount | null> {
  const env = getAdminEnvironment();
  if (!env) return null;
  if (getMongoEnvironment()) {
    const db = await getDb();
    const saved = await db.collection<AccountDocument>("admin_accounts").findOne({ _id: "primary" });
    if (saved) return saved;
  }
  return { email: env.email, password: env.password, version: "bootstrap" };
}

export async function verifyAccountPassword(account: AdminAccount, password: string) {
  if (typeof password !== "string" || password.length > 256) return false;
  if (account.passwordHash) {
    const [scheme, salt, hash] = account.passwordHash.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const actual = await deriveKey(password, salt, 64) as Buffer;
    const expected = Buffer.from(hash, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  const actual = Buffer.from(password);
  const expected = Buffer.from(account.password || "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function changeAdminAccount(input: { email: string; currentPassword: string; newPassword?: string }) {
  const current = await getAdminAccount();
  if (!current || !await verifyAccountPassword(current, input.currentPassword)) throw new Error("Current password is incorrect.");
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Enter a valid login email.");
  const password = input.newPassword || input.currentPassword;
  if (typeof password !== "string" || (input.newPassword && password.length < 12) || password.length > 256) throw new Error("Use a new password between 12 and 256 characters.");
  const salt = randomBytes(16).toString("hex");
  const hash = await deriveKey(password, salt, 64) as Buffer;
  const account: AccountDocument = { _id: "primary", email, passwordHash: `scrypt$${salt}$${hash.toString("hex")}`, version: randomUUID() };
  const db = await getDb();
  const collection = db.collection<AccountDocument>("admin_accounts");
  if (current.version === "bootstrap") {
    await collection.insertOne(account);
  } else {
    const result = await collection.updateOne({ _id: "primary", version: current.version }, { $set: { email, passwordHash: account.passwordHash, version: account.version } });
    if (!result.matchedCount) throw new Error("Account changed. Sign in again before updating it.");
  }
  return { email: account.email, version: account.version };
}
