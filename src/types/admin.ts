export type OrderStatus =
  | "new"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "out-for-delivery"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cod" | "prepaid" | "manual";

export type OrderItem = {
  productId: string;
  name: string;
  sku: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  total: number;
};

export type CustomerSnapshot = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customer: CustomerSnapshot;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  trackingId?: string;
  courier?: string;
  notes?: string;
  stockRestored?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  addresses: string[];
  totalOrders: number;
  totalSpend: number;
  lastOrderAt?: string;
  status: "active" | "blocked";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryMovement = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  color?: string;
  size?: string;
  delta: number;
  reason: string;
  reference?: string;
  createdAt: string;
};


export type InventoryStockAlert = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  stock: number;
  threshold: number;
  status: "low" | "sold-out";
  color?: string;
  size?: string;
};
