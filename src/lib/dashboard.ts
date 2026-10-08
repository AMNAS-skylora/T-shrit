import "server-only";

import { getDb } from "@/lib/mongodb";
import { getInventorySummary } from "@/lib/mongodb-inventory";

const excludedSalesStatuses = ["cancelled", "returned", "refunded"];

function indiaDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  }).format(date);
}

export async function getDashboardMetrics() {
  const db = await getDb();
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

  const validSalesMatch = {
    status: { $nin: excludedSalesStatuses },
  };

  const [
    totalOrders,
    todayOrders,
    newOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    customerCount,
    productCount,
    activeProductCount,
    draftProductCount,
    featuredCount,
    costConfiguredProducts,
    revenueRows,
    todayRevenueRows,
    paidRows,
    pendingPaymentRows,
    inventoryValueRows,
    costRows,
    inventory,
    recentOrders,
    salesRows,
    topProductRows,
  ] = await Promise.all([
    db.collection("orders").countDocuments(),
    db.collection("orders").countDocuments({ createdAt: { $gte: startToday } }),
    db.collection("orders").countDocuments({ status: "new" }),
    db.collection("orders").countDocuments({
      status: { $in: ["new", "confirmed", "processing", "packed"] },
    }),
    db.collection("orders").countDocuments({ status: "delivered" }),
    db.collection("orders").countDocuments({ status: "cancelled" }),
    db.collection("customers").countDocuments(),
    db.collection("products").countDocuments(),
    db.collection("products").countDocuments({ status: "active" }),
    db.collection("products").countDocuments({ status: "draft" }),
    db.collection("products").countDocuments({ featured: true }),
    db.collection("products").countDocuments({ costPrice: { $gt: 0 } }),
    db
      .collection("orders")
      .aggregate([
        { $match: validSalesMatch },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ])
      .toArray(),
    db
      .collection("orders")
      .aggregate([
        {
          $match: {
            ...validSalesMatch,
            createdAt: { $gte: startToday },
          },
        },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ])
      .toArray(),
    db
      .collection("orders")
      .aggregate([
        {
          $match: {
            ...validSalesMatch,
            paymentStatus: "paid",
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ])
      .toArray(),
    db
      .collection("orders")
      .aggregate([
        {
          $match: {
            ...validSalesMatch,
            paymentStatus: "pending",
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ])
      .toArray(),
    db
      .collection("products")
      .aggregate([
        { $match: { status: { $ne: "draft" } } },
        {
          $group: {
            _id: null,
            value: {
              $sum: {
                $multiply: [
                  { $ifNull: ["$stock", 0] },
                  { $ifNull: ["$costPrice", 0] },
                ],
              },
            },
          },
        },
      ])
      .toArray(),
    db
      .collection("orders")
      .aggregate([
        { $match: validSalesMatch },
        { $unwind: "$items" },
        {
          $set: {
            productObjectId: {
              $convert: {
                input: "$items.productId",
                to: "objectId",
                onError: null,
                onNull: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "productObjectId",
            foreignField: "_id",
            as: "productDoc",
          },
        },
        {
          $set: {
            resolvedUnitCost: {
              $ifNull: [
                "$items.costPrice",
                {
                  $ifNull: [
                    { $arrayElemAt: ["$productDoc.costPrice", 0] },
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            cost: {
              $sum: {
                $multiply: [
                  { $ifNull: ["$items.quantity", 0] },
                  "$resolvedUnitCost",
                ],
              },
            },
          },
        },
      ])
      .toArray(),
    getInventorySummary(),
    db.collection("orders").find({}).sort({ createdAt: -1 }).limit(8).toArray(),
    db
      .collection("orders")
      .aggregate([
        {
          $match: {
            ...validSalesMatch,
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
    db
      .collection("orders")
      .aggregate([
        { $match: validSalesMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            sku: { $first: "$items.sku" },
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.total" },
          },
        },
        { $sort: { quantity: -1, revenue: -1 } },
        { $limit: 5 },
      ])
      .toArray(),
  ]);

  const revenue = Number(revenueRows[0]?.revenue ?? 0);
  const productCost = Number(costRows[0]?.cost ?? 0);
  const grossProfit =
    costConfiguredProducts > 0 ? Math.max(0, revenue - productCost) : null;

  const salesMap = new Map(
    salesRows.map((row) => [
      String(row._id),
      {
        revenue: Number(row.revenue ?? 0),
        orders: Number(row.orders ?? 0),
      },
    ]),
  );

  const salesSeries = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000);
    const key = indiaDateKey(date);
    const row = salesMap.get(key);

    return {
      key,
      label: dayLabel(date),
      revenue: row?.revenue ?? 0,
      orders: row?.orders ?? 0,
    };
  });

  return {
    totalOrders,
    todayOrders,
    newOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    totalCustomers: customerCount,
    totalProducts: productCount,
    activeProducts: activeProductCount,
    draftProducts: draftProductCount,
    featuredProducts: featuredCount,
    revenue,
    todayRevenue: Number(todayRevenueRows[0]?.revenue ?? 0),
    paidRevenue: Number(paidRows[0]?.total ?? 0),
    pendingPayments: Number(pendingPaymentRows[0]?.total ?? 0),
    productCost,
    grossProfit,
    costConfiguredProducts,
    inventoryValue: Number(inventoryValueRows[0]?.value ?? 0),
    totalStockUnits: inventory.totalUnits,
    lowStockProducts: inventory.lowStock,
    soldOutProducts: inventory.soldOut,
    salesSeries,
    topProducts: topProductRows.map((row) => ({
      productId: String(row._id ?? ""),
      name: String(row.name ?? "Product"),
      sku: String(row.sku ?? ""),
      quantity: Number(row.quantity ?? 0),
      revenue: Number(row.revenue ?? 0),
    })),
    recentOrders: recentOrders.map((row) => ({
      id: String(row._id),
      orderNumber: String(row.orderNumber ?? ""),
      customerName: String(row.customer?.name ?? ""),
      total: Number(row.total ?? 0),
      status: String(row.status ?? "new"),
      paymentStatus: String(row.paymentStatus ?? "pending"),
      paymentMethod: String(row.paymentMethod ?? "cod"),
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : new Date(row.createdAt ?? Date.now()).toISOString(),
    })),
  };
}
