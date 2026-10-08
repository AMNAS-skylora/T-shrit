"use client";

import { useEffect, useId, useState } from "react";

export function AdminCategorySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/categories", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load categories.");
        setCategories(data.categories || []);
      })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not load categories."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function add() {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not add category.");
      setCategories((current) => [...new Set([...current, data.category])]);
      onChange(data.category);
      setName("");
      setAdding(false);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not add category."); }
    finally { setBusy(false); }
  }

  const options = [...new Set([...categories, ...(value ? [value] : [])])].sort((a, b) => a.localeCompare(b));
  const inputClass = "min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#001cac]";
  return (
    <div>
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-[.08em] text-black/50">Category</label>
      <div className="mt-2 flex gap-2">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} disabled={busy}>
          <option value="">{loading ? "Loading categories…" : "Select category"}</option>
          {options.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <button type="button" onClick={() => { setAdding(!adding); setError(""); }} disabled={busy} className="shrink-0 rounded-xl border border-black/10 px-3 text-xs font-semibold">{adding ? "Cancel" : "+ Add"}</button>
      </div>
      {adding ? <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input aria-label="New category name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoFocus disabled={busy} className={inputClass} placeholder="Category name" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void add(); } }} />
        <button type="button" onClick={() => void add()} disabled={busy || !name.trim()} className="shrink-0 rounded-xl bg-[#001cac] px-3 text-xs font-semibold !text-white disabled:opacity-50">{busy ? "Adding…" : "Add category"}</button>
      </div> : null}
      {error ? <p role="alert" className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
