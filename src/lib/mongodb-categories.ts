import "server-only";
import { getDb } from "@/lib/mongodb";

type CategoryDocument = { _id: string; name: string; createdAt: Date };

function categoryName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export async function listCategories() {
  const db = await getDb();
  const [saved, used] = await Promise.all([
    db.collection<CategoryDocument>("categories").find({}, { projection: { name: 1 } }).toArray(),
    db.collection("products").distinct("category"),
  ]);
  const names = new Map<string, string>();
  for (const value of [...saved.map((category) => category.name), ...used]) {
    const name = categoryName(value);
    if (name && !names.has(name.toLowerCase())) names.set(name.toLowerCase(), name);
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b));
}

export async function addCategory(value: unknown) {
  const name = categoryName(value);
  if (!name || name.length > 80) throw new Error("Enter a category name between 1 and 80 characters.");
  const db = await getDb();
  const collection = db.collection<CategoryDocument>("categories");
  const _id = name.toLowerCase();
  await collection.updateOne({ _id }, { $setOnInsert: { name, createdAt: new Date() } }, { upsert: true });
  return (await collection.findOne({ _id }))!.name;
}
