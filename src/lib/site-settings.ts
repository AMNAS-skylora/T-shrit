import { cache } from "react";
import { localStoreSettings } from "@/data/store";
import { getMongoEnvironment } from "@/lib/server-env";
import { getStoreSettingsFromDb } from "@/lib/mongodb-settings";

export const getStoreSettings = cache(async () => {
  if (!getMongoEnvironment()) return localStoreSettings;

  return getStoreSettingsFromDb();
});
