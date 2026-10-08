import { cache } from "react";
import { homeDemoProducts } from "@/lib/home-demo-products";
import { getStoreSettings } from "@/lib/site-settings";
import { products as fallbackProducts } from "@/data/products";
import { getMongoEnvironment } from "@/lib/server-env";
import {
  getProductBySlug,
  getWholesaleProductBySlug as getWholesaleFromDb,
  listProducts,
} from "@/lib/mongodb-products";

export const getCatalogProducts = cache(async () => {
  const [products, settings] = await Promise.all([
    getMongoEnvironment() ? listProducts({ activeOnly: true }) : Promise.resolve(fallbackProducts.filter((product) => product.status !== "draft")),
    getStoreSettings(),
  ]);
  if (!settings.demoProductsEnabled) return products;
  const slugs = new Set(products.map((product) => product.slug));
  return [...products, ...homeDemoProducts.filter((product) => !slugs.has(product.slug))];
});

export const getCatalogProductBySlug = cache(async (slug: string) => {
  const realProduct = getMongoEnvironment() ? await getProductBySlug(slug) : fallbackProducts.find((product) => product.slug === slug) ?? null;
  if (realProduct) return realProduct;
  const settings = await getStoreSettings();
  return settings.demoProductsEnabled ? homeDemoProducts.find((product) => product.slug === slug) ?? null : null;
});

export const getWholesaleProductBySlug = cache(async (slug: string) => {
  if (!getMongoEnvironment()) {
    return (
      fallbackProducts.find(
        (product) =>
          product.wholesaleEnabled &&
          (product.wholesaleSlug ?? product.slug + "-dealer") === slug &&
          product.status !== "draft",
      ) ?? null
    );
  }

  return getWholesaleFromDb(slug);
});
