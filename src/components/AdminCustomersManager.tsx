"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import type { Customer } from "@/types/admin";

type Patch = Partial<Pick<Customer, "notes" | "status">>;

export function AdminCustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const query = useDeferredValue(search).trim().toLowerCase();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    async function load() {
      try {
        const response = await fetch("/api/admin/customers", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load customers.");
        setCustomers(data.customers || []);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load customers.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [retry]);

  async function update(id: string, patch: Patch) {
    const response = await fetch("/api/admin/customers/" + id, {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not update customer.");
    setCustomers((current) => current.map((customer) => customer.id === id ? { ...customer, ...patch } : customer));
  }

  const visible = customers.filter((customer) => (status === "all" || customer.status === status) &&
    (!query || [customer.name, customer.email, customer.phone].some((value) => value?.toLowerCase().includes(query))));

  return <div className="min-w-0">
    <p className="text-[10px] font-bold tracking-[.16em] text-[#001cac]">CRM</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-3xl font-bold tracking-[-.04em]">Customers</h1><p className="mt-2 text-xs leading-5 text-black/50">Contact details, orders and customer notes.</p></div>
      {!loading && !error ? <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold ring-1 ring-black/10">{customers.length} customers</span> : null}
    </div>
    <section aria-label="Customer list" className="mt-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-xs font-semibold">Search customers
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone or email" className="mt-2 min-h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-sm font-normal outline-none focus:border-[#001cac] focus:ring-2 focus:ring-[#001cac]/10" />
        </label>
        <label className="text-xs font-semibold sm:w-44">Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-sm font-normal outline-none focus:border-[#001cac]">
            <option value="all">All customers</option><option value="active">Active</option><option value="blocked">Blocked</option>
          </select>
        </label>
      </div>
      {loading ? <div role="status" aria-label="Loading customers" className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((key) => <div key={key} className="h-72 animate-pulse rounded-2xl bg-black/5 motion-reduce:animate-none" />)}</div>
        : error ? <div role="alert" className="mt-4 rounded-2xl border border-red-100 bg-white p-6"><p className="text-sm text-red-600">{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 min-h-11 rounded-xl border border-black/10 px-4 text-xs font-semibold">Try again</button></div>
        : <><p className="my-4 text-xs text-black/50" aria-live="polite">Showing {visible.length} of {customers.length} customers</p>
          {visible.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((customer) => <CustomerCard key={customer.id} customer={customer} update={update} />)}</div>
            : <div className="rounded-2xl bg-white px-5 py-12 text-center ring-1 ring-black/5"><h2 className="text-base font-semibold">{customers.length ? "No matching customers" : "No customers yet"}</h2><p className="mt-2 text-xs leading-5 text-black/50">{customers.length ? "Try another search or change the status filter." : "Customers will appear here when orders are recorded."}</p>{customers.length ? <button type="button" onClick={() => { setSearch(""); setStatus("all"); }} className="mt-4 min-h-11 rounded-xl bg-[#001cac] px-4 text-xs font-semibold !text-white">Clear filters</button> : null}</div>}
        </>}
    </section>
  </div>;
}

export function CustomerCard({ customer, update, showDetailLink = true }: { customer: Customer; update: (id: string, patch: Patch) => Promise<void>; showDetailLink?: boolean }) {
  const [notes, setNotes] = useState(customer.notes || "");
  const [busy, setBusy] = useState<"notes" | "status" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const dirty = notes.trim() !== (customer.notes || "");
  async function save(kind: "notes" | "status") {
    setBusy(kind); setError(""); setMessage("");
    try {
      await update(customer.id, kind === "notes" ? { notes: notes.trim() } : { status: customer.status === "active" ? "blocked" : "active" });
      if (kind === "notes") { setNotes(notes.trim()); setMessage("Notes saved."); }
      else setMessage("Status updated.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update customer."); }
    finally { setBusy(null); }
  }
  return <article className="flex min-w-0 flex-col rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><h2 className="break-words text-base font-semibold">{showDetailLink ? <Link href={"/admin/customers/" + customer.id} className="hover:underline">{customer.name}</Link> : customer.name}</h2><div className="mt-2 flex flex-col items-start gap-1 text-xs leading-5 text-black/55">{customer.phone ? <a href={"tel:" + customer.phone} className="break-all hover:underline">{customer.phone}</a> : <span>No phone</span>}{customer.email ? <a href={"mailto:" + customer.email} className="break-all hover:underline">{customer.email}</a> : <span>No email</span>}</div></div>
      <span className={"shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold " + (customer.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}>{customer.status === "active" ? "Active" : "Blocked"}</span>
    </div>
    <dl className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-[#fafafa] p-3"><div><dt className="text-[10px] text-black/45">Orders</dt><dd className="mt-1 text-sm font-semibold">{customer.totalOrders}</dd></div><div><dt className="text-[10px] text-black/45">Total spend</dt><dd className="mt-1 break-words text-sm font-semibold">₹{customer.totalSpend.toLocaleString("en-IN")}</dd></div><div className="col-span-2"><dt className="text-[10px] text-black/45">Last order</dt><dd className="mt-1 text-xs">{customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString("en-IN") : "No orders yet"}</dd></div></dl>
    <label className="mt-auto text-xs font-semibold">Notes<textarea value={notes} onChange={(event) => { setNotes(event.target.value); setMessage(""); }} disabled={busy !== null} rows={2} placeholder="Add a customer note" className="mt-2 w-full resize-y rounded-xl border border-black/10 px-3 py-2 text-sm font-normal outline-none focus:border-[#001cac] disabled:opacity-60" /></label>
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!dirty || busy !== null} onClick={() => void save("notes")} className="min-h-11 flex-1 rounded-xl bg-[#001cac] px-3 text-xs font-semibold !text-white disabled:opacity-50">{busy === "notes" ? "Saving…" : "Save notes"}</button><button type="button" disabled={busy !== null} onClick={() => void save("status")} className={"min-h-11 flex-1 rounded-xl border px-3 text-xs font-semibold disabled:opacity-50 " + (customer.status === "active" ? "border-red-100 !text-red-600" : "border-black/10 !text-[#001cac]")}>{busy === "status" ? "Updating…" : customer.status === "active" ? "Block customer" : "Unblock customer"}</button></div>
    {showDetailLink ? <Link href={"/admin/customers/" + customer.id} className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-black/10 px-3 text-xs font-semibold !text-[#001cac] hover:bg-[#eef2ff]">View customer details →</Link> : null}
    {error ? <p role="alert" className="mt-3 text-xs text-red-600">{error}</p> : null}{message ? <p role="status" className="mt-3 text-xs text-green-700">{message}</p> : null}
  </article>;
}
