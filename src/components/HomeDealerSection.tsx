import type { StoreSettings } from "@/types/commerce";
import Link from "next/link";

export function HomeDealerSection({ settings }: { settings: StoreSettings }) {
  return (
    <section
      className="bg-[#111] px-4 py-20 text-white sm:px-7 sm:py-24 lg:px-10 lg:py-28"
      aria-label="Dealership"
    >
      <div className="mx-auto grid w-full max-w-[1440px] gap-12 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:gap-20">
        <div>
          <p className="m-0 text-[9px] font-semibold uppercase tracking-[.16em] text-white/45">
            {settings.homeDealersEyebrow}
          </p>

          <h2 className="mt-5 max-w-[820px] text-[clamp(44px,7vw,104px)] font-semibold leading-[.86] tracking-[-.065em]">
            {settings.homeDealersTitle}
          </h2>
        </div>

        <div className="max-w-[500px] lg:justify-self-end">
          <p className="m-0 text-[14px] leading-7 text-white/62 sm:text-[15px]">
            {settings.homeDealersBody}
          </p>

          <Link
            href="/wholesale"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-[9px] font-semibold uppercase tracking-[.1em] !text-black transition hover:opacity-90"
            style={{ color: "#000" }}
          >
            {settings.homeDealersButtonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
