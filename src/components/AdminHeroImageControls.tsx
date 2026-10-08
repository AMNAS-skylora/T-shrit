"use client";

import { useEffect, useRef, useState } from "react";
import { ComfortHero } from "@/components/ComfortHero";
import { normalizeHeroImagePlacement, type HeroImagePlacement, type ImagePlacement } from "@/lib/hero-image-placement";
import type { StoreSettings } from "@/types/commerce";
import type { Product } from "@/types/product";

export function AdminHeroImageControls({ value, onChange, settings, products, disabled = false }: { value?: HeroImagePlacement; onChange: (value: HeroImagePlacement) => void; settings: StoreSettings; products: Product[]; disabled?: boolean }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [width, setWidth] = useState(500);
  const container = useRef<HTMLDivElement>(null);
  const placement = normalizeHeroImagePlacement(value);
  const frameWidth = device === "desktop" ? 1280 : 375;
  const scale = Math.min(1, width / frameWidth);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  function update(field: keyof ImagePlacement, next: number) {
    onChange(normalizeHeroImagePlacement({ ...placement, [device]: { ...placement[device], [field]: next } }));
  }
  return <fieldset disabled={disabled} className="mt-4 min-w-0 border-t border-black/10 pt-4 disabled:opacity-60">
    <legend className="px-1 text-xs font-semibold">Image size</legend>
    <p className="mt-2 text-xs leading-5 text-black/50">The image stays centered. Adjust its size for desktop and mobile, then save the hero to publish.</p>
    <div className="mt-3 flex gap-2">{(["desktop", "mobile"] as const).map((item) => <button type="button" key={item} aria-pressed={device === item} onClick={() => setDevice(item)} className={"min-h-11 rounded-lg px-4 text-xs font-semibold " + (device === item ? "bg-[#001cac] !text-white" : "border border-black/10")}>{item === "desktop" ? "Desktop" : "Mobile"}</button>)}</div>
    <div ref={container} className="mt-3 w-full overflow-hidden rounded-xl border border-black/10">
      <div className="relative mx-auto" style={{ width: frameWidth * scale, height: 580 * scale }}>
        <div className="absolute left-0 top-0" style={{ width: frameWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <div inert><ComfortHero settings={{ ...settings, homeDefaultHeroImagePlacement: placement }} products={products} preview /></div>
        </div>
      </div>
    </div>
    <div className="mt-4 grid gap-4">{([
      { key: "scale", label: "Image size", min: 40, max: 180 },
    ] as const).map(({ key, label, min, max }) => <label key={key} className="block text-xs font-semibold">
      <span className="flex justify-between gap-3"><span>{label}</span><span>{placement[device][key]}%</span></span>
      <input type="range" min={min} max={max} step="1" value={placement[device][key]} onChange={(event) => update(key, Number(event.target.value))} className="mt-2 min-h-11 w-full accent-[#001cac]" />
    </label>)}</div>
    <button type="button" onClick={() => onChange({ ...placement, [device]: { scale: 100 } })} className="mt-3 min-h-11 rounded-lg border border-black/10 px-4 text-xs font-semibold">Reset {device} image</button>
  </fieldset>;
}
