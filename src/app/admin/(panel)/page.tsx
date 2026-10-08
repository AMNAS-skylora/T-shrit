import Link from "next/link";
import { getDashboardMetrics } from "@/lib/dashboard";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const quickActions = [
  {
    href: "/admin/products?new=1",
    label: "Add product",
    short: "+",
    description: "New catalog item",
  },
  {
    href: "/admin/orders?new=1",
    label: "New order",
    short: "O",
    description: "Manual order",
  },
  {
    href: "/admin/inventory?adjust=1",
    label: "Update stock",
    short: "I",
    description: "Inventory adjust",
  },
  {
    href: "/admin/orders",
    label: "Payments",
    short: "₹",
    description: "Collect & review",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    short: "C",
    description: "Customer list",
  },
  {
    href: "/admin/homepage",
    label: "Homepage",
    short: "H",
    description: "Store content",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    short: "S",
    description: "Store config",
  },
];

function ActionIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    "+": "M12 5v14M5 12h14", O: "M7 3h10v4H7zM5 5H3v16h18V5h-2M7 12h10M7 16h7",
    I: "m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10", "₹": "M6 4h12M6 8h12M7 4c8 0 8 8 0 8l9 8",
    C: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-4M16 3a4 4 0 0 1 0 8",
    H: "m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8", S: "M4 7h16M4 17h16M8 4v6M16 14v6",
  };
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

function statusClass(status: string) {
  if (status === "delivered" || status === "paid") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }
  if (status === "cancelled" || status === "failed" || status === "refunded") {
    return "bg-red-50 text-red-700 ring-red-100";
  }
  if (status === "new" || status === "pending") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }
  return "bg-black/[.035] text-black/55 ring-black/5";
}

function MetricCard({
  label,
  value,
  help,
  tone = "default",
}: {
  label: string;
  value: string | number;
  help: string;
  tone?: "default" | "blue" | "amber" | "dark";
}) {
  const shell =
    tone === "blue"
      ? "bg-[#001cac] text-white ring-[#001cac]"
      : tone === "amber"
        ? "bg-amber-50 text-[#111] ring-amber-200"
        : tone === "dark"
          ? "bg-[#111318] text-white ring-black"
          : "bg-white text-[#111] ring-black/[.06]";

  const muted =
    tone === "blue" || tone === "dark" ? "text-white/75" : "text-black/55";

  const labelColor =
    tone === "blue"
      ? "text-white/80"
      : tone === "dark"
        ? "text-white/75"
        : tone === "amber"
          ? "text-amber-700"
          : "text-black/55";

  return (
    <article
      className={
        "relative min-w-0 min-h-[132px] overflow-hidden rounded-[22px] p-4 ring-1 sm:p-5 " +
        shell
      }
    >
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-center justify-between gap-3">
          <p
            className={
              "text-[10px] font-bold uppercase tracking-[.12em] " + labelColor
            }
          >
            {label}
          </p>
          <span
            className={
              "h-1.5 w-1.5 rounded-full " +
              (tone === "amber"
                ? "bg-amber-500"
                : tone === "blue"
                  ? "bg-white/55"
                  : tone === "dark"
                    ? "bg-[#6f86ff]"
                    : "bg-[#001cac]")
            }
          />
        </div>

        <div>
          <strong className="block break-words text-[22px] font-bold leading-none tracking-[-.05em] sm:text-[28px]">
            {value}
          </strong>
          <span className={"mt-2 block text-[10px] leading-4 " + muted}>
            {help}
          </span>
        </div>
      </div>
    </article>
  );
}

