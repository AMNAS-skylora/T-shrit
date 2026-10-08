import type { Product } from "@/types/product";
import { HomeProductGridCard } from "@/components/HomeProductGridCard";
import { homeDemoProducts } from "@/lib/home-demo-products";

export function HomeAllProductsSection({
  whatsappNumber,
  products = [],
  demo = true,
  title = "ALL PRODUCTS",
  eyebrow = "",
}: {
  whatsappNumber: string;
  products?: Product[];
  demo?: boolean;
  title?: string;
  eyebrow?: string;
}) {
  return (
    <section
      id="all-products"
      className="scroll-mt-20 bg-white px-3 py-14 text-[#111] sm:px-5 sm:py-18 lg:px-6 lg:py-20"
      aria-label="All products"
    >
      <div className="mx-auto w-full max-w-[1600px]">
        {eyebrow ? <p className="mb-3 text-xs uppercase tracking-widest text-black/50">{eyebrow}</p> : null}
        <h2 className="m-0 text-[clamp(30px,4.6vw,56px)] font-semibold leading-none tracking-[-.05em]">
          {title}
        </h2>

        {!products.length && !demo ? <p className="mt-8 text-sm text-black/50">The collection is coming soon.</p> : null}
        <div className="mt-8 grid grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-3.5 sm:gap-y-9 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-11">
          {(products.length ? products : demo ? homeDemoProducts : []).map((product) => (
            <HomeProductGridCard
              key={product.id}
              product={product}
              whatsappNumber={whatsappNumber}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
