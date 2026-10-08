"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { orderStatuses } from "@/lib/order-statuses";
import type { Order, OrderStatus, PaymentMethod, PaymentStatus } from "@/types/admin";

type Draft = { status: OrderStatus; paymentStatus: PaymentStatus; paymentMethod: PaymentMethod; courier: string; trackingId: string; notes: string };
const draftFrom = (order: Order): Draft => ({ status: order.status, paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, courier: order.courier || "", trackingId: order.trackingId || "", notes: order.notes || "" });
const money = (value: number) => "₹" + value.toLocaleString("en-IN");
const date = (value: string) => new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-sm font-normal outline-none focus:border-[#001cac] focus:ring-2 focus:ring-[#001cac]/10";

export function AdminOrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setOrder(null); setDraft(null); setError(""); setNotFound(false); setSaveError(""); setMessage("");
    async function load() {
      try {
        const response = await fetch("/api/admin/orders/" + encodeURIComponent(orderId), { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) { setNotFound(response.status === 404); throw new Error(data.error || "Could not load order."); }
        setOrder(data.order); setDraft(draftFrom(data.order));
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load order."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [orderId, retry]);

  function change(patch: Partial<Draft>) { setDraft((current) => current ? { ...current, ...patch } : current); setMessage(""); }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true); setSaveError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/orders/" + encodeURIComponent(orderId), { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save order.");
      setOrder(data.order); setDraft(draftFrom(data.order)); setMessage("Order updated.");
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Could not save order."); }
    finally { setSaving(false); }
  }
  const dirty = order && draft ? JSON.stringify(draftFrom(order)) !== JSON.stringify(draft) : false;

  return <div className="min-w-0">
    <Link href="/admin/orders" className="inline-flex min-h-11 items-center text-xs font-semibold !text-[#001cac] hover:underline">← Back to orders</Link>
    <p className="mt-3 text-[10px] font-bold tracking-[.16em] text-[#001cac]">ORDER DETAILS</p>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h1 className="break-all text-3xl font-bold tracking-[-.04em]">{order?.orderNumber || "Order details"}</h1>{order ? <span className="rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-semibold capitalize text-[#001cac]">{order.status.replaceAll("-", " ")}</span> : null}</div>
    {order ? <p className="mt-2 text-xs text-black/45">Placed {date(order.createdAt)}</p> : null}
    {loading ? <div role="status" aria-label="Loading order" className="mt-6 grid gap-5 lg:grid-cols-3"><div className="h-96 animate-pulse rounded-2xl bg-black/5 motion-reduce:animate-none lg:col-span-2" /><div className="h-96 animate-pulse rounded-2xl bg-black/5 motion-reduce:animate-none" /></div>
      : error ? <div role="alert" className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-black/5"><p className="text-sm text-red-600">{error}</p>{!notFound ? <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-4 min-h-11 rounded-xl border border-black/10 px-4 text-xs font-semibold">Try again</button> : null}</div>
      : order && draft ? <div className="mt-6 grid items-start gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5"><h2 className="text-base font-semibold">Order items</h2>
            <ul className="mt-4 divide-y divide-black/5">{order.items.map((item, index) => <li key={index} className="flex flex-wrap justify-between gap-3 py-4 first:pt-0"><div className="min-w-0 flex-1"><Link href={"/admin/products/" + item.productId} className="break-words text-sm font-semibold !text-[#001cac] hover:underline">{item.name}</Link><p className="mt-1 break-words text-xs leading-5 text-black/50">{[item.size, item.color].filter(Boolean).join(" / ")}</p><p className="mt-1 text-xs text-black/50">{item.quantity} × {money(item.unitPrice)}</p></div><strong className="text-sm">{money(item.total)}</strong></li>)}</ul>
            <dl className="mt-3 space-y-3 border-t border-black/10 pt-4 text-xs"><div className="flex justify-between gap-3"><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div><div className="flex justify-between gap-3"><dt>Discount</dt><dd>−{money(order.discount)}</dd></div><div className="flex justify-between gap-3"><dt>Shipping</dt><dd>{money(order.shipping)}</dd></div><div className="flex justify-between gap-3 border-t border-black/10 pt-3 text-base font-semibold"><dt>Total</dt><dd>{money(order.total)}</dd></div></dl>
          </section>
          <section className="grid gap-5 rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:grid-cols-2"><div><h2 className="text-sm font-semibold">Customer</h2><p className="mt-3 break-words text-sm font-semibold">{order.customer.name}</p><div className="mt-2 flex flex-col items-start gap-2 text-xs leading-5 text-black/55"><a href={"tel:" + order.customer.phone} className="break-all hover:underline">{order.customer.phone}</a>{order.customer.email ? <a href={"mailto:" + order.customer.email} className="break-all hover:underline">{order.customer.email}</a> : null}</div></div><div><h2 className="text-sm font-semibold">Delivery address</h2><p className="mt-3 break-words text-xs leading-6 whitespace-pre-line">{[order.customer.address, order.customer.city, order.customer.state, order.customer.pincode].filter(Boolean).join(", ")}</p></div></section>
        </div>
        <form data-admin-form onSubmit={save} className="min-w-0 rounded-2xl bg-white p-5 ring-1 ring-black/5">
          <h2 className="text-base font-semibold">Manage order</h2>
          <fieldset disabled={saving} className="mt-4 space-y-4 disabled:opacity-60">
            <label className="block text-xs font-semibold">Order status<select value={draft.status} onChange={(event) => change({ status: event.target.value as OrderStatus })} className={inputClass}>{orderStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("-", " ")}</option>)}</select></label>
            <label className="block text-xs font-semibold">Payment status<select value={draft.paymentStatus} onChange={(event) => change({ paymentStatus: event.target.value as PaymentStatus })} className={inputClass}><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label>
            <label className="block text-xs font-semibold">Payment method<select value={draft.paymentMethod} onChange={(event) => change({ paymentMethod: event.target.value as PaymentMethod })} className={inputClass}><option value="cod">Cash on delivery</option><option value="prepaid">Prepaid</option><option value="manual">Manual</option></select></label>
            <label className="block text-xs font-semibold">Courier<input value={draft.courier} onChange={(event) => change({ courier: event.target.value })} placeholder="Courier name" className={inputClass} /></label>
            <label className="block text-xs font-semibold">Tracking ID<input value={draft.trackingId} onChange={(event) => change({ trackingId: event.target.value })} placeholder="Tracking number" className={inputClass} /></label>
            <label className="block text-xs font-semibold">Order notes<textarea value={draft.notes} onChange={(event) => change({ notes: event.target.value })} rows={3} placeholder="Internal order notes" className={inputClass + " resize-y py-3"} /></label>
          </fieldset>
          {order.stockRestored ? <p className="mt-4 text-xs leading-5 text-black/50">Stock has been restored for this order.</p> : ["cancelled", "returned", "refunded"].includes(draft.status) ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Saving this status restores the stock deducted for this order.</p> : null}
          <div className="mt-4 flex flex-wrap gap-2"><button type="submit" disabled={!dirty || saving} className="min-h-11 flex-1 rounded-xl bg-[#001cac] px-4 text-xs font-semibold !text-white disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button><button type="button" disabled={!dirty || saving} onClick={() => { setDraft(draftFrom(order)); setSaveError(""); setMessage(""); }} className="min-h-11 rounded-xl border border-black/10 px-4 text-xs font-semibold disabled:opacity-50">Reset</button></div>
          {saveError ? <p role="alert" className="mt-3 text-xs text-red-600">{saveError}</p> : null}{message ? <p role="status" className="mt-3 text-xs text-green-700">{message}</p> : null}
        </form>
      </div> : null}
  </div>;
}
