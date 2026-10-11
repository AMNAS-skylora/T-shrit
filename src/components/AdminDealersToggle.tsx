"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionFeedback } from "@/components/AdminActionFeedback";

export function AdminDealersToggle() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/admin/settings", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load Dealers setting.");
        setEnabled(Boolean(data.settings.homeDealersEnabled));
      } catch (failure) {
        if (controller.signal.aborted) return;
        setError(true); setMessage(failure instanceof Error ? failure.message : "Could not load Dealers setting.");
      }
    }
    void load();
    return () => controller.abort();
  }, []);
  async function toggle() {
    if (saving || enabled === null) return;
    setSaving(true); setMessage(""); setError(false);
    try {
      const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ homeDealersEnabled: !enabled }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save Dealers setting.");
      const next = Boolean(data.settings.homeDealersEnabled);
      setEnabled(next); setMessage(next ? "Dealers is ON." : "Dealers is OFF.");
      router.refresh();
    } catch (failure) { setError(true); setMessage(failure instanceof Error ? failure.message : "Could not save Dealers setting."); }
    finally { setSaving(false); }
  }
  return <section className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5" aria-label="Dealers availability">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-sm font-semibold">Dealers</h2><p className="mt-2 max-w-xl text-xs leading-5 text-black/55">Control the homepage Dealers section, navigation and all dealer pages.</p></div><button type="button" role="switch" aria-checked={enabled === true} aria-label="Enable Dealers" disabled={enabled === null || saving} onClick={toggle} className={"inline-flex min-h-11 min-w-28 items-center justify-center gap-3 rounded-full px-5 text-xs font-semibold disabled:opacity-50 " + (enabled ? "bg-[#001cac] !text-white" : "bg-[#f1f1f1] text-black")}><span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />{saving ? "Saving…" : enabled === null ? "Loading…" : enabled ? "ON" : "OFF"}</button></div>
    <AdminActionFeedback message={message} error={error} />
  </section>;
}
