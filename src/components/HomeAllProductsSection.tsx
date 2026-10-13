import Link from "next/link";
import styles from "./HomeProductGrid.module.css";
import type { Product } from "@/types/product";
import { HomeProductGridCard } from "@/components/HomeProductGridCard";

export function HomeAllProductsSection({
  theme = "light",
  whatsappNumber,
  products = [],
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
      className={"scroll-mt-20 px-3 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20 " + (theme === "dark" ? "bg-black text-white" : "bg-[#fafafa] text-[#111]")}
      aria-label="All products"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        {eyebrow ? <p className={"mb-3 text-xs uppercase tracking-widest " + (theme === "dark" ? "text-white/60" : "text-black/50")}>{eyebrow}</p> : null}
        <h2 className="m-0 text-[clamp(28px,3vw,40px)] font-semibold leading-none tracking-[-.05em]">
          {title}
        </h2>

        {!products.length ? <p className={"mt-8 text-sm " + (theme === "dark" ? "text-white/60" : "text-black/50")}>The collection is coming soon.</p> : null}
        <div className={"mt-7 sm:mt-8 " + styles.grid}>
          {products.slice(0, 6).map((product) => (
            <div key={product.id} className="min-w-0 h-full">
              <HomeProductGridCard
                theme={theme}
                product={product}
                whatsappNumber={whatsappNumber}
              />
              </div>
          ))}
        </div>
        {products.length ? <div className="mt-8 flex justify-center"><Link href="/products" className={"inline-flex min-h-11 items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold " + (theme === "dark" ? "border-white/30 text-white" : "border-black/20 text-black")}>View all products <span className="ml-3" aria-hidden="true">↗</span></Link></div> : null}
      </div>
    </section>
  );
}
