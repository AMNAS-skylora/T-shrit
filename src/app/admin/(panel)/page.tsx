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
    tone === "blue" || tone === "dark" ? "text-white/55" : "text-black/42";

  const labelColor =
    tone === "blue"
      ? "text-white/65"
      : tone === "dark"
        ? "text-white/55"
        : tone === "amber"
          ? "text-amber-700"
          : "text-black/42";

  return (
    <article
      className={
        "relative min-h-[132px] overflow-hidden rounded-[22px] p-4 ring-1 sm:p-5 " +
        shell
      }
    >
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-center justify-between gap-3">
          <p
            className={
              "text-[9px] font-bold uppercase tracking-[.12em] " + labelColor
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
          <strong className="block break-words text-[26px] font-bold leading-none tracking-[-.05em] sm:text-[30px]">
            {value}
          </strong>
          <span className={"mt-2 block text-[9px] leading-4 " + muted}>
            {help}
          </span>
        </div>
      </div>
    </article>
  );
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();
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
    <div className="pb-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#001cac]" />
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#001cac]">
              Control center
            </p>
          </div>
          <h1 className="mt-2 text-[34px] font-bold leading-none tracking-[-.055em] md:text-[42px]">
            Dashboard
          </h1>
          <p className="mt-2.5 max-w-xl text-[11px] leading-5 text-black/42">
            Sales, payments, products, inventory and fulfilment at a glance.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-black/[.06]">
            <span className="block text-[8px] font-bold uppercase tracking-[.1em] text-black/35">
              Cost setup
            </span>
            <strong className="mt-0.5 block text-[11px]">
              {metrics.costConfiguredProducts}/{metrics.totalProducts} products
            </strong>
          </div>
          <div className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-black/[.06]">
            <span className="block text-[8px] font-bold uppercase tracking-[.1em] text-black/35">
              Delivered
            </span>
            <strong className="mt-0.5 block text-[11px]">
              {metrics.deliveredOrders} orders
            </strong>
          </div>
        </div>
      </header>

      <section
        aria-label="Quick actions"
        className="mt-5 overflow-hidden rounded-[22px] border border-white/10 bg-[#0f1013] shadow-[0_16px_45px_rgba(0,0,0,.10)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/[.08] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="ml-2 font-mono text-[8px] uppercase tracking-[.16em] text-white/30">
              Quick actions
            </span>
          </div>
          <span className="hidden font-mono text-[8px] uppercase tracking-[.1em] text-white/20 sm:block">
            KLEID.IN / ADMIN
          </span>
        </div>

        <div className="grid grid-cols-2 gap-px bg-white/[.08] sm:grid-cols-4 xl:grid-cols-7">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-h-[88px] flex-col justify-between bg-[#0f1013] p-3.5 text-white transition duration-200 hover:bg-[#17191f] sm:min-h-[96px]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/10 bg-white/[.04] font-mono text-[12px] font-bold text-[#7890ff] transition group-hover:border-[#7890ff]/40 group-hover:bg-[#001cac]/20">
                  {action.short}
                </span>
                <span className="text-[12px] text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/60">
                  ↗
                </span>
              </div>
              <div className="mt-3 min-w-0">
                <strong className="block truncate text-[11px] font-semibold text-white">
                  {action.label}
                </strong>
                <span className="mt-1 block truncate text-[8px] uppercase tracking-[.08em] text-white/30">
                  {action.description}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

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

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,.75fr)]">
        <section className="overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[.06]">
          <div className="flex flex-col gap-3 border-b border-black/[.055] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[.15em] text-[#001cac]">
                Last 7 days
              </p>
              <h2 className="mt-1 text-[17px] font-bold tracking-[-.03em]">
                Sales performance
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="block text-[8px] uppercase tracking-[.08em] text-black/30">
                  Today
                </span>
                <strong className="mt-0.5 block text-[12px]">
                  {formatPrice(metrics.todayRevenue)}
                </strong>
              </div>
              <div>
                <span className="block text-[8px] uppercase tracking-[.08em] text-black/30">
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
                <p className="mt-1 text-[9px] text-black/35">
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
                    ? Math.max(
                        10,
                        Math.round((item.revenue / maxDailyRevenue) * 100),
                      )
                    : 4;

                return (
                  <div
                    key={item.key}
                    className="flex h-full min-w-0 flex-col justify-end"
                  >
                    <div className="mb-2 hidden text-center sm:block">
                      <span className="text-[8px] font-semibold text-black/35">
                        {item.revenue ? formatPrice(item.revenue) : "—"}
                      </span>
                    </div>
                    <div className="relative flex h-[138px] items-end overflow-hidden rounded-[10px] bg-[#f6f7f9]">
                      <div
                        className="w-full rounded-t-[8px] bg-[#001cac] transition-[height]"
                        style={{ height: `${height}%` }}
                        title={`${item.label}: ${formatPrice(item.revenue)} · ${item.orders} orders`}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <strong className="block text-[9px]">{item.label}</strong>
                      <span className="mt-0.5 block text-[7px] text-black/30">
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
            <p className="text-[8px] font-black uppercase tracking-[.15em] text-[#001cac]">
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
                        "grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-[9px] font-black " +
                        (index === 0
                          ? "bg-[#001cac] text-white"
                          : "bg-black/[.035] text-black/40")
                      }
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-[11px]">
                        {product.name}
                      </strong>
                      <span className="mt-1 block truncate text-[8px] text-black/35">
                        {product.sku || "No SKU"} · {product.quantity} sold
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <strong className="block text-[10px]">
                        {formatPrice(product.revenue)}
                      </strong>
                      <span className="mt-0.5 block text-[7px] uppercase text-black/30">
                        revenue
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[205px] flex-col items-center justify-center px-5 text-center">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-black/[.035] text-sm font-bold text-black/35">
                  #
                </div>
                <p className="mt-3 text-[11px] font-semibold">
                  No best sellers yet
                </p>
                <p className="mt-1 max-w-[220px] text-[9px] leading-4 text-black/35">
                  Product rankings appear automatically after completed sales.
                </p>
                <Link
                  href="/admin/orders?new=1"
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#111] px-4 text-[9px] font-bold !text-white"
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
              <p className="text-[8px] font-black uppercase tracking-[.15em] text-[#001cac]">
                Attention
              </p>
              <h2 className="mt-1 text-[15px] font-bold tracking-[-.025em]">
                Needs action
              </h2>
            </div>
            <span className="rounded-full bg-black/[.035] px-2.5 py-1 text-[8px] font-bold uppercase text-black/40">
              Live
            </span>
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
                  <strong className="block truncate text-[10px]">
                    {item.label}
                  </strong>
                  <span className="mt-0.5 block truncate text-[8px] text-black/35">
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
            <p className="text-[8px] font-black uppercase tracking-[.15em] text-[#001cac]">
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
                className="group min-h-[92px] rounded-[16px] bg-[#f7f7f8] p-3 transition hover:bg-[#f0f1f4]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[8px] font-bold uppercase tracking-[.08em] text-black/35">
                    {item.label}
                  </span>
                  <span className="text-[9px] text-black/20 transition group-hover:text-black/50">
                    ↗
                  </span>
                </div>
                <strong className="mt-3 block text-[21px] leading-none tracking-[-.04em]">
                  {item.value}
                </strong>
                <span className="mt-2 block truncate text-[8px] text-black/35">
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
            <p className="text-[8px] font-black uppercase tracking-[.15em] text-[#001cac]">
              Fulfilment
            </p>
            <h2 className="mt-1 text-[17px] font-bold tracking-[-.03em]">
              Recent orders
            </h2>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-black/10 bg-white px-3.5 text-[9px] font-bold transition hover:bg-black/[.025]"
          >
            Manage orders
          </Link>
        </div>

        {metrics.recentOrders.length ? (
          <>
            <div className="grid gap-2 p-3 md:hidden">
              {metrics.recentOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-[16px] border border-black/[.07] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-[11px]">
                        {order.orderNumber}
                      </strong>
                      <span className="mt-1 block truncate text-[9px] text-black/40">
                        {order.customerName}
                      </span>
                    </div>
                    <strong className="shrink-0 text-[11px]">
                      {formatPrice(order.total)}
                    </strong>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span
                      className={
                        "rounded-full px-2.5 py-1 text-[7px] font-bold uppercase ring-1 " +
                        statusClass(order.status)
                      }
                    >
                      {order.status.replaceAll("-", " ")}
                    </span>
                    <span
                      className={
                        "rounded-full px-2.5 py-1 text-[7px] font-bold uppercase ring-1 " +
                        statusClass(order.paymentStatus)
                      }
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-left text-[10px]">
                <thead className="bg-[#fafafa] text-black/35">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="font-semibold">Customer</th>
                    <th className="font-semibold">Total</th>
                    <th className="font-semibold">Payment</th>
                    <th className="font-semibold">Status</th>
                    <th className="pr-5 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-black/[.055] transition hover:bg-black/[.012]"
                    >
                      <td className="px-5 py-3.5 font-semibold">
                        {order.orderNumber}
                      </td>
                      <td>{order.customerName}</td>
                      <td className="font-semibold">
                        {formatPrice(order.total)}
                      </td>
                      <td>
                        <span
                          className={
                            "rounded-full px-2.5 py-1 text-[7px] font-bold uppercase ring-1 " +
                            statusClass(order.paymentStatus)
                          }
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            "rounded-full px-2.5 py-1 text-[7px] font-bold uppercase ring-1 " +
                            statusClass(order.status)
                          }
                        >
                          {order.status.replaceAll("-", " ")}
                        </span>
                      </td>
                      <td className="pr-5 text-black/40">
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex min-h-[150px] flex-col items-center justify-center p-6 text-center">
            <p className="text-[11px] font-semibold">No orders yet</p>
            <p className="mt-1 text-[9px] text-black/35">
              New orders will appear here automatically.
            </p>
            <Link
              href="/admin/orders?new=1"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#001cac] px-4 text-[9px] font-bold !text-white"
            >
              + Create first order
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
