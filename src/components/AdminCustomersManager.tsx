"use client";

import { useEffect, useState } from "react";
import type { Customer } from "@/types/admin";

export function AdminCustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/customers", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load customers.");
    setCustomers(data.customers || []);
  }

  useEffect(() => {
    void load().catch((error) => setMessage(error instanceof Error ? error.message : "Could not load customers."));
  }, []);

  async function update(id: string, patch: Record<string, unknown>) {
    const response = await fetch("/api/admin/customers/" + id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Could not update customer.");
      return;
    }
    await load();
  }

  return (
    <div>
      <p className="text-[10px] font-bold tracking-[.16em] text-[#001cac]">CRM</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">Customers</h1>

      {message ? <p className="mt-4 text-xs text-red-600">{message}</p> : null}

      <section className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="text-black/40"><tr><th className="py-3">Customer</th><th>Phone</th><th>Orders</th><th>Spend</th><th>Last order</th><th>Notes</th><th>Status</th></tr></thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-black/5">
                  <td className="py-3">
                    <strong>{customer.name}</strong>
                    <div className="mt-1 text-black/40">{customer.email || "No email"}</div>
                  </td>
                  <td>{customer.phone}</td>
                  <td>{customer.totalOrders}</td>
                  <td>₹{customer.totalSpend.toLocaleString("en-IN")}</td>
                  <td>{customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString("en-IN") : "—"}</td>
                  <td>
                    <input defaultValue={customer.notes || ""} placeholder="Notes" onBlur={(e) => void update(customer.id, { notes: e.target.value })} className="w-52 rounded-lg border border-black/10 px-2 py-1.5" />
                  </td>
                  <td>
                    <button onClick={() => void update(customer.id, { status: customer.status === "active" ? "blocked" : "active" })} className={customer.status === "active" ? "rounded-lg border border-black/10 px-3 py-1.5 font-semibold" : "rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 font-semibold text-red-600"}>
                      {customer.status}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
