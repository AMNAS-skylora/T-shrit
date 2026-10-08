import { cache } from "react";
import { getMongoEnvironment } from "@/lib/server-env";
import {
  getProductBySlug,
  getWholesaleProductBySlug as getWholesaleFromDb,
  listProducts,
} from "@/lib/mongodb-products";

export const getCatalogProducts = cache(async () => {
  if (!getMongoEnvironment()) return [];
  return listProducts({ activeOnly: true });
});

export const getCatalogProductBySlug = cache(async (slug: string) => {
  if (!getMongoEnvironment()) return null;
  return getProductBySlug(slug);
});

export const getWholesaleProductBySlug = cache(async (slug: string) => {
  if (!getMongoEnvironment()) return null;
  return getWholesaleFromDb(slug);
});
