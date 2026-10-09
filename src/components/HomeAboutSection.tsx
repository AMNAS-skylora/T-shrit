import type { StoreSettings } from "@/types/commerce";

export function HomeAboutSection({ settings }: { settings: StoreSettings }) {
  const images = settings.homeAboutImages.filter(Boolean);
  const points = settings.homeAboutQualityPoints.filter(Boolean);
  if (!settings.homeAboutEnabled || !(settings.homeAboutTitle || settings.homeAboutBody || images.length || points.length)) return null;

  return <section id="about" aria-label="About our T-shirts" className="scroll-mt-20 bg-[#111] px-5 py-14 text-white sm:px-8 sm:py-20 lg:px-12">
    <div className="mx-auto grid max-w-[1280px] items-center gap-9 lg:grid-cols-2 lg:gap-16">
      {images.length ? <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
        {images.map((url, index) => <div key={`${url}-${index}`} className={`${index === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"} overflow-hidden rounded-2xl bg-white/5`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`${settings.homeAboutTitle || "T-shirt"} — detail ${index + 1}`} loading="lazy" decoding="async" className="h-full w-full object-contain" />
        </div>)}
      </div> : null}
      <div className={`min-w-0 ${images.length ? "" : "lg:col-span-2 lg:max-w-3xl"}`}>
        {settings.homeAboutEyebrow ? <p className="text-xs font-semibold uppercase tracking-[.15em] text-white/60">{settings.homeAboutEyebrow}</p> : null}
        {settings.homeAboutTitle ? <h2 className="mt-4 whitespace-pre-line break-words text-[clamp(32px,5vw,64px)] font-semibold leading-[1.05] tracking-[-.04em]">{settings.homeAboutTitle}</h2> : null}
        {settings.homeAboutBody ? <p className="mt-6 whitespace-pre-line break-words text-sm leading-7 text-white/75 sm:text-base">{settings.homeAboutBody}</p> : null}
        {points.length ? <ul className="mt-8 grid gap-4 border-t border-white/15 pt-6 sm:grid-cols-2">
          {points.map((point, index) => <li key={index} className="flex min-w-0 gap-3 text-sm leading-6"><span aria-hidden="true" className="text-white/50">✓</span><span className="break-words">{point}</span></li>)}
        </ul> : null}
      </div>
    </div>
  </section>;
}
