import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/UiIcons";
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
  const visibleProducts = products.slice(0, 6);

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
        <div aria-label="Homepage products" className={"mt-6 sm:mt-8 " + styles.grid + " " + styles.homeGrid}>
          {visibleProducts.map((product) => (
            <div key={product.id} className="h-full min-w-0">
              <HomeProductGridCard
                theme={theme}
                product={product}
                whatsappNumber={whatsappNumber}
              />
            </div>
          ))}
        </div>
        {products.length ? (
          <div className="mt-7 flex justify-center sm:mt-9">
            <Link
              href="/products"
              data-shop-transition
              className={"inline-flex min-h-11 max-w-full items-center justify-center gap-3 rounded-full border px-5 py-2.5 text-[12px] font-semibold tracking-[.01em] transition-[background-color,transform,box-shadow] duration-200 active:scale-[.97] sm:min-h-11 sm:px-6 sm:text-[13px] " + (theme === "dark" ? "border-white/30 text-white hover:bg-white/10" : "border-black/20 text-black hover:bg-black/[.04] hover:shadow-sm")}
            >
              <span>View all products</span>
              <ArrowUpRightIcon className="shrink-0" width={16} height={16} />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
