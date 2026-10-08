import { cache } from "react";
import { getMongoEnvironment } from "@/lib/server-env";
import { listAnimationBars } from "@/lib/mongodb-animation-bars";

export const getActiveAnimationBars = cache(async () => {
  if (!getMongoEnvironment()) return [];

  return listAnimationBars({ enabledOnly: true });
});
