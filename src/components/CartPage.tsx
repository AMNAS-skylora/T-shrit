"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import { getProductOfferPrice } from "@/lib/product-offers";
import { getProductPrimaryImage } from "@/lib/product-images";
import type { Product } from "@/types/product";

type CartRow = {
  item: ReturnType<typeof useCart>["items"][number];
  product?: Product;
  available: boolean;
  stock: number;
  price: number;
};

function availableStock(product: Product, color: string, size: string): number {
  if (product.status !== "active") return 0;
  if (product.sizes.length && !product.sizes.includes(size)) return 0;
  const variants = product.colorVariants ?? [];
  if (variants.length) {
    const variant = variants.find((entry) => entry.name === color);
    if (!variant) return 0;
    const stocks = variant.sizeStocks ?? {};
    if (Object.keys(stocks).length) return Math.max(0, Number(stocks[size] ?? 0));
    return Math.max(0, Number(variant.stock ?? 0));
  }
  if (product.colors.length && !product.colors.includes(color)) return 0;
  return Math.max(0, product.stock);
}

export function CartPage({ products, whatsappNumber }: { products: Product[]; whatsappNumber: string }) {
  const { items, ready, count, setQuantity, removeItem, clearCart } = useCart();
  const productMap = new Map(products.map((product) => [product.id, product]));
  const rows: CartRow[] = items.map((item) => {
    const product = productMap.get(item.productId);
    const stock = product ? availableStock(product, item.color, item.size) : 0;
    return {
      item,
      product,
      available: Boolean(product && stock >= item.quantity),
      stock,
      price: product ? getProductOfferPrice(product) : 0,
    };
  });
  const subtotal = rows.reduce((sum, row) => sum + row.price * row.item.quantity, 0);
  const canOrder = rows.length > 0 && rows.every((row) => row.available) && Boolean(whatsappNumber.replace(/\D/g, ""));
  const message = [
    "Hi KLEID.IN, I'd like to order the following items:",
    "",
    ...rows.flatMap((row, index) => [
      String(index + 1) + ". " + (row.product?.name ?? "Unavailable product"),
      "Colour: " + (row.item.color || "Default") + " | Size: " + (row.item.size || "One size"),
      "Qty: " + row.item.quantity + " x " + formatPrice(row.price) + " = " + formatPrice(row.price * row.item.quantity),
      row.product ? "Product: /products/" + row.product.slug : "",
      "",
    ]),
    "Estimated item subtotal: " + formatPrice(subtotal),
    "Please confirm final pricing, delivery charges, availability and payment details.",
  ].filter((line) => line !== undefined).join("\n");
  const checkoutUrl = canOrder
    ? "https://wa.me/" + whatsappNumber.replace(/\D/g, "") + "?text=" + encodeURIComponent(message)
    : "#";

  return (
    <section className="mx-auto min-h-[65vh] max-w-6xl px-4 pb-24 pt-12 sm:px-8 sm:pt-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.22em] text-black/50">KLEID.IN / SHOPPING</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your bag</h1>
          <p className="mt-2 text-sm text-black/60" aria-live="polite">
            {ready ? count + " item" + (count === 1 ? "" : "s") : "Loading your bag..."}
          </p>
        </div>
        <Link href="/products" className="text-sm font-semibold underline underline-offset-4">Continue shopping</Link>
      </div>

      {ready && rows.length === 0 ? (
        <div className="rounded-3xl border border-black/10 bg-white px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold">Your bag is empty</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/60">Explore the collection and add your favourite pieces to your bag.</p>
          <Link href="/products" className="mt-7 inline-block rounded-full bg-black px-7 py-3 text-sm font-semibold text-white">Shop the collection</Link>
        </div>
      ) : null}

      {ready && rows.length ? (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {rows.map((row) => {
              const { item, product } = row;
              const image = product ? getProductPrimaryImage(product) : undefined;
              return (
                <article key={[item.productId, item.color, item.size].join("|")} className="flex gap-4 rounded-2xl border border-black/10 bg-white p-4 sm:gap-6">
                  <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-[#f0f0f0] sm:h-40 sm:w-32">
                    {image ? <Image src={image} alt={product?.name ?? "Product"} fill sizes="128px" className="object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    {product ? (
                      <Link href={"/products/" + product.slug} className="text-base font-semibold hover:underline">{product.name}</Link>
                    ) : <h2 className="font-semibold">Product no longer available</h2>}
                    <p className="mt-1 text-xs text-black/60">Colour: {item.color || "Default"} · Size: {item.size || "One size"}</p>
                    <p className="mt-2 text-sm font-semibold">{product ? formatPrice(row.price) : "Unavailable"}</p>
                    {!row.available ? (
                      <p role="status" className="mt-1 text-xs font-semibold text-red-700">
                        {row.stock === 0 ? "Currently unavailable. Remove this item to continue." : "Only " + row.stock + " available. Reduce the quantity."}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="flex items-center rounded-full border border-black/15">
                        <button type="button" className="h-9 w-9 text-lg" aria-label={"Decrease quantity of " + (product?.name ?? "product")} onClick={() => setQuantity(item, item.quantity - 1)}>−</button>
                        <span className="min-w-6 text-center text-sm font-semibold" aria-label={"Quantity " + item.quantity}>{item.quantity}</span>
                        <button type="button" className="h-9 w-9 text-lg disabled:opacity-30" aria-label={"Increase quantity of " + (product?.name ?? "product")} disabled={item.quantity >= 20 || item.quantity >= row.stock} onClick={() => setQuantity(item, item.quantity + 1)}>+</button>
                      </div>
                      <button type="button" onClick={() => removeItem(item)} className="text-xs font-semibold text-black/60 underline underline-offset-4 hover:text-black">Remove</button>
                    </div>
                  </div>
                </article>
              );
            })}
            <button type="button" onClick={clearCart} className="text-xs font-semibold text-black/60 underline underline-offset-4">Clear bag</button>
          </div>

          <aside className="rounded-2xl border border-black/10 bg-white p-6 lg:sticky lg:top-24">
            <h2 className="text-xl font-semibold">Order summary</h2>
            <div className="mt-6 flex justify-between border-b border-black/10 pb-4 text-sm">
              <span>Items ({count})</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <div className="mt-4 flex justify-between text-sm"><span>Delivery</span><span>To be confirmed</span></div>
            <div className="mt-5 flex justify-between border-t border-black/10 pt-4 text-base font-semibold">
              <span>Estimated subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-black/60">Checkout opens WhatsApp with your selected items. This does not place or pay for an order automatically. The team will confirm stock, delivery and final price.</p>
            {canOrder ? (
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="mt-6 block rounded-full bg-black px-5 py-3.5 text-center text-sm font-semibold text-white hover:bg-black/80">
                Enquire & checkout on WhatsApp
              </a>
            ) : (
              <button type="button" disabled className="mt-6 block w-full rounded-full bg-black/20 px-5 py-3.5 text-center text-sm font-semibold text-black/50">
                {whatsappNumber.replace(/\D/g, "") ? "Review unavailable items" : "WhatsApp not configured"}
              </button>
            )}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
