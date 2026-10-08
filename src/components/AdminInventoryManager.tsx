"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useDeferredValue, useEffect, useMemo, useState } from "react";
import { AdminDrawer } from "@/components/AdminDrawer";
import type { Product } from "@/types/product";
import { getProductPrimaryImage } from "@/lib/product-images";
import type {
  InventoryMovement,
  InventoryStockAlert,
} from "@/types/admin";

type Summary = {
  totalProducts: number;
  totalUnits: number;
  lowStock: number;
  soldOut: number;
};

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export function AdminInventoryManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [alerts, setAlerts] = useState<InventoryStockAlert[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalProducts: 0,
    totalUnits: 0,
    lowStock: 0,
    soldOut: 0,
  });
  const [threshold, setThreshold] = useState(DEFAULT_LOW_STOCK_THRESHOLD);
  const [productId, setProductId] = useState("");
  const [delta, setDelta] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [reason, setReason] = useState("Manual adjustment");
  const [message, setMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search).trim().toLowerCase();
  const [stockFilter, setStockFilter] = useState("all");

  async function load(nextThreshold = threshold, signal?: AbortSignal) {
    const response = await fetch(
      "/api/admin/inventory?threshold=" + nextThreshold,
      { cache: "no-store", signal },
    );
    const data = await response.json();
    if (signal?.aborted) return;

    if (!response.ok) {
      throw new Error(data.error || "Could not load inventory.");
    }

    setProducts(data.products || []);
    setMovements(data.movements || []);
    setSummary(data.summary || { totalProducts: 0, totalUnits: 0, lowStock: 0, soldOut: 0 });
    setAlerts(data.alerts || []);
    setThreshold(
      Number.isFinite(Number(data.lowStockThreshold))
        ? Number(data.lowStockThreshold)
        : nextThreshold,
    );
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError("");
    void load(DEFAULT_LOW_STOCK_THRESHOLD, controller.signal)
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Could not load inventory."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("adjust") === "1") {
      setMessage("");
      setColor("");
      setSize("");
      setDelta("");
      setReason("Manual adjustment");
      setDrawerOpen(true);
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
    }
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [productId, products],
  );

  const selectedColors = useMemo(() => {
    if (!selectedProduct) return [];

    const variantNames = (selectedProduct.colorVariants ?? [])
      .map((variant) => variant.name)
      .filter(Boolean);

    return Array.from(
      new Set([...variantNames, ...(selectedProduct.colors ?? [])]),
    );
  }, [selectedProduct]);

  const selectedSizes = useMemo(
    () => selectedProduct?.sizes ?? [],
    [selectedProduct],
  );

  const lowAlerts = useMemo(
    () => alerts.filter((alert) => alert.status === "low"),
    [alerts],
  );

  const soldOutAlerts = useMemo(
    () => alerts.filter((alert) => alert.status === "sold-out"),
    [alerts],
  );

  function openAdjustment(alert?: InventoryStockAlert) {
    setMessage("");

    if (alert) {
      setProductId(alert.productId);
      setColor(alert.color || "");
      setSize(alert.size || "");
      setDelta("");
      setReason(
        alert.status === "sold-out"
          ? "Sold out restock"
          : "Low stock restock",
      );
    } else {
      setColor("");
      setSize("");
      setDelta("");
      setReason("Manual adjustment");
    }

    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (busy) return;
    setDrawerOpen(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!Number.isInteger(Number(delta)) || Number(delta) === 0) { setMessage("Enter a non-zero whole number for stock change."); return; }
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          delta: Number(delta),
          color,
          size,
          reason,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Stock update failed.");
      }

      setDelta("");
      setDrawerOpen(false);
      setMessage("Stock updated.");
      try { await load(); }
      catch { setMessage("Stock updated, but the inventory could not refresh. Reload the page to see the latest stock."); }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Stock update failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  const visibleProducts = products.filter((product) => {
    const matchesStock = stockFilter === "all" || (stockFilter === "sold-out" ? product.stock <= 0 : stockFilter === "low" ? product.stock > 0 && product.stock <= threshold : product.stock > threshold);
    return matchesStock && (!query || [product.name, product.sku, product.category].some((value) => value?.toLowerCase().includes(query)));
  });

  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[.16em] text-[#001cac]">
            STOCK CONTROL
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">
            Inventory
          </h1>
          <p className="mt-2 text-xs leading-5 text-black/45">
            Low stock alerts are calculated per product, colour and size.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAdjustment()}
          disabled={loading || !!loadError || !products.length}
          className="disabled:opacity-50 min-h-11 w-full rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white sm:w-auto"
        >
          Adjust stock
        </button>
      </div>

      {loading ? <div role="status" aria-label="Loading inventory" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((key) => <div key={key} className="h-72 animate-pulse rounded-2xl bg-black/5 motion-reduce:animate-none" />)}</div>
        : loadError ? <div role="alert" className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-red-100"><p className="text-sm text-red-600">{loadError}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 min-h-11 rounded-xl border border-black/10 px-4 text-xs font-semibold">Try again</button></div>
        : <>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
          <p className="text-[10px] font-semibold uppercase tracking-[.08em] text-black/40">
            Products
          </p>
          <strong className="mt-2 block text-2xl">{summary.totalProducts}</strong>
        </article>

        <article className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
          <p className="text-[10px] font-semibold uppercase tracking-[.08em] text-black/40">
            Stock units
          </p>
          <strong className="mt-2 block text-2xl">{summary.totalUnits}</strong>
        </article>

        <article
          className={
            "rounded-2xl p-4 ring-1 " +
            (lowAlerts.length
              ? "bg-amber-50 ring-amber-200"
              : "bg-white ring-black/5")
          }
        >
          <p
            className={
              "text-[10px] font-semibold uppercase tracking-[.08em] " +
              (lowAlerts.length ? "text-amber-700" : "text-black/40")
            }
          >
            Low stock alerts
          </p>
          <strong
            className={
              "mt-2 block text-2xl " +
              (lowAlerts.length ? "text-amber-800" : "")
            }
          >
            {lowAlerts.length}
          </strong>
        </article>

        <article
          className={
            "rounded-2xl p-4 ring-1 " +
            (soldOutAlerts.length
              ? "bg-red-50 ring-red-200"
              : "bg-white ring-black/5")
          }
        >
          <p
            className={
              "text-[10px] font-semibold uppercase tracking-[.08em] " +
              (soldOutAlerts.length ? "text-red-700" : "text-black/40")
            }
          >
            Sold out alerts
          </p>
          <strong
            className={
              "mt-2 block text-2xl " +
              (soldOutAlerts.length ? "text-red-700" : "")
            }
          >
            {soldOutAlerts.length}
          </strong>
        </article>
      </div>

      <section className="mt-5 rounded-[22px] bg-white p-4 ring-1 ring-black/[.06] md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#001cac]">
              Inventory overview
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-[-.025em]">
              Product stock
            </h2>
            <p className="mt-1 text-[10px] text-black/40">
              Product image, total stock and quick restock in one view.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openAdjustment()}
            disabled={!products.length}
            className="min-h-11 rounded-xl border border-black/10 bg-white px-4 text-[10px] font-bold transition hover:bg-black/[.025] disabled:opacity-50"
          >
            + Adjust stock
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
          <label className="min-w-0 text-xs font-semibold">Search products<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Product name, SKU or category" className="mt-2 min-h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-sm font-normal outline-none focus:border-[#001cac]" /></label>
          <label className="text-xs font-semibold">Stock status<select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-sm font-normal"><option value="all">All stock</option><option value="in-stock">In stock</option><option value="low">Low stock</option><option value="sold-out">Sold out</option></select></label>
        </div>
        <p aria-live="polite" className="mt-4 text-xs text-black/45">Showing {visibleProducts.length} of {products.length} products</p>
        {!visibleProducts.length ? <div className="py-10 text-center"><h3 className="text-sm font-semibold">{products.length ? "No matching products" : "No products yet"}</h3><p className="mt-2 text-xs text-black/50">{products.length ? "Try another search or stock filter." : "Add a product before adjusting stock."}</p>{products.length ? <button type="button" onClick={() => { setSearch(""); setStockFilter("all"); }} className="mt-3 min-h-11 px-4 text-xs font-semibold !text-[#001cac]">Clear filters</button> : <Link href="/admin/products" className="mt-3 inline-flex min-h-11 items-center px-4 text-xs font-semibold !text-[#001cac]">Go to products →</Link>}</div> : null}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visibleProducts.map((product) => {
            const image = getProductPrimaryImage(product);
            const isSoldOut = product.stock <= 0;
            const isLow = product.stock > 0 && product.stock <= threshold;

            return (
              <article
                key={product.id}
                className="min-w-0 overflow-hidden rounded-[20px] border border-black/[.07] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(0,0,0,.06)]"
              >
                <Link
                  href={"/admin/products/" + product.id}
                  className="relative block aspect-[4/3.3] overflow-hidden bg-[#f4f4f5]"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-black/25">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-black/[.04]">
                        ◻
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[.1em]">
                        No image
                      </span>
                    </div>
                  )}

                  <span
                    className={
                      "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase " +
                      (isSoldOut
                        ? "bg-red-50/95 text-red-700"
                        : isLow
                          ? "bg-amber-50/95 text-amber-700"
                          : "bg-white/90 text-emerald-700")
                    }
                  >
                    {isSoldOut ? "Sold out" : isLow ? "Low stock" : "In stock"}
                  </span>
                </Link>

                <div className="p-3.5">
                  <div className="min-w-0">
                    <Link
                      href={"/admin/products/" + product.id}
                      className="block break-words text-sm font-bold hover:text-[#001cac]"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 truncate text-[10px] uppercase tracking-[.06em] text-black/35">
                      {product.sku} · {product.category || "Uncategorized"}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-[#f7f7f8] p-2.5">
                      <span className="block text-[10px] font-bold uppercase tracking-[.08em] text-black/30">
                        Stock
                      </span>
                      <strong className="mt-1 block text-[15px] leading-none">
                        {product.stock}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-[#f7f7f8] p-2.5">
                      <span className="block text-[10px] font-bold uppercase tracking-[.08em] text-black/30">
                        Colours
                      </span>
                      <strong className="mt-1 block text-[15px] leading-none">
                        {product.colors.length}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-[#f7f7f8] p-2.5">
                      <span className="block text-[10px] font-bold uppercase tracking-[.08em] text-black/30">
                        Sizes
                      </span>
                      <strong className="mt-1 block text-[15px] leading-none">
                        {product.sizes.length}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMessage("");
                        setProductId(product.id);
                        setColor("");
                        setSize("");
                        setDelta("");
                        setReason(
                          product.stock <= 0
                            ? "Sold out restock"
                            : product.stock <= threshold
                              ? "Low stock restock"
                              : "Manual adjustment",
                        );
                        setDrawerOpen(true);
                      }}
                      className="min-h-11 rounded-xl bg-[#111] px-3 text-[10px] font-bold !text-white"
                    >
                      Adjust stock
                    </button>
                    <Link
                      href={"/admin/products/" + product.id}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/10 px-3 text-[10px] font-bold"
                    >
                      Product
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {alerts.length ? (
        <section className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          <div className="flex flex-col gap-3 border-b border-black/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                </span>
                <h2 className="text-sm font-bold">Low stock alerts</h2>
              </div>
              <p className="mt-1 text-[10px] text-black/45">
                Alert when a product, colour or size has {threshold} units or less.
              </p>
            </div>

            <span className="w-fit rounded-full bg-black/[.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-black/50">
              {alerts.length} need attention
            </span>
          </div>

          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {alerts.map((alert) => (
              <article
                key={alert.id}
                className={
                  "rounded-2xl border p-3 " +
                  (alert.status === "sold-out"
                    ? "border-red-200 bg-red-50/60"
                    : "border-amber-200 bg-amber-50/60")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={"/admin/products/" + alert.productId}
                      className="block break-words text-sm font-bold"
                    >
                      {alert.productName}
                    </Link>
                    <p className="mt-1 break-words text-[10px] text-black/45">
                      {alert.sku}
                      {[alert.color, alert.size].filter(Boolean).length
                        ? " · " +
                          [alert.color, alert.size].filter(Boolean).join(" / ")
                        : " · Base stock"}
                    </p>
                  </div>

                  <span
                    className={
                      "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase " +
                      (alert.status === "sold-out"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-800")
                    }
                  >
                    {alert.status === "sold-out"
                      ? "Sold out"
                      : alert.stock + " left"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openAdjustment(alert)}
                  className="mt-3 min-h-11 w-full rounded-xl bg-[#111] px-4 text-xs font-bold !text-white"
                >
                  Restock
                </button>
              </article>
            ))}
          </div>

        </section>
      ) : summary.totalProducts > 0 ? (
        <section className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm font-bold text-emerald-800">Stock looks healthy</p>
          <p className="mt-1 text-[10px] leading-5 text-emerald-700/70">
            No product, colour or size is at or below {threshold} units.
          </p>
        </section>
      ) : null}

      {message ? (
        <p role="status" className="mt-4 rounded-xl bg-white px-4 py-3 text-xs font-medium text-black/60 ring-1 ring-black/5">
          {message}
        </p>
      ) : null}

      <AdminDrawer
        open={drawerOpen}
        title="Adjust stock"
        description="Increase or decrease stock for a product, colour or exact size."
        onClose={closeDrawer}
      >
        <form
          onSubmit={submit}
          className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 md:grid-cols-2"
        >
          <fieldset disabled={busy} className="contents disabled:opacity-60">
          <label className="md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/45">
              Product
            </span>
            <select
              value={productId}
              onChange={(event) => {
                setProductId(event.target.value);
                setColor("");
                setSize("");
              }}
              required
              className="mt-1.5 min-h-11 w-full rounded-xl border border-black/10 px-3 text-sm"
            >
              <option value="">Choose product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — {product.stock}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/45">
              Colour
            </span>
            <select
              value={color}
              onChange={(event) => { setColor(event.target.value); setSize(""); }}
              disabled={!selectedColors.length}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-black/10 px-3 text-sm disabled:bg-black/[.03] disabled:text-black/35"
            >
              <option value="">
                {selectedColors.length ? "Base / no colour" : "No colour variants"}
              </option>
              {selectedColors.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/45">
              Size
            </span>
            <select
              value={size}
              onChange={(event) => setSize(event.target.value)}
              disabled={!selectedSizes.length || !color}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-black/10 px-3 text-sm disabled:bg-black/[.03] disabled:text-black/35"
            >
              <option value="">
                {selectedSizes.length ? "Colour total / no size" : "No sizes"}
              </option>
              {selectedSizes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/45">
              Stock change
            </span>
            <input
              type="number"
              step="1"
              value={delta}
              onChange={(event) => setDelta(event.target.value)}
              placeholder="+10 or -2"
              required
              className="mt-1.5 min-h-11 w-full rounded-xl border border-black/10 px-3 text-sm"
            />
          </label>

          <label>
            <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/45">
              Reason
            </span>
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-black/10 px-3 text-sm"
            />
          </label>

          </fieldset>
          <p className="text-xs leading-5 text-black/45 md:col-span-2">Use a positive number to add stock or a negative number to remove stock.</p>
          <button
            disabled={busy || !productId || !delta || Number(delta) === 0}
            className="min-h-11 rounded-xl bg-[#001cac] px-4 py-2.5 text-xs font-bold !text-white disabled:opacity-50 md:col-span-2"
          >
            {busy ? "Updating…" : "Update stock"}
          </button>

          {message ? (
            <p className="text-xs font-medium text-black/55 md:col-span-2">
              {message}
            </p>
          ) : null}
        </form>
      </AdminDrawer>

      <section className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Recent stock movements</h2>
            <p className="mt-1 text-[10px] text-black/40">
              Latest manual and order-related inventory changes.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {movements.map((movement) => <article key={movement.id} className="min-w-0 rounded-xl border border-black/10 p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={"/admin/products/" + movement.productId} className="break-words text-sm font-semibold !text-[#001cac] hover:underline">{movement.productName}</Link><p className="mt-1 break-words text-xs text-black/50">{[movement.color, movement.size].filter(Boolean).join(" / ") || "Base stock"}</p></div><span className={"shrink-0 rounded-full px-3 py-1 text-xs font-semibold " + (movement.delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600")}>{movement.delta > 0 ? "+" : ""}{movement.delta}</span></div>
            <p className="mt-3 break-words text-xs leading-5">{movement.reason}</p>{movement.reference ? <p className="mt-1 break-all text-xs text-black/45">Reference: {movement.reference}</p> : null}<p className="mt-3 text-[10px] text-black/45">{new Date(movement.createdAt).toLocaleString("en-IN")}</p>
          </article>)}
          {!movements.length ? <p className="py-8 text-center text-xs text-black/45 lg:col-span-2">No stock movements yet.</p> : null}
        </div>
      </section>
      </>}
    </div>
  );
}
