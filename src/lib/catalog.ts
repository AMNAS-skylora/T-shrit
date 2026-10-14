import { cache } from "react";
import { getStoreSettings } from "@/lib/site-settings";
import { demoProducts, getDemoProductBySlug } from "@/lib/demo-products";
import { getMongoEnvironment } from "@/lib/server-env";
import {
  getProductBySlug,
  getWholesaleProductBySlug as getWholesaleFromDb,
  listProducts,
} from "@/lib/mongodb-products";

export const getCatalogProducts = cache(async () => {
  if (!getMongoEnvironment()) return [];
  const products = await listProducts({ activeOnly: true });
  if (products.length) return products;
  const settings = await getStoreSettings();
  return settings.demoCatalogEnabled ? demoProducts : [];
});

export const getCatalogProductBySlug = cache(async (slug: string) => {
  if (!getMongoEnvironment()) return null;
  const real = await getProductBySlug(slug);
  if (real) return real;
  const demo = getDemoProductBySlug(slug);
  if (!demo) return null;
  const products = await getCatalogProducts();
  return products.some((product) => product.id === demo.id) ? demo : null;
});

export const getWholesaleProductBySlug = cache(async (slug: string) => {
  if (!getMongoEnvironment()) return null;
  return getWholesaleFromDb(slug);
});
