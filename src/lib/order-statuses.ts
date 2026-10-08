import type { OrderStatus } from "@/types/admin";

export const orderStatuses: OrderStatus[] = [
  "new", "confirmed", "processing", "packed", "shipped",
  "out-for-delivery", "delivered", "cancelled", "returned", "refunded",
];
