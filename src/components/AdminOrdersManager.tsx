"use client";

import { type FormEvent, useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { AdminDrawer } from "@/components/AdminDrawer";
import type { Order } from "@/types/admin";
import { orderStatuses } from "@/lib/order-statuses";
import type { Product } from "@/types/product";

const fieldClass = "mt-2 min-h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-sm font-normal outline-none focus:border-[#001cac] focus:ring-2 focus:ring-[#001cac]/10";
const money = (value: number) => "₹" + value.toLocaleString("en-IN");

export function AdminOrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search).trim().toLowerCase();
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [productsRetry, setProductsRetry] = useState(0);
  const [message, setMessage] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    async function load() {
      try {
        const response = await fetch("/api/admin/orders", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load orders.");
        setOrders(data.orders || []);
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load orders."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setDrawerOpen(true);
      params.delete("new");
      const queryString = params.toString();
      window.history.replaceState(window.history.state, "", window.location.pathname + (queryString ? "?" + queryString : "") + window.location.hash);
    }
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const controller = new AbortController();
    setProductsLoading(true); setProductsError("");
    async function load() {
      try {
        const response = await fetch("/api/admin/products", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load products.");
        setProducts((data.products || []).filter((product: Product) => product.status !== "draft"));
      } catch (cause) { if (!controller.signal.aborted) setProductsError(cause instanceof Error ? cause.message : "Could not load products."); }
      finally { if (!controller.signal.aborted) setProductsLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [drawerOpen, productsRetry]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (creating || productsLoading || productsError || !productId) return;
    setCreating(true); setCreateError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ customer: { name: customerName, phone, address }, items: [{ productId, quantity: Number(quantity), color, size }], paymentMethod }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create order.");
      setOrders((current) => [data.order, ...current.filter((order) => order.id !== data.order.id)]);
      setCustomerName(""); setPhone(""); setAddress(""); setProductId(""); setQuantity("1"); setColor(""); setSize("");
      setMessage("Order created and stock updated."); setDrawerOpen(false);
    } catch (cause) { setCreateError(cause instanceof Error ? cause.message : "Could not create order."); }
    finally { setCreating(false); }
  }

  const visible = orders.filter((order) => (status === "all" || order.status === status) && (payment === "all" || order.paymentStatus === payment) &&
    (!query || [order.orderNumber, order.customer.name, order.customer.phone, order.customer.email, order.trackingId, ...order.items.map((item) => item.name)].some((value) => value?.toLowerCase().includes(query))));
  const clearFilters = () => { setSearch(""); setStatus("all"); setPayment("all"); };

  return <div className="min-w-0">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[10px] font-bold tracking-[.16em] text-[#001cac]">FULFILMENT</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">Orders</h1><p className="mt-2 text-xs leading-5 text-black/50">Find an order and open its details to manage fulfilment.</p></div>
      <button type="button" onClick={() => { setCreateError(""); setDrawerOpen(true); }} className="min-h-11 w-full rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white sm:w-auto">+ New order</button>
    </div>
    {message ? <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-xs text-green-700">{message}</p> : null}
    <AdminDrawer open={drawerOpen} title="Create manual order" description="Add customer details and a product to create an order." onClose={() => { if (!creating) setDrawerOpen(false); }}>
      <form data-admin-form onSubmit={create} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <fieldset disabled={creating} className="grid gap-4 sm:grid-cols-2 disabled:opacity-60">
          <label className="text-xs font-semibold">Customer name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" required className={fieldClass} /></label>
          <label className="text-xs font-semibold">Phone<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required className={fieldClass} /></label>
          <label className="text-xs font-semibold sm:col-span-2">Delivery address<textarea value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" required rows={2} className={fieldClass + " resize-y py-3"} /></label>
          <label className="text-xs font-semibold sm:col-span-2">Product<select value={productId} onChange={(event) => setProductId(event.target.value)} required disabled={productsLoading || !!productsError} className={fieldClass}><option value="">{productsLoading ? "Loading products…" : "Choose product"}</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} — {money(product.price)} — stock {product.stock}</option>)}</select></label>
          <label className="text-xs font-semibold">Quantity<input type="number" min="1" step="1" required value={quantity} onChange={(event) => setQuantity(event.target.value)} className={fieldClass} /></label>
          <label className="text-xs font-semibold">Payment method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className={fieldClass}><option value="cod">Cash on delivery</option><option value="prepaid">Prepaid</option><option value="manual">Manual</option></select></label>
          <label className="text-xs font-semibold">Colour (optional)<input value={color} onChange={(event) => setColor(event.target.value)} className={fieldClass} /></label>
          <label className="text-xs font-semibold">Size (optional)<input value={size} onChange={(event) => setSize(event.target.value)} className={fieldClass} /></label>
        </fieldset>
        {productsError ? <div role="alert" className="mt-4 text-xs text-red-600"><p>{productsError}</p><button type="button" onClick={() => setProductsRetry((value) => value + 1)} className="mt-2 min-h-11 rounded-xl border border-black/10 px-4 font-semibold">Retry products</button></div> : !productsLoading && !products.length ? <p className="mt-4 text-xs text-black/50">Add a published product before creating an order.</p> : null}
        {createError ? <p role="alert" className="mt-4 text-xs text-red-600">{createError}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2"><button type="submit" disabled={creating || productsLoading || !!productsError || !products.length || !productId} className="min-h-11 flex-1 rounded-xl bg-[#001cac] px-5 text-xs font-semibold !text-white disabled:opacity-50">{creating ? "Creating…" : "Create order"}</button><button type="button" disabled={creating} onClick={() => setDrawerOpen(false)} className="min-h-11 rounded-xl border border-black/10 px-4 text-xs font-semibold disabled:opacity-50">Cancel</button></div>
      </form>
    </AdminDrawer>
    <section aria-label="Order list" className="mt-6">
      <div className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
        <label className="min-w-0 text-xs font-semibold sm:col-span-2 lg:col-span-1">Search orders<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Order, customer, phone, product or tracking" className={fieldClass} /></label>
        <label className="text-xs font-semibold">Order status<select value={status} onChange={(event) => setStatus(event.target.value)} className={fieldClass}><option value="all">All statuses</option>{orderStatuses.map((value) => <option key={value} value={value}>{value.replaceAll("-", " ")}</option>)}</select></label>
        <label className="text-xs font-semibold">Payment status<select value={payment} onChange={(event) => setPayment(event.target.value)} className={fieldClass}><option value="all">All payments</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label>
      </div>
      {loading ? <div role="status" aria-label="Loading orders" className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((key) => <div key={key} className="h-72 animate-pulse rounded-2xl bg-black/5 motion-reduce:animate-none" />)}</div>
        : error ? <div role="alert" className="mt-4 rounded-2xl bg-white p-6 ring-1 ring-red-100"><p className="text-sm text-red-600">{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 min-h-11 rounded-xl border border-black/10 px-4 text-xs font-semibold">Try again</button></div>
        : <><div className="my-4 flex flex-wrap items-center justify-between gap-2"><p aria-live="polite" className="text-xs text-black/50">Showing {visible.length} of {orders.length} orders</p>{search || status !== "all" || payment !== "all" ? <button type="button" onClick={clearFilters} className="min-h-11 px-2 text-xs font-semibold !text-[#001cac]">Clear filters</button> : null}</div>
          {visible.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((order) => <article key={order.id} className="flex min-w-0 flex-col rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h2 className="break-all text-sm font-semibold"><Link href={"/admin/orders/" + order.id} className="!text-[#001cac] hover:underline">{order.orderNumber}</Link></h2><p className="mt-1 text-[10px] text-black/45">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p></div><span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-[10px] font-semibold capitalize text-[#001cac]">{order.status.replaceAll("-", " ")}</span></div>
            <div className="mt-4"><p className="break-words text-sm font-semibold">{order.customer.name}</p><a href={"tel:" + order.customer.phone} className="mt-1 inline-block break-all text-xs !text-black/50 hover:underline">{order.customer.phone}</a></div>
            <ul className="my-4 space-y-2 rounded-xl bg-[#fafafa] p-3">{order.items.slice(0, 2).map((item, index) => <li key={index} className="break-words text-xs leading-5">{item.name} <span className="text-black/45">× {item.quantity}</span></li>)}{order.items.length > 2 ? <li className="text-[10px] text-black/45">+{order.items.length - 2} more items</li> : null}</ul>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2"><strong className="text-base">{money(order.total)}</strong><span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize " + (order.paymentStatus === "paid" ? "bg-green-50 text-green-700" : order.paymentStatus === "failed" ? "bg-red-50 text-red-600" : "bg-[#fafafa] text-black/60")}>{order.paymentMethod.toUpperCase()} · {order.paymentStatus}</span></div>
            <p className="mt-3 break-words text-xs leading-5 text-black/45">{order.trackingId ? [order.courier, order.trackingId].filter(Boolean).join(" · ") : "No tracking added"}</p>
            <Link href={"/admin/orders/" + order.id} className="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-black/10 px-4 text-xs font-semibold !text-[#001cac] hover:bg-[#eef2ff]">View order details →</Link>
          </article>)}</div> : <div className="rounded-2xl bg-white px-5 py-12 text-center ring-1 ring-black/5"><h2 className="text-base font-semibold">{orders.length ? "No matching orders" : "No orders yet"}</h2><p className="mt-2 text-xs leading-5 text-black/50">{orders.length ? "Try another search or change the filters." : "Create a manual order to get started."}</p><button type="button" onClick={orders.length ? clearFilters : () => { setCreateError(""); setDrawerOpen(true); }} className="mt-4 min-h-11 rounded-xl bg-[#001cac] px-4 text-xs font-semibold !text-white">{orders.length ? "Clear filters" : "+ New order"}</button></div>}
        </>}
    </section>
  </div>;
}
