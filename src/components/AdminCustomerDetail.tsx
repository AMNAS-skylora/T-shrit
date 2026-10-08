"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomerCard } from "@/components/AdminCustomersManager";
import type { Customer, Order } from "@/types/admin";

type Details = { customer: Customer; orders: Order[]; hasMoreOrders: boolean };
const date = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const money = (value: number) => "₹" + value.toLocaleString("en-IN");

export function AdminCustomerDetail({ customerId }: { customerId: string }) {
  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setDetails(null); setError(""); setNotFound(false);
    async function load() {
      try {
        const response = await fetch("/api/admin/customers/" + encodeURIComponent(customerId), { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) {
          setNotFound(response.status === 404);
          throw new Error(data.error || "Could not load customer.");
        }
        setDetails(data);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load customer.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [customerId, retry]);

  async function update(id: string, patch: Partial<Pick<Customer, "notes" | "status">>) {
    const response = await fetch("/api/admin/customers/" + encodeURIComponent(id), {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not update customer.");
    setDetails((current) => current ? { ...current, customer: { ...current.customer, ...patch } } : current);
  }

  return <div className="min-w-0">
    <Link href="/admin/customers" className="inline-flex min-h-11 items-center text-xs font-semibold !text-[#001cac] hover:underline">← Back to customers</Link>
    <p className="mt-3 text-[10px] font-bold tracking-[.16em] text-[#001cac]">CUSTOMER DETAILS</p>
    <h1 className="mt-2 break-words text-3xl font-bold tracking-[-.04em]">{details?.customer.name || "Customer profile"}</h1>
    {loading ? <div role="status" aria-label="Loading customer details" className="mt-6 grid gap-4 lg:grid-cols-3"><div className="h-96 animate-pulse rounded-2xl bg-black/5 motion-reduce:animate-none" /><div className="h-96 animate-pulse rounded-2xl bg-black/5 motion-reduce:animate-none lg:col-span-2" /></div>
      : error ? <div role="alert" className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-black/5"><p className="text-sm text-red-600">{error}</p>{!notFound ? <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-4 min-h-11 rounded-xl border border-black/10 px-4 text-xs font-semibold">Try again</button> : null}</div>
      : details ? <div className="mt-6 grid items-start gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-5">
          <CustomerCard key={details.customer.id} customer={details.customer} update={update} showDetailLink={false} />
          <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5"><h2 className="text-sm font-semibold">Saved addresses</h2>{details.customer.addresses.length ? <ul className="mt-3 space-y-3">{details.customer.addresses.map((address, index) => <li key={index} className="break-words rounded-xl bg-[#fafafa] p-3 text-xs leading-6 whitespace-pre-line">{address}</li>)}</ul> : <p className="mt-3 text-xs text-black/50">No saved addresses.</p>}<dl className="mt-4 border-t border-black/5 pt-4 text-xs"><dt className="text-black/45">Customer since</dt><dd className="mt-1">{date(details.customer.createdAt)}</dd></dl></section>
        </div>
        <section className="min-w-0 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Recent orders</h2><span className="text-xs text-black/45">{details.orders.length} shown</span></div>
          {details.hasMoreOrders ? <p className="mt-2 text-xs text-black/50">Showing the latest 100 orders.</p> : null}
          {details.orders.length ? <div className="mt-4 space-y-4">{details.orders.map((order) => <article key={order.id} className="rounded-xl border border-black/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="break-all text-sm font-semibold">{order.orderNumber}</h3><p className="mt-1 text-xs text-black/45">{date(order.createdAt)}</p></div><strong className="text-sm">{money(order.total)}</strong></div>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold"><span className="rounded-full bg-[#eef2ff] px-3 py-1 capitalize text-[#001cac]">{order.status.replaceAll("-", " ")}</span><span className="rounded-full bg-[#fafafa] px-3 py-1 capitalize">Payment: {order.paymentStatus} · {order.paymentMethod.toUpperCase()}</span></div>
            <ul className="mt-4 space-y-2 border-t border-black/5 pt-3">{order.items.map((item, index) => <li key={index} className="flex justify-between gap-3 text-xs leading-5"><div className="min-w-0"><p className="break-words font-semibold">{item.name} × {item.quantity}</p>{item.size || item.color ? <p className="break-words text-black/45">{[item.size, item.color].filter(Boolean).join(" / ")}</p> : null}</div><span className="shrink-0">{money(item.total)}</span></li>)}</ul>
            {order.trackingId ? <p className="mt-3 break-all text-xs leading-5 text-black/50">Tracking: {order.trackingId}{order.courier ? " · " + order.courier : ""}</p> : null}
          </article>)}</div> : <div className="py-10 text-center"><p className="text-sm font-semibold">No orders yet</p><p className="mt-2 text-xs text-black/50">This customer’s orders will appear here.</p></div>}
        </section>
      </div> : null}
  </div>;
}
