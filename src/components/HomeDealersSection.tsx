import Link from "next/link";
import { DealerProductCatalog } from "@/components/DealerProductCatalog";
import { getDealerProducts } from "@/lib/dealer-products";
import type { Product } from "@/types/product";

export function HomeDealersSection({ products, whatsappNumber }: { products: Product[]; whatsappNumber: string }) {
  const dealers = getDealerProducts(products);
  if (!dealers.length) return null;
  return <section id="dealers" aria-labelledby="home-dealers-title" className="bg-[#fafafa] px-5 py-12 text-[#111] sm:px-8 sm:py-16">
    <div className="mx-auto w-full max-w-[1440px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/50">DEALERS</p><h2 id="home-dealers-title" className="mt-3 text-2xl font-semibold sm:text-3xl">Stock KLEID.IN.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-black/60">Dealer prices, minimum quantities and current availability for retailers and resellers.</p></div>
        <Link href="/wholesale" className="inline-flex min-h-11 items-center text-xs font-semibold">View dealer catalog ↗</Link>
      </div>
      <DealerProductCatalog products={dealers} whatsappNumber={whatsappNumber} />
    </div>
  </section>;
}
