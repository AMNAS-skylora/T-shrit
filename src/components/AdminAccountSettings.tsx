"use client";
import { type FormEvent, useEffect, useState } from "react";

export function AdminAccountSettings() {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/account", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load account.");
      setEmail(data.email || ""); setSavedEmail(data.email || "");
    }).catch((error) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Could not load account."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  function close() {
    setEditing(false); setEmail(savedEmail); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setShowPassword(false);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) { setMessage("New passwords do not match."); return; }
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/account", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, currentPassword, newPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update account.");
      setSavedEmail(data.email); setEmail(data.email); setEditing(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setShowPassword(false);
      setMessage("Account updated. Other signed-in sessions have been signed out.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update account."); }
    finally { setSaving(false); }
  }
  const inputClass = "mt-1.5 min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#001cac]";
  return <section className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-black/5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Admin account</h2><p className="mt-1 text-sm text-black/55">{loading ? "Loading account…" : savedEmail || "Account unavailable"}</p></div>
      {!editing ? <button type="button" disabled={loading || !savedEmail} onClick={() => { setEditing(true); setMessage(""); }} className="min-h-11 rounded-xl border border-black/10 px-4 text-xs font-semibold disabled:opacity-50">Change email / password</button> : null}
    </div>
    {editing ? <form onSubmit={save} className="mt-5 grid gap-4 md:grid-cols-2">
      <label className="text-xs font-semibold">Login email<input type="email" autoComplete="username" value={email} required maxLength={254} disabled={saving} onChange={(event) => setEmail(event.target.value)} className={inputClass} /></label>
      <label className="text-xs font-semibold">Current password<input type={showPassword ? "text" : "password"} autoComplete="current-password" value={currentPassword} required maxLength={256} disabled={saving} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} /></label>
      <label className="text-xs font-semibold">New password<input type={showPassword ? "text" : "password"} autoComplete="new-password" value={newPassword} minLength={12} maxLength={256} disabled={saving} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} /><span className="mt-1 block font-normal text-black/45">At least 12 characters. Leave blank to keep your password.</span></label>
      <label className="text-xs font-semibold">Confirm new password<input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} required={Boolean(newPassword)} maxLength={256} disabled={saving} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} /></label>
      <label className="flex items-center gap-2 text-xs md:col-span-2"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Show passwords</label>
      <div className="flex gap-2 md:col-span-2"><button type="button" disabled={saving} onClick={close} className="min-h-11 rounded-xl border border-black/10 px-4 text-xs font-semibold">Cancel</button><button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-[#001cac] px-4 text-xs font-semibold !text-white disabled:opacity-50">{saving ? "Saving…" : "Save account"}</button></div>
    </form> : null}
    {message ? <p role="status" className="mt-3 text-sm text-black/60">{message}</p> : null}
  </section>;
}
