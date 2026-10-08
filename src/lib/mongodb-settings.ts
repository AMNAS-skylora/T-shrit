import "server-only";
import { normalizeHomepageLayouts } from "@/lib/homepage-layouts";

import { getDb } from "@/lib/mongodb";
import { localStoreSettings } from "@/data/store";
import type { StoreSettings } from "@/types/commerce";

const key = "storefront";

function normalize(value: unknown): StoreSettings {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const output = { ...localStoreSettings } as StoreSettings;

  for (const settingKey of Object.keys(localStoreSettings) as Array<keyof StoreSettings>) {
    const current = localStoreSettings[settingKey];
    const next = source[settingKey];

    if (settingKey === "homeDefaultHeroImagePosition") continue;

    if (Array.isArray(current)) {
      if (Array.isArray(next)) {
        (output as Record<string, unknown>)[settingKey] = next
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
      continue;
    }

    if (typeof current === "boolean" && typeof next === "boolean") {
      (output as Record<string, unknown>)[settingKey] = next;
      continue;
    }

    if (typeof current === "string" && typeof next === "string") {
      (output as Record<string, unknown>)[settingKey] = next.trim();
    }
  }

  if (
    source.homeDefaultHeroImagePosition === "left" ||
    source.homeDefaultHeroImagePosition === "center" ||
    source.homeDefaultHeroImagePosition === "right"
  ) {
    output.homeDefaultHeroImagePosition =
      source.homeDefaultHeroImagePosition;
  }

  if (Array.isArray(source.aboutPrinciples)) {
    output.aboutPrinciples = source.aboutPrinciples
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const title = typeof row.title === "string" ? row.title.trim() : "";
        const copy = typeof row.copy === "string" ? row.copy.trim() : "";
        return title ? { title, copy } : null;
      })
      .filter(
        (item): item is StoreSettings["aboutPrinciples"][number] => Boolean(item),
      );
  }

  Object.assign(output, normalizeHomepageLayouts(source));
  return output;
}

export async function getStoreSettingsFromDb() {
  const db = await getDb();
  const row = await db.collection("siteSettings").findOne({ key });
  return row ? normalize(row) : localStoreSettings;
}

export async function saveStoreSettings(input: unknown) {
  const db = await getDb();
  const existing = await db.collection("siteSettings").findOne({ key });
  const patch = input && typeof input === "object" ? input : {};
  const settings = normalize({ ...existing, ...patch });
  await db.collection("siteSettings").updateOne(
    { key },
    {
      $set: {
        ...Object.fromEntries(
          Object.keys(patch).filter((field) => field in localStoreSettings).map((field) => [field, settings[field as keyof StoreSettings]]),
        ),
        key,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  return settings;
}
