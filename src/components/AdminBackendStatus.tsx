"use client";
import { useEffect, useState } from "react";

type Health = { ok: boolean; database: string; adminConfigured: boolean; cloudinaryConfigured: boolean };
export function AdminBackendStatus() {
  const [status, setStatus] = useState<Health | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const health = await response.json();
      if (typeof health.database !== "string") throw new Error("Could not check backend connection.");
      setStatus(health); setMessage("");
    } catch { setMessage("Could not check backend connection. Try again."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  return <section className="mb-6 rounded-2xl bg-white p-5 ring-1 ring-black/5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Backend connection</h2><button type="button" onClick={refresh} disabled={loading} className="min-h-11 rounded-lg border border-black/15 px-4 text-sm disabled:opacity-50">{loading ? "Checking…" : "Check connection"}</button></div>
    <p className="mt-3 text-sm" role="status">{message || (status ? `Database: ${status.database}. Admin login: ${status.adminConfigured ? "configured" : "not configured"}. Image uploads: ${status.cloudinaryConfigured ? "configured" : "not configured"}.` : "Checking services…")}</p>
    {status && !status.ok ? <p className="mt-3 text-sm text-black/55">Configure MongoDB, Admin login and Cloudinary credentials in your server environment, then check again.</p> : null}
  </section>;
}
