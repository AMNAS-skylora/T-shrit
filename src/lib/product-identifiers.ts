type ProductIdentity = { sku: string; slug: string };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function getProductIdentifiers(
  name: string,
  input: { sku?: string; slug?: string },
  uniqueId: string,
  current?: ProductIdentity,
): ProductIdentity {
  // Keep published links and inventory references stable when editing.
  if (current) return { sku: current.sku, slug: current.slug };
  return {
    sku: input.sku?.trim().toUpperCase() || "KLD-" + uniqueId.toUpperCase(),
    slug: slugify(input.slug || "") || `${slugify(name) || "product"}-${uniqueId}`,
  };
}
