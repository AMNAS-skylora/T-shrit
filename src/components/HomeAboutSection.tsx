import Link from "next/link";
import { homeAbout } from "@/data/home-about";

export function HomeAboutSection() {
  return <section id="about" aria-labelledby="home-about-title" className="scroll-mt-20 bg-[#111] px-5 py-14 text-white sm:px-8 sm:py-20 lg:px-12">
    <div className="mx-auto grid max-w-[1280px] items-center gap-9 lg:grid-cols-2 lg:gap-16">
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
        {homeAbout.images.map((image, index) => <div key={image.url} className={`${index === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"} overflow-hidden rounded-2xl bg-white/5`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>)}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[.15em] text-white/60">{homeAbout.eyebrow}</p>
        <h2 id="home-about-title" className="mt-4 whitespace-pre-line break-words text-[clamp(32px,5vw,64px)] font-semibold leading-[1.05] tracking-[-.04em]">{homeAbout.title}</h2>
        <p className="mt-6 text-sm leading-7 text-white/75 sm:text-base">{homeAbout.body}</p>
        <ul className="mt-8 grid gap-5 border-t border-white/15 pt-6">
          {homeAbout.points.map(point => <li key={point.title}><h3 className="text-sm font-semibold">{point.title}</h3><p className="mt-1 text-sm leading-6 text-white/60">{point.copy}</p></li>)}
        </ul>
        <Link href="/products" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold !text-black">Explore our T-shirts ↗</Link>
      </div>
    </div>
  </section>;
}
