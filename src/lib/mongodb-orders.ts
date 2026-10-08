import "server-only";

import { randomUUID } from "node:crypto";
import { ObjectId, type Document } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getProductById } from "@/lib/mongodb-products";
import { adjustInventory } from "@/lib/mongodb-inventory";
import type {
  Customer,
  CustomerSnapshot,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/admin";

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function money(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function orderStatus(value: unknown): OrderStatus {
  const allowed: OrderStatus[] = [
    "new",
    "confirmed",
    "processing",
    "packed",
    "shipped",
    "out-for-delivery",
    "delivered",
    "cancelled",
    "returned",
    "refunded",
  ];
  return allowed.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : "new";
}

function paymentStatus(value: unknown): PaymentStatus {
  return value === "paid" || value === "failed" || value === "refunded"
    ? value
    : "pending";
}

function paymentMethod(value: unknown): PaymentMethod {
  return value === "prepaid" || value === "manual" ? value : "cod";
}

function dateString(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  const date = new Date(typeof value === "string" ? value : Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function toOrder(doc: Document): Order {
  return {
    id: String(doc._id),
    orderNumber: text(doc.orderNumber),
    customer: doc.customer as CustomerSnapshot,
    items: Array.isArray(doc.items) ? (doc.items as OrderItem[]) : [],
    subtotal: money(doc.subtotal),
    discount: money(doc.discount),
    shipping: money(doc.shipping),
    total: money(doc.total),
    status: orderStatus(doc.status),
    paymentStatus: paymentStatus(doc.paymentStatus),
    paymentMethod: paymentMethod(doc.paymentMethod),
    trackingId: text(doc.trackingId) || undefined,
    courier: text(doc.courier) || undefined,
    notes: text(doc.notes) || undefined,
    stockRestored: Boolean(doc.stockRestored),
    createdAt: dateString(doc.createdAt),
    updatedAt: dateString(doc.updatedAt),
  };
}

function toCustomer(doc: Document): Customer {
  return {
    id: String(doc._id),
    name: text(doc.name),
    phone: text(doc.phone),
    email: text(doc.email) || undefined,
    addresses: Array.isArray(doc.addresses)
      ? doc.addresses.map((item: unknown) => String(item)).filter(Boolean)
      : [],
    totalOrders: Number(doc.totalOrders ?? 0),
    totalSpend: Number(doc.totalSpend ?? 0),
    lastOrderAt: doc.lastOrderAt ? dateString(doc.lastOrderAt) : undefined,
    status: doc.status === "blocked" ? "blocked" : "active",
    notes: text(doc.notes) || undefined,
    createdAt: dateString(doc.createdAt),
    updatedAt: dateString(doc.updatedAt),
  };
}

function parseCustomer(value: unknown): CustomerSnapshot {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const customer: CustomerSnapshot = {
    name: text(source.name),
    phone: text(source.phone),
    email: text(source.email) || undefined,
    address: text(source.address),
    city: text(source.city) || undefined,
    state: text(source.state) || undefined,
    pincode: text(source.pincode) || undefined,
  };

  if (!customer.name) throw new Error("Customer name is required.");
  if (!customer.phone) throw new Error("Customer phone is required.");
  if (!customer.address) throw new Error("Customer address is required.");
  return customer;
}

async function resolveItems(value: unknown) {
  if (!Array.isArray(value) || !value.length) {
    throw new Error("At least one order item is required.");
  }

  const resolved: OrderItem[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const source = raw as Record<string, unknown>;
    const productId = text(source.productId);
    const quantity = Math.max(1, Math.floor(Number(source.quantity ?? 1)));
    const product = await getProductById(productId);
    if (!product) throw new Error("One of the selected products no longer exists.");

    resolved.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      color: text(source.color) || undefined,
      size: text(source.size) || undefined,
      quantity,
      unitPrice: product.price,
      costPrice: product.costPrice,
      total: product.price * quantity,
    });
  }

  if (!resolved.length) throw new Error("At least one valid order item is required.");
  return resolved;
}

async function upsertCustomer(customer: CustomerSnapshot, orderTotal: number, createdAt: Date) {
  const db = await getDb();
  const key = customer.phone;
  const address = [
    customer.address,
    customer.city,
    customer.state,
    customer.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  await db.collection("customers").updateOne(
    { phone: key },
    {
      $set: {
        name: customer.name,
        phone: key,
        email: customer.email,
        lastOrderAt: createdAt,
        updatedAt: createdAt,
      },
      $setOnInsert: {
        status: "active",
        notes: "",
        createdAt,
      },
      $addToSet: { addresses: address },
      $inc: {
        totalOrders: 1,
        totalSpend: orderTotal,
      },
    },
    { upsert: true },
  );
}

export async function createOrder(input: Record<string, unknown>) {
  const db = await getDb();
  const customer = parseCustomer(input.customer);
  const items = await resolveItems(input.items);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = money(input.discount);
  const shipping = money(input.shipping);
  const total = Math.max(0, subtotal - discount + shipping);
  const createdAt = new Date();
  const orderNumber =
    "KLD-" +
    createdAt.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14) +
    "-" +
    randomUUID().slice(0, 6).toUpperCase();

  const deducted: OrderItem[] = [];
  try {
    for (const item of items) {
      await adjustInventory({
        productId: item.productId,
        delta: -item.quantity,
        color: item.color,
        size: item.size,
        reason: "Order placed",
        reference: orderNumber,
      });
      deducted.push(item);
    }
  } catch (error) {
    for (const item of deducted) {
      await adjustInventory({
        productId: item.productId,
        delta: item.quantity,
        color: item.color,
        size: item.size,
        reason: "Order rollback",
        reference: orderNumber,
      }).catch(() => undefined);
    }
    throw error;
  }

  let insertedId: ObjectId;
  try {
    const result = await db.collection("orders").insertOne({
      id: randomUUID(),
      orderNumber,
      customer,
      items,
      subtotal,
      discount,
      shipping,
      total,
      status: orderStatus(input.status),
      paymentStatus: paymentStatus(input.paymentStatus),
      paymentMethod: paymentMethod(input.paymentMethod),
      trackingId: text(input.trackingId) || undefined,
      courier: text(input.courier) || undefined,
      notes: text(input.notes) || undefined,
      stockRestored: false,
      createdAt,
      updatedAt: createdAt,
    });
    insertedId = result.insertedId;
  } catch (error) {
    for (const item of deducted) {
      await adjustInventory({
        productId: item.productId,
        delta: item.quantity,
        color: item.color,
        size: item.size,
        reason: "Order insert rollback",
        reference: orderNumber,
      }).catch(() => undefined);
    }
    throw error;
  }

  await upsertCustomer(customer, total, createdAt);
  return getOrderById(insertedId.toHexString());
}

export async function listOrders() {
  const db = await getDb();
  const rows = await db
    .collection("orders")
    .find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();
  return rows.map(toOrder);
}

export async function getOrderById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const row = await db.collection("orders").findOne({ _id: new ObjectId(id) });
  return row ? toOrder(row) : null;
}

export async function updateOrder(id: string, input: Record<string, unknown>) {
  const current = await getOrderById(id);
  if (!current || !ObjectId.isValid(id)) return null;

  const nextStatus =
    input.status !== undefined ? orderStatus(input.status) : current.status;
  let stockRestored = Boolean(current.stockRestored);

  if (
    !stockRestored &&
    (nextStatus === "cancelled" || nextStatus === "returned" || nextStatus === "refunded")
  ) {
    for (const item of current.items) {
      await adjustInventory({
        productId: item.productId,
        delta: item.quantity,
        color: item.color,
        size: item.size,
        reason: "Order stock restored",
        reference: current.orderNumber,
      });
    }
    stockRestored = true;
  }

  const db = await getDb();
  await db.collection("orders").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: nextStatus,
        paymentStatus:
          input.paymentStatus !== undefined
            ? paymentStatus(input.paymentStatus)
            : current.paymentStatus,
        paymentMethod:
          input.paymentMethod !== undefined
            ? paymentMethod(input.paymentMethod)
            : current.paymentMethod,
        trackingId: text(input.trackingId, current.trackingId) || undefined,
        courier: text(input.courier, current.courier) || undefined,
        notes: text(input.notes, current.notes) || undefined,
        stockRestored,
        updatedAt: new Date(),
      },
    },
  );

  return getOrderById(id);
}

export async function deleteOrder(id: string) {
  const current = await getOrderById(id);
  if (!current || !ObjectId.isValid(id)) return false;
  if (!current.stockRestored) {
    throw new Error("Cancel, return or refund the order before deleting it.");
  }
  const db = await getDb();
  const result = await db.collection("orders").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function listCustomers() {
  const db = await getDb();
  const rows = await db
    .collection("customers")
    .find({})
    .sort({ lastOrderAt: -1, createdAt: -1 })
    .limit(1000)
    .toArray();
  return rows.map(toCustomer);
}