export default async function AdminDashboardPage() {
  let metrics: Awaited<ReturnType<typeof getDashboardMetrics>>;
  try { metrics = await getDashboardMetrics(); }
  catch {
    return <div className="min-w-0"><p className="text-[10px] font-bold tracking-[.16em] text-[#001cac]">CONTROL CENTER</p><h1 className="mt-2 text-3xl font-bold">Dashboard</h1><div role="alert" className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-black/5"><h2 className="text-base font-semibold">Could not load dashboard</h2><p className="mt-2 text-sm leading-6 text-black/50">Store data is temporarily unavailable. Try loading the dashboard again.</p><a href="/admin" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#001cac] px-5 text-xs font-semibold !text-white">Retry dashboard</a></div><nav aria-label="Store management" className="mt-4 grid gap-3 sm:grid-cols-3">{[["/admin/products", "Products"], ["/admin/orders", "Orders"], ["/admin/inventory", "Inventory"]].map(([href, label]) => <Link key={href} href={href} className="flex min-h-11 items-center justify-between rounded-xl bg-white px-4 text-sm font-semibold ring-1 ring-black/5">{label}<span aria-hidden="true">→</span></Link>)}</nav></div>;
  }
  const maxDailyRevenue = Math.max(
    1,
    ...metrics.salesSeries.map((item) => item.revenue),
  );

  const hasSales = metrics.salesSeries.some((item) => item.revenue > 0);
  const missingCostProducts = Math.max(
    0,
    metrics.totalProducts - metrics.costConfiguredProducts,
  );

  const operationCards = [
    {
      label: "Products",
      value: metrics.totalProducts,
      meta: `${metrics.activeProducts} active`,
      href: "/admin/products",
    },
    {
      label: "Customers",
      value: metrics.totalCustomers,
      meta: "Customer records",
      href: "/admin/customers",
    },
    {
      label: "Orders",
      value: metrics.totalOrders,
      meta: `${metrics.deliveredOrders} delivered`,
      href: "/admin/orders",
    },
    {
      label: "Stock units",
      value: metrics.totalStockUnits,
      meta: `${metrics.lowStockProducts} low stock`,
      href: "/admin/inventory",
    },
    {
      label: "Draft products",
      value: metrics.draftProducts,
      meta: "Not live",
      href: "/admin/products",
    },
    {
      label: "Featured",
      value: metrics.featuredProducts,
      meta: "Homepage",
      href: "/admin/products",
    },
    {
      label: "Sold out",
      value: metrics.soldOutProducts,
      meta: "Need restock",
      href: "/admin/inventory",
    },
    {
      label: "Pending orders",
      value: metrics.pendingOrders,
      meta: "In fulfilment",
      href: "/admin/orders",
    },
  ];

  const attentionItems = [
    {
      label: "New orders",
      value: metrics.newOrders,
      note: "Confirm customer orders",
      href: "/admin/orders",
      active: metrics.newOrders > 0,
    },
    {
      label: "Pending payments",
      value: formatPrice(metrics.pendingPayments),
      note: "Amount still to collect",
      href: "/admin/orders",
      active: metrics.pendingPayments > 0,
    },
    {
      label: "Low stock",
      value: metrics.lowStockProducts,
      note: "Products need stock review",
      href: "/admin/inventory",
      active: metrics.lowStockProducts > 0,
    },
    {
      label: "Cost missing",
      value: missingCostProducts,
      note: "Add cost for accurate profit",
      href: "/admin/products",
      active: missingCostProducts > 0,
    },
  ];

  return (
    <div className="min-w-0 pb-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#001cac]" />
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#001cac]">
              Control center
            </p>
          </div>
          <h1 className="mt-2 text-[34px] font-bold leading-none tracking-[-.055em] md:text-[42px]">
            Dashboard
          </h1>
          <p className="mt-2.5 max-w-xl text-[11px] leading-5 text-black/55">
            Sales, payments, products, inventory and fulfilment at a glance.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-black/[.06]">
            <span className="block text-[10px] font-bold uppercase tracking-[.1em] text-black/50">
              Cost setup
            </span>
            <strong className="mt-0.5 block text-[11px]">
              {metrics.costConfiguredProducts}/{metrics.totalProducts} products
            </strong>
          </div>
          <div className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-black/[.06]">
            <span className="block text-[10px] font-bold uppercase tracking-[.1em] text-black/50">
              Delivered
            </span>
            <strong className="mt-0.5 block text-[11px]">
              {metrics.deliveredOrders} orders
            </strong>
          </div>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          label="Total sales"
          value={formatPrice(metrics.revenue)}
          help="All non-cancelled order value"
          tone="blue"
        />
        <MetricCard
          label="Gross profit"
          value={
            metrics.grossProfit === null
              ? "Set costs"
              : formatPrice(metrics.grossProfit)
          }
          help={
            metrics.grossProfit === null
              ? "Add cost price to products"
              : "Sales minus product cost"
          }
          tone={metrics.grossProfit === null ? "amber" : "dark"}
        />
        <MetricCard
          label="Paid"
          value={formatPrice(metrics.paidRevenue)}
          help="Payment received"
        />
        <MetricCard
          label="Pending payment"
          value={formatPrice(metrics.pendingPayments)}
          help="Amount still to collect"
          tone={metrics.pendingPayments > 0 ? "amber" : "default"}
        />
      </section>

      <section aria-label="Quick actions" className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <h2 className="text-sm font-semibold">Quick actions</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {quickActions.map((action) => <Link key={action.label} href={action.href} className="group min-w-0 rounded-xl border border-black/5 bg-[#fafafa] p-3 transition hover:border-[#001cac]/20 hover:bg-[#eef2ff]">
            <div className="flex items-center justify-between gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef2ff] text-[#001cac]"><ActionIcon name={action.short} /></span><span aria-hidden="true" className="text-xs text-black/50">↗</span></div><strong className="mt-3 block break-words text-xs font-semibold">{action.label}</strong><span className="mt-1 block text-[10px] leading-5 text-black/50">{action.description}</span>
          </Link>)}
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,.75fr)]">
        <section className="overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[.06]">
          <div className="flex flex-col gap-3 border-b border-black/[.055] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#001cac]">
                Last 7 days
              </p>
              <h2 className="mt-1 text-[17px] font-bold tracking-[-.03em]">
                Sales performance
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="block text-[10px] uppercase tracking-[.08em] text-black/50">
                  Today
                </span>
                <strong className="mt-0.5 block text-[12px]">
                  {formatPrice(metrics.todayRevenue)}
                </strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-[.08em] text-black/50">
                  Orders
                </span>
                <strong className="mt-0.5 block text-[12px]">
                  {metrics.todayOrders}
                </strong>
              </div>
            </div>
          </div>

          <div className="relative p-4 sm:p-5">
            {!hasSales ? (
              <div className="absolute inset-x-5 top-1/2 z-10 -translate-y-1/2 text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#001cac]/[.06] text-sm font-bold text-[#001cac]">
                  ↗
                </div>
                <p className="mt-2 text-[11px] font-semibold">
                  No sales in the last 7 days
                </p>
                <p className="mt-1 text-[10px] text-black/50">
                  The graph will update automatically after orders are created.
                </p>
              </div>
            ) : null}

            <div
              className={
                "grid h-[205px] grid-cols-7 items-end gap-2 sm:gap-3 " +
                (!hasSales ? "opacity-25" : "")
              }
            >
              {metrics.salesSeries.map((item) => {
                const height =
                  item.revenue > 0
                    ? (item.revenue / maxDailyRevenue) * 100
                    : 0;

                return (
                  <div
                    key={item.key}
                    className="flex h-full min-w-0 flex-col justify-end"
                  >
                    <div className="mb-2 hidden text-center sm:block">
                      <span className="text-[10px] font-semibold text-black/50">
                        {item.revenue ? formatPrice(item.revenue) : "—"}
                      </span>
                    </div>
                    <div className="relative flex h-[138px] items-end overflow-hidden rounded-[10px] bg-[#f6f7f9]">
                      <div
                        className="w-full rounded-t-[8px] bg-[#001cac] transition-[height]"
                        style={{ height: `${height}%` }}
                        role="img"
                        aria-label={`${item.label}: ${formatPrice(item.revenue)} · ${item.orders} orders`}
                        title={`${item.label}: ${formatPrice(item.revenue)} · ${item.orders} orders`}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <strong className="block text-[10px]">{item.label}</strong>
                      <span className="mt-0.5 block text-[10px] text-black/50">
                        {item.orders} ord
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[.06]">
          <div className="border-b border-black/[.055] p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#001cac]">
              Product performance
            </p>
            <h2 className="mt-1 text-[17px] font-bold tracking-[-.03em]">
              Best sellers
            </h2>
          </div>

          <div className="p-3 sm:p-4">
            {metrics.topProducts.length ? (
              <div className="divide-y divide-black/[.055]">
                {metrics.topProducts.map((product, index) => (
                  <div
                    key={product.productId || product.name}
                    className="flex items-center gap-3 py-3"
                  >
                    <span
                      className={
                        "grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-[10px] font-black " +
                        (index === 0
                          ? "bg-[#001cac] text-white"
                          : "bg-black/[.035] text-black/40")
                      }
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      {product.productId ? <Link href={"/admin/products/" + product.productId} className="block break-words text-xs font-semibold !text-[#001cac] hover:underline">{product.name}</Link> : <strong className="block break-words text-xs">{product.name}</strong>}
                      <span className="mt-1 block truncate text-[10px] text-black/50">
                        {product.sku || "No SKU"} · {product.quantity} sold
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <strong className="block text-[10px]">
                        {formatPrice(product.revenue)}
                      </strong>
                      <span className="mt-0.5 block text-[10px] uppercase text-black/50">
                        revenue
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[205px] flex-col items-center justify-center px-5 text-center">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-black/[.035] text-sm font-bold text-black/50">
                  #
                </div>
                <p className="mt-3 text-[11px] font-semibold">
                  No best sellers yet
                </p>
                <p className="mt-1 max-w-[220px] text-[10px] leading-4 text-black/50">
                  Product rankings appear after orders are recorded.
                </p>
                <Link
                  href="/admin/orders?new=1"
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#111] px-4 text-[10px] font-bold !text-white"
                >
                  Create order
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <section className="overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[.06]">
          <div className="flex items-center justify-between border-b border-black/[.055] p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#001cac]">
                Attention
              </p>
              <h2 className="mt-1 text-[15px] font-bold tracking-[-.025em]">
                Needs action
              </h2>
            </div>
            <span className="rounded-full bg-black/[.035] px-2.5 py-1 text-[10px] font-semibold text-black/50">{attentionItems.filter((item) => item.active).length} to review</span>
          </div>

          <div className="divide-y divide-black/[.055]">
            {attentionItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex min-h-[62px] items-center gap-3 px-4 py-3 transition hover:bg-black/[.018]"
              >
                <span
                  className={
                    "h-2 w-2 shrink-0 rounded-full " +
                    (item.active ? "bg-amber-500" : "bg-emerald-500")
                  }
                />
                <div className="min-w-0 flex-1">
                  <strong className="block break-words text-xs">
                    {item.label}
                  </strong>
                  <span className="mt-0.5 block truncate text-[10px] text-black/50">
                    {item.note}
                  </span>
                </div>
                <strong className="shrink-0 text-[11px]">{item.value}</strong>
                <span className="text-[11px] text-black/20 transition group-hover:translate-x-0.5 group-hover:text-black/50">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] bg-white p-3 ring-1 ring-black/[.06] sm:p-4">
          <div className="px-1 pb-3">
            <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#001cac]">
              Operations
            </p>
            <h2 className="mt-1 text-[15px] font-bold tracking-[-.025em]">
              Store overview
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {operationCards.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group min-w-0 min-h-[92px] rounded-[16px] bg-[#f7f7f8] p-3 transition hover:bg-[#f0f1f4]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/50">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-black/20 transition group-hover:text-black/50">
                    ↗
                  </span>
                </div>
                <strong className="mt-3 block text-[21px] leading-none tracking-[-.04em]">
                  {item.value}
                </strong>
                <span className="mt-2 block truncate text-[10px] text-black/50">
                  {item.meta}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[.06]">
        <div className="flex items-center justify-between gap-3 border-b border-black/[.055] p-4 sm:p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#001cac]">
              Fulfilment
            </p>
            <h2 className="mt-1 text-[17px] font-bold tracking-[-.03em]">
              Recent orders
            </h2>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-3.5 text-[10px] font-bold transition hover:bg-black/[.025]"
          >
            Manage orders
          </Link>
        </div>

        {metrics.recentOrders.length ? (
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {metrics.recentOrders.map((order) => <article key={order.id} className="min-w-0 rounded-xl border border-black/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-all text-sm font-semibold"><Link href={"/admin/orders/" + order.id} className="!text-[#001cac] hover:underline">{order.orderNumber}</Link></h3><strong className="text-sm">{formatPrice(order.total)}</strong></div>
              <p className="mt-2 break-words text-xs font-semibold">{order.customerName}</p><p className="mt-1 text-[10px] text-black/50">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              <div className="mt-3 flex flex-wrap gap-2"><span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ring-1 " + statusClass(order.status)}>{order.status.replaceAll("-", " ")}</span><span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ring-1 " + statusClass(order.paymentStatus)}>{order.paymentMethod.toUpperCase()} · {order.paymentStatus}</span></div>
              <Link href={"/admin/orders/" + order.id} className="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-black/10 px-3 text-xs font-semibold !text-[#001cac] hover:bg-[#eef2ff]">View order →</Link>
            </article>)}
          </div>
        ) : (
          <div className="flex min-h-[150px] flex-col items-center justify-center p-6 text-center">
            <p className="text-[11px] font-semibold">No orders yet</p>
            <p className="mt-1 text-[10px] text-black/50">
              New orders will appear here automatically.
            </p>
            <Link
              href="/admin/orders?new=1"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#001cac] px-4 text-[10px] font-bold !text-white"
            >
              + Create first order
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
