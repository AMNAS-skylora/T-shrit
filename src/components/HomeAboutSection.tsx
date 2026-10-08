import type { StoreSettings } from "@/types/commerce";
export function HomeAboutSection({ settings }: { settings: StoreSettings }) {
  const details = [
    ["Fabric", "Selected for feel"],
    ["GSM", "Balanced weight"],
    ["Fit", "Easy everyday cut"],
    ["Finish", "Clean construction"],
  ];

  return (
    <section id="about" className="scroll-mt-20 bg-[#001cac] px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-12 lg:py-28">
      <div className="mx-auto grid w-full max-w-[1280px] gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
        <div>
          <p className="m-0 text-[9px] font-semibold uppercase tracking-[.16em] text-white/55">
            {settings.homeBrandEyebrow}
          </p>

          <h2 className="mt-4 max-w-[430px] text-[clamp(38px,5vw,72px)] font-semibold leading-[.92] tracking-[-.055em]">
            {settings.homeBrandTitle}
          </h2>
        </div>

        <div className="flex flex-col justify-end">
          <p className="max-w-[620px] text-[14px] leading-7 text-white/72 sm:text-[15px]">
            {settings.aboutHeroBody}
          </p>

          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 pt-2 sm:grid-cols-4">
            {details.map(([label, value]) => (
              <div key={label}>
                <span className="block text-[8px] font-semibold uppercase tracking-[.12em] text-white/45">
                  {label}
                </span>
                <strong className="mt-2 block text-[11px] font-semibold text-white/88">
                  {value}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}