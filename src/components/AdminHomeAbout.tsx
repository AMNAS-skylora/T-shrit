"use client";

import { useEffect, useState } from "react";
import { HomeAboutSection } from "@/components/HomeAboutSection";
import { uploadAdminImage } from "@/lib/admin-image-upload";
import type { StoreSettings } from "@/types/commerce";

const fields = ["homeAboutEnabled", "homeAboutEyebrow", "homeAboutTitle", "homeAboutBody", "homeAboutImages", "homeAboutQualityPoints"] as const;
const button = "min-h-11 rounded-xl border border-black/10 px-4 text-sm font-semibold disabled:opacity-50";

export function AdminHomeAbout() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  async function load(signal?: AbortSignal) {
    const response = await fetch("/api/admin/settings", { cache: "no-store", signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load About section.");
    setSettings(data.settings);
  }
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).catch((error) => { if (!controller.signal.aborted) setMessage(error.message); });
    return () => controller.abort();
  }, []);
  function update<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setSettings((current) => current ? { ...current, [key]: value } : current);
  }
  async function save() {
    if (!settings || saving || uploading) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(fields.map((field) => [field, settings[field]]))) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save About section.");
      setSettings(data.settings); setMessage("About section saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save About section."); }
    finally { setSaving(false); }
  }
  async function upload(files: File[]) {
    if (saving || uploading || !files.length) return;
    setUploading(true); setMessage("");
    try {
      for (const file of files) {
        const image = await uploadAdminImage(file, "kleidin/uploads");
        setSettings((current) => current ? { ...current, homeAboutImages: [...current.homeAboutImages, image.url] } : current);
      }
      setMessage("Images uploaded. Save to publish your changes.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not upload images."); }
    finally { setUploading(false); }
  }
  return <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-6">
    <h2 className="text-2xl font-semibold">About &amp; T-shirt quality</h2>
    <p className="mt-2 text-sm text-black/55">Shown below the hero sections, before the catalog. Add your dress photos and quality details.</p>
    {!settings ? <><p role="status" className="mt-4">{message || "Loading About section…"}</p>{message ? <button type="button" onClick={() => void load().catch((error) => setMessage(error.message))} className={button}>Retry</button> : null}</> : <form data-admin-form onSubmit={(event) => { event.preventDefault(); void save(); }} className="mt-6">
      <fieldset disabled={saving || uploading} className="grid min-w-0 gap-5 disabled:opacity-70">
        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.homeAboutEnabled} onChange={(event) => update("homeAboutEnabled", event.target.checked)} />Show About section</label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label>Eyebrow<input value={settings.homeAboutEyebrow} onChange={(event) => update("homeAboutEyebrow", event.target.value)} placeholder="About our T-shirts" /></label>
          <label>Heading<textarea rows={2} value={settings.homeAboutTitle} onChange={(event) => update("homeAboutTitle", event.target.value)} /></label>
        </div>
        <label>Description<textarea rows={4} value={settings.homeAboutBody} onChange={(event) => update("homeAboutBody", event.target.value)} /></label>
        <div><h3 className="text-sm font-semibold">Quality points</h3><p className="mt-1 text-xs text-black/55">Describe your fabric, fit or stitching using your actual product details.</p>
          <div className="mt-3 grid gap-3">{settings.homeAboutQualityPoints.map((point, index) => <div key={index} className="flex min-w-0 items-center gap-2"><label className="min-w-0 flex-1">Quality point {index + 1}<input value={point} onChange={(event) => update("homeAboutQualityPoints", settings.homeAboutQualityPoints.map((value, i) => i === index ? event.target.value : value))} /></label><button type="button" aria-label={`Remove quality point ${index + 1}`} onClick={() => update("homeAboutQualityPoints", settings.homeAboutQualityPoints.filter((_, i) => i !== index))} className={button}>Remove</button></div>)}</div>
          <button type="button" onClick={() => update("homeAboutQualityPoints", [...settings.homeAboutQualityPoints, ""])} className={`${button} mt-3`}>+ Add quality point</button>
        </div>
        <div><h3 className="text-sm font-semibold">Dress images</h3><p className="mt-1 text-xs text-black/55">The first photo is the large image. Photos stay fully visible on mobile.</p>
          <label className="mt-3 block">Upload images<input type="file" accept="image/*" multiple onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = ""; void upload(files); }} /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">{settings.homeAboutImages.map((url, index) => <div key={`${index}-${url}`} className="min-w-0 rounded-xl border border-black/10 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`About image ${index + 1}`} className="aspect-[4/3] w-full rounded-lg object-contain" />
            <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={index === 0} onClick={() => { const images = [...settings.homeAboutImages]; [images[index - 1], images[index]] = [images[index], images[index - 1]]; update("homeAboutImages", images); }} className={button}>Move earlier</button><button type="button" onClick={() => update("homeAboutImages", settings.homeAboutImages.filter((_, i) => i !== index))} className={button}>Remove</button></div>
          </div>)}</div>
        </div>
      </fieldset>
      <div data-admin-actions className="flex flex-wrap gap-3"><button type="submit" disabled={saving || uploading} className={`${button} bg-[#001cac] !text-white`}>{saving ? "Saving…" : uploading ? "Uploading…" : "Save About section"}</button><button type="button" onClick={() => setPreview(!preview)} className={button}>{preview ? "Hide preview" : "Preview"}</button></div>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
      {preview ? <div className="overflow-hidden rounded-xl"><HomeAboutSection settings={settings} />{!settings.homeAboutEnabled ? <p className="p-4 text-sm">Enable the section to preview it.</p> : !(settings.homeAboutTitle || settings.homeAboutBody || settings.homeAboutImages.length || settings.homeAboutQualityPoints.some(Boolean)) ? <p className="p-4 text-sm">Add content to preview this section.</p> : null}</div> : null}
    </form>}
  </section>;
}
