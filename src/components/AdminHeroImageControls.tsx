"use client";

import { useEffect, useRef, useState } from "react";
import { BackgroundHero } from "@/components/BackgroundHero";
import { SecondaryHero } from "@/components/SecondaryHero";
import type { HeroSection } from "@/data/hero-slides";
import { ComfortHero } from "@/components/ComfortHero";
import { normalizeHeroImagePlacement, normalizeHeroImageOpacity, type HeroImagePlacement, type ImagePlacement } from "@/lib/hero-image-placement";
import type { StoreSettings } from "@/types/commerce";
import type { Product } from "@/types/product";

export function AdminHeroImageControls({ value, onChange, settings, products, disabled = false, section = "primary", subtitle = "", tickerText = "", imageOpacity = 40, onOpacityChange, secondaryButton = "", secondaryHref = "" }: { value?: HeroImagePlacement; onChange: (value: HeroImagePlacement) => void; settings: StoreSettings; products: Product[]; disabled?: boolean; section?: HeroSection; subtitle?: string; tickerText?: string; imageOpacity?: number; onOpacityChange?: (value: number) => void; secondaryButton?: string; secondaryHref?: string }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [width, setWidth] = useState(500);
  const [frameHeight, setFrameHeight] = useState(580);
  const previewFrame = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const placement = normalizeHeroImagePlacement(value);
  const opacity = normalizeHeroImageOpacity(imageOpacity);
  const previewSlide = { id: "preview", title: settings.homeDefaultHeroTitle, subtitle, tickerText, imageOpacity: opacity, secondaryButton, secondaryHref, imageUrl: settings.homeDefaultHeroImageUrl, imagePosition: "center" as const, imagePlacement: placement, button: settings.homeDefaultHeroButtonLabel || "Shop collection", href: settings.homeDefaultHeroButtonHref || "/products", product: products.find((product) => product.status === "active") };
  const frameWidth = device === "desktop" ? 1280 : 375;
  const scale = Math.min(1, width / frameWidth);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(container.current);
    const heightObserver = new ResizeObserver(([entry]) => setFrameHeight(entry.contentRect.height));
    if (previewFrame.current) heightObserver.observe(previewFrame.current);
    return () => { observer.disconnect(); heightObserver.disconnect(); };
  }, []);
  function update(field: keyof ImagePlacement, next: number) {
    onChange(normalizeHeroImagePlacement({ ...placement, [device]: { ...placement[device], [field]: next } }));
  }
  return <fieldset disabled={disabled} className="mt-4 min-w-0 border-t border-black/10 pt-4 disabled:opacity-60">
    <legend className="px-1 text-xs font-semibold">Image size</legend>
    <p className="mt-2 text-xs leading-5 text-black/50">The image stays centered. Adjust its size for desktop and mobile, then save the hero to publish.</p>
    <div className="mt-3 flex gap-2">{(["desktop", "mobile"] as const).map((item) => <button type="button" key={item} aria-pressed={device === item} onClick={() => setDevice(item)} className={"min-h-11 rounded-lg px-4 text-xs font-semibold " + (device === item ? "bg-[#001cac] !text-white" : "border border-black/10")}>{item === "desktop" ? "Desktop" : "Mobile"}</button>)}</div>
    <div ref={container} className="mt-3 w-full overflow-hidden rounded-xl border border-black/10">
      <div className="relative mx-auto" style={{ width: frameWidth * scale, height: frameHeight * scale }}>
        <div ref={previewFrame} className="absolute left-0 top-0" style={{ width: frameWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <div inert>{section === "tertiary" ? <BackgroundHero slide={previewSlide} preview /> : section === "secondary" ? <SecondaryHero slide={previewSlide} preview /> : <ComfortHero settings={{ ...settings, homeDefaultHeroImagePlacement: placement }} products={products} preview />}</div>
        </div>
      </div>
    </div>
    <div className="mt-4 grid gap-4">{([
      { key: "scale", label: "Image size", min: 40, max: 180 },
    ] as const).map(({ key, label, min, max }) => <label key={key} className="block text-xs font-semibold">
      <span className="flex justify-between gap-3"><span>{label}</span><span>{placement[device][key]}%</span></span>
      <input type="range" min={min} max={max} step="1" value={placement[device][key]} onChange={(event) => update(key, Number(event.target.value))} className="mt-2 min-h-11 w-full accent-[#001cac]" />
    </label>)}</div>
    {section === "tertiary" && onOpacityChange ? <label className="mt-4 block text-xs font-semibold"><span className="flex justify-between gap-3"><span>Background image opacity</span><span>{opacity}%</span></span><input type="range" min="0" max="100" step="1" value={opacity} onChange={(event) => onOpacityChange(Number(event.target.value))} className="mt-2 min-h-11 w-full accent-[#001cac]" /><span className="block text-xs font-normal text-black/50">Lower values dim the image; text and buttons stay fully visible.</span></label> : null}
    <button type="button" onClick={() => onChange({ ...placement, [device]: { scale: 100 } })} className="mt-3 min-h-11 rounded-lg border border-black/10 px-4 text-xs font-semibold">Reset {device} image</button>
  </fieldset>;
}
