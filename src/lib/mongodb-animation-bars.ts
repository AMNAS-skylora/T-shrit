import "server-only";

import { randomUUID } from "node:crypto";
import { ObjectId, type Document } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type {
  AnimationBarConfig,
  AnimationBarDirection,
  AnimationBarItem,
  AnimationBarPlacement,
  AnimationBarTheme,
} from "@/types/animation-bar";

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function direction(value: unknown): AnimationBarDirection {
  return value === "right" ? "right" : "left";
}

function placement(value: unknown): AnimationBarPlacement {
  return value === "after-hero" ? "after-hero" : "before-hero";
}

function theme(value: unknown): AnimationBarTheme {
  return value === "light" || value === "blue" ? value : "dark";
}

function items(value: unknown): AnimationBarItem[] {
  if (!Array.isArray(value)) return [];

  const parsed: AnimationBarItem[] = [];

  value.forEach((item, index) => {
    if (!item || typeof item !== "object") return;

    const row = item as Record<string, unknown>;
    const itemText = text(row.text);
    if (!itemText) return;

    const href = text(row.href);
    parsed.push({
      id: text(row.id) || randomUUID() || String(index),
      text: itemText,
      ...(href ? { href } : {}),
    });
  });

  return parsed;
}

function toBar(doc: Document): AnimationBarConfig {
  return {
    id: String(doc._id),
    name: text(doc.name, "Animation bar"),
    items: items(doc.items),
    enabled: bool(doc.enabled, true),
    autoScroll: bool(doc.autoScroll, true),
    allowManualScroll: bool(doc.allowManualScroll, true),
    pauseOnHover: bool(doc.pauseOnHover, true),
    direction: direction(doc.direction),
    speed: Math.min(10, Math.max(1, number(doc.speed, 5))),
    gap: Math.min(120, Math.max(8, number(doc.gap, 36))),
    separator: text(doc.separator, "•") || "•",
    theme: theme(doc.theme),
    startsAt: text(doc.startsAt) || null,
    endsAt: text(doc.endsAt) || null,
    placement: placement(doc.placement),
    order: number(doc.order, 0),
  };
}

function fields(input: Record<string, unknown>, current?: AnimationBarConfig) {
  return {
    name: text(input.name, current?.name ?? "Animation bar"),
    items:
      input.items !== undefined
        ? items(input.items)
        : current?.items ?? [],
    enabled:
      typeof input.enabled === "boolean"
        ? input.enabled
        : current?.enabled ?? true,
    autoScroll:
      typeof input.autoScroll === "boolean"
        ? input.autoScroll
        : current?.autoScroll ?? true,
    allowManualScroll:
      typeof input.allowManualScroll === "boolean"
        ? input.allowManualScroll
        : current?.allowManualScroll ?? true,
    pauseOnHover:
      typeof input.pauseOnHover === "boolean"
        ? input.pauseOnHover
        : current?.pauseOnHover ?? true,
    direction:
      input.direction !== undefined
        ? direction(input.direction)
        : current?.direction ?? "left",
    speed:
      input.speed !== undefined
        ? Math.min(10, Math.max(1, number(input.speed, 5)))
        : current?.speed ?? 5,
    gap:
      input.gap !== undefined
        ? Math.min(120, Math.max(8, number(input.gap, 36)))
        : current?.gap ?? 36,
    separator:
      input.separator !== undefined
        ? text(input.separator, "•") || "•"
        : current?.separator ?? "•",
    theme:
      input.theme !== undefined
        ? theme(input.theme)
        : current?.theme ?? "dark",
    startsAt:
      input.startsAt !== undefined
        ? text(input.startsAt) || null
        : current?.startsAt ?? null,
    endsAt:
      input.endsAt !== undefined
        ? text(input.endsAt) || null
        : current?.endsAt ?? null,
    placement:
      input.placement !== undefined
        ? placement(input.placement)
        : current?.placement ?? "before-hero",
    order:
      input.order !== undefined
        ? number(input.order, 0)
        : current?.order ?? 0,
  };
}

export async function listAnimationBars(options?: { enabledOnly?: boolean }) {
  const db = await getDb();
  const rows = await db
    .collection("animationBars")
    .find(options?.enabledOnly ? { enabled: true } : {})
    .sort({ placement: 1, order: 1, createdAt: 1 })
    .toArray();

  return rows.map(toBar);
}

export async function getAnimationBar(id: string) {
  if (!ObjectId.isValid(id)) return null;

  const db = await getDb();
  const row = await db
    .collection("animationBars")
    .findOne({ _id: new ObjectId(id) });

  return row ? toBar(row) : null;
}

export async function createAnimationBar(input: Record<string, unknown>) {
  const db = await getDb();
  const now = new Date();
  const normalized = fields(input);

  if (!normalized.items.length) {
    throw new Error("Add at least one animation bar item.");
  }

  const result = await db.collection("animationBars").insertOne({
    id: randomUUID(),
    ...normalized,
    createdAt: now,
    updatedAt: now,
  });

  return getAnimationBar(result.insertedId.toHexString());
}

export async function updateAnimationBar(
  id: string,
  input: Record<string, unknown>,
) {
  if (!ObjectId.isValid(id)) return null;

  const current = await getAnimationBar(id);
  if (!current) return null;

  const normalized = fields(input, current);

  if (!normalized.items.length) {
    throw new Error("Add at least one animation bar item.");
  }

  const db = await getDb();
  await db.collection("animationBars").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...normalized,
        updatedAt: new Date(),
      },
    },
  );

  return getAnimationBar(id);
}

export async function deleteAnimationBar(id: string) {
  if (!ObjectId.isValid(id)) return false;

  const db = await getDb();
  const result = await db
    .collection("animationBars")
    .deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount === 1;
}
