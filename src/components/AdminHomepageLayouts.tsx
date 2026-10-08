"use client";
import { useEffect, useRef, useState } from "react";
import { AdminDrawer } from "@/components/AdminDrawer";
import { homepageLayoutGroups, normalizeHomepageLayouts, type HomepageLayouts } from "@/lib/homepage-layouts";
import styles from "@/components/AdminHomepageLayouts.module.css";

function LayoutCardPreview({ section, layout }: { section: string; layout: string }) {
  return <div aria-hidden="true" className={`${styles.preview} ${styles[layout] || ""}`}>
    {section === "homeCatalogLayout" ? <div className={styles.cards}>{[0,1,2,3].map((index) => <div key={index} className={styles.card}><div className={styles.image}>Image</div><span /><span /></div>)}</div> : <><div className={styles.copy}><span /><span /><span /><span /></div><div className={styles.image}>Product image</div></>}
  </div>;
}
export function AdminHomepageLayouts() {
  const [layouts, setLayouts] = useState<HomepageLayouts | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<keyof HomepageLayouts | null>(null);
  const [mobile, setMobile] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(650);
  const previewContainer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = previewContainer.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setPreviewWidth(entry.contentRect.width));
    observer.observe(container);
    return () => observer.disconnect();
  }, [preview]);
  const frameWidth = mobile ? 375 : 1280;
  const previewScale = Math.min(1, previewWidth / frameWidth);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/settings", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load layouts.");
      setLayouts(normalizeHomepageLayouts(data.settings));
    }).catch((error) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Could not load layouts."); });
    return () => controller.abort();
  }, []);
  async function save() {
    if (!layouts) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(layouts) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save layouts.");
      setLayouts(normalizeHomepageLayouts(data.settings)); setMessage("Homepage layouts saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save layouts."); }
    finally { setSaving(false); }
  }
  return <section className="mb-8 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Homepage layouts</h1><p className="mt-2 text-xs text-black/50">Choose a style, preview it, then save. Layout cards are wireframes; full previews use your published content.</p></div><button type="button" onClick={() => void save()} disabled={!layouts || saving} className="min-h-11 rounded-xl bg-[#001cac] px-5 text-xs font-semibold !text-white disabled:opacity-50">{saving ? "Saving…" : "Save layouts"}</button></div>
    {!layouts ? <p role="status" className="mt-4 text-sm">{message || "Loading layouts…"}</p> : homepageLayoutGroups.map((group) => <div key={group.key} className="mt-7"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">{group.title}</h2><button type="button" onClick={() => setPreview(group.key)} className="min-h-11 px-3 text-xs font-semibold text-[#001cac]">Preview selected layout ↗</button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{group.options.map((option) => <button type="button" key={option.value} aria-pressed={layouts[group.key] === option.value} disabled={saving} onClick={() => { setLayouts({ ...layouts, [group.key]: option.value }); setMessage(""); }} className={"rounded-xl border-2 p-3 text-left " + (layouts[group.key] === option.value ? "border-[#001cac]" : "border-black/10")}><LayoutCardPreview section={group.key} layout={option.value} /><strong className="mt-3 block text-xs">{option.name}{layouts[group.key] === option.value ? " · Selected" : ""}</strong><span className="mt-1 block text-xs leading-5 text-black/50">{option.description}</span></button>)}</div></div>)}
    {layouts && message ? <p role="status" className="mt-4 text-sm text-black/60">{message}</p> : null}
    <AdminDrawer open={Boolean(preview)} title="Layout preview" description="Preview your current selection before saving." onClose={() => setPreview(null)}>
      <div className="mb-4 flex gap-2"><button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)} className="min-h-11 rounded-lg border border-black/10 px-4 text-xs">Desktop</button><button type="button" aria-pressed={mobile} onClick={() => setMobile(true)} className="min-h-11 rounded-lg border border-black/10 px-4 text-xs">Mobile</button></div>
      <div ref={previewContainer} className="w-full">
        {layouts && preview ? <div className="relative mx-auto" style={{ width: frameWidth * previewScale, height: 800 * previewScale }}><iframe title="Homepage section layout preview" src={"/admin/layout-preview?" + new URLSearchParams({ ...layouts, section: preview }).toString()} className="absolute left-0 top-0 rounded-xl border border-black/10 bg-white" style={{ width: frameWidth, height: 800, transform: `scale(${previewScale})`, transformOrigin: "top left" }} /></div> : null}
      </div>
    </AdminDrawer>
  </section>;
}
