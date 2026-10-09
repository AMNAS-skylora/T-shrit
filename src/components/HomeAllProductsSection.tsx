import type { Product } from "@/types/product";
import { HomeProductGridCard } from "@/components/HomeProductGridCard";

export function HomeAllProductsSection({
  theme = "light",
  whatsappNumber,
  products = [],
  layout = "grid",
  title = "ALL PRODUCTS",
  eyebrow = "",
}: {
  theme?: "light" | "dark";
  whatsappNumber: string;
  products?: Product[];
  layout?: "grid" | "rail" | "editorial";
  title?: string;
  eyebrow?: string;
}) {
  return (
    <section
      id="all-products"
      className={"scroll-mt-20 px-3 py-14 sm:px-5 sm:py-18 lg:px-6 lg:py-20 " + (theme === "dark" ? "bg-black text-white" : "bg-[#fafafa] text-[#111]")}
      aria-label="All products"
    >
      <div className="mx-auto w-full max-w-[1600px]">
        {eyebrow ? <p className={"mb-3 text-xs uppercase tracking-widest " + (theme === "dark" ? "text-white/60" : "text-black/50")}>{eyebrow}</p> : null}
        <h2 className="m-0 text-[clamp(30px,4.6vw,56px)] font-semibold leading-none tracking-[-.05em]">
          {title}
        </h2>

        {!products.length ? <p className={"mt-8 text-sm " + (theme === "dark" ? "text-white/60" : "text-black/50")}>The collection is coming soon.</p> : null}
        <div className={layout === "rail" ? "mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5" : layout === "editorial" ? "mt-8 grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-9" : "mt-8 grid grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-3.5 sm:gap-y-9 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-11"}>
          {products.map((product) => (
            <div key={product.id} className={layout === "rail" ? "w-[75vw] max-w-[380px] shrink-0 snap-start sm:w-[38vw] lg:w-[24vw]" : "min-w-0"}>
            <HomeProductGridCard
              theme={theme}
              product={product}
              whatsappNumber={whatsappNumber}
            />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
