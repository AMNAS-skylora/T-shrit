"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AdminDrawer } from "@/components/AdminDrawer";
import type { Order } from "@/types/admin";
import { orderStatuses as statuses } from "@/lib/order-statuses";
import type { Product } from "@/types/product";

export function AdminOrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function load() {
    const [ordersResponse, productsResponse] = await Promise.all([
      fetch("/api/admin/orders", { cache: "no-store" }),
      fetch("/api/admin/products", { cache: "no-store" }),
    ]);
    const orderData = await ordersResponse.json();
    const productData = await productsResponse.json();
    if (!ordersResponse.ok) throw new Error(orderData.error || "Could not load orders.");
    if (!productsResponse.ok) throw new Error(productData.error || "Could not load products.");
    setOrders(orderData.orders || []);
    setProducts(productData.products || []);
    if (!productId && productData.products?.[0]?.id) {
      setProductId(productData.products[0].id);
    }
  }

  useEffect(() => {
    void load().catch((error) =>
      setMessage(
        error instanceof Error ? error.message : "Could not load orders.",
      ),
    );

    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setMessage("");
      setDrawerOpen(true);
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
    }
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customer: { name: customerName, phone, address },
        items: [{ productId, quantity: Number(quantity), color, size }],
        paymentMethod,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Could not create order.");
      return;
    }
    setCustomerName("");
    setPhone("");
    setAddress("");
    setQuantity("1");
    setColor("");
    setSize("");
    setMessage("Order created and stock updated.");
    setDrawerOpen(false);
    await load();
  }

  async function update(id: string, patch: Record<string, unknown>) {
    setMessage("");
    const response = await fetch("/api/admin/orders/" + id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Could not update order.");
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[.16em] text-[#001cac]">FULFILMENT</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">Orders</h1>
        </div>
        <button type="button" onClick={() => { setMessage(""); setDrawerOpen(true); }} className="min-h-11 w-full rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white sm:w-auto">
          + New order
        </button>
      </div>

      <AdminDrawer
        open={drawerOpen}
        title="Create manual order"
        description="Create an order, deduct stock and keep the main orders page focused on fulfilment."
        onClose={() => setDrawerOpen(false)}
      >
          <form onSubmit={create} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <h2 className="font-bold">Create manual order</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" required className="rounded-xl border border-black/10 px-3 py-2.5 text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" required className="rounded-xl border border-black/10 px-3 py-2.5 text-sm" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" required className="rounded-xl border border-black/10 px-3 py-2.5 text-sm lg:col-span-2" />
          <select value={productId} onChange={(e) => setProductId(e.target.value)} required className="rounded-xl border border-black/10 px-3 py-2.5 text-sm lg:col-span-2">
            <option value="">Choose product</option>
            {products.filter((product) => product.status !== "draft").map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — ₹{product.price.toLocaleString("en-IN")} — stock {product.stock}
              </option>
            ))}
          </select>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" className="rounded-xl border border-black/10 px-3 py-2.5 text-sm" />
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2.5 text-sm">
            <option value="cod">COD</option>
            <option value="prepaid">Prepaid</option>
            <option value="manual">Manual</option>
          </select>
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Colour (optional)" className="rounded-xl border border-black/10 px-3 py-2.5 text-sm" />
          <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size (optional)" className="rounded-xl border border-black/10 px-3 py-2.5 text-sm" />
        </div>
        <button className="mt-4 min-h-11 w-full rounded-xl bg-[#001cac] px-5 py-3 text-xs font-bold !text-white sm:w-auto">
          Create order
        </button>
        {message ? <p className="mt-3 text-xs font-medium text-black/55">{message}</p> : null}
      </form>
      </AdminDrawer>

      <section className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">All orders</h2>
          <span className="text-xs text-black/40">{orders.length} orders</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="text-black/40"><tr><th className="py-3">Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Tracking</th><th>Date</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-black/5 align-top">
                  <td className="py-3 font-semibold"><Link href={"/admin/orders/" + order.id} className="!text-[#001cac] hover:underline">{order.orderNumber}</Link><Link href={"/admin/orders/" + order.id} className="mt-2 inline-flex min-h-11 items-center rounded-lg border border-black/10 px-3 text-[10px] !text-[#001cac]">View details →</Link></td>
                  <td>
                    <strong>{order.customer.name}</strong>
                    <div className="mt-1 text-black/45">{order.customer.phone}</div>
                  </td>
                  <td>{order.items.map((item) => item.name + " × " + item.quantity).join(", ")}</td>
                  <td>₹{order.total.toLocaleString("en-IN")}</td>
                  <td>
                    <select value={order.paymentStatus} onChange={(e) => void update(order.id, { paymentStatus: e.target.value })} className="rounded-lg border border-black/10 px-2 py-1.5">
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td>
                    <select value={order.status} onChange={(e) => void update(order.id, { status: e.target.value })} className="rounded-lg border border-black/10 px-2 py-1.5">
                      {statuses.map((status) => <option key={status} value={status}>{status.replaceAll("-", " ")}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <input defaultValue={order.courier || ""} placeholder="Courier" onBlur={(e) => void update(order.id, { courier: e.target.value })} className="w-28 rounded-lg border border-black/10 px-2 py-1.5" />
                      <input defaultValue={order.trackingId || ""} placeholder="Tracking ID" onBlur={(e) => void update(order.id, { trackingId: e.target.value })} className="w-28 rounded-lg border border-black/10 px-2 py-1.5" />
                    </div>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
