"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/settings", label: "Settings" },
];

const mobilePrimary = [
  { href: "/admin", label: "Home", icon: "home" },
  { href: "/admin/orders", label: "Orders", icon: "orders" },
  { href: "/admin/products", label: "Products", icon: "products" },
  { href: "/admin/inventory", label: "Stock", icon: "inventory" },
] as const;

const mobileMore = [
  { href: "/admin/customers", label: "Customers", icon: "customers" },
  { href: "/admin/homepage", label: "Homepage", icon: "homepage" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
] as const;

function NavIcon({
  name,
  className = "h-5 w-5",
}: {
  name: string;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg {...common}>
        <path d="M6 3h12l2 4-2 14H6L4 7l2-4Z" />
        <path d="M4 7h16" />
        <path d="M9 11h6" />
      </svg>
    );
  }

  if (name === "products") {
    return (
      <svg {...common}>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </svg>
    );
  }

  if (name === "inventory") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        <path d="M8 13h8" />
      </svg>
    );
  }

  if (name === "customers") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M16 4.5a4 4 0 0 1 0 7" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.9" />
      </svg>
    );
  }

  if (name === "homepage") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.3 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function isRouteActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = mobileMore.some((item) =>
    isRouteActive(pathname, item.href),
  );

  async function logout() {
    setMoreOpen(false);
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div data-admin-ui className="min-h-screen bg-[#f5f6f8] text-[#111]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] md:grid-cols-[230px_1fr]">
        <aside className="border-b border-black/10 bg-white px-4 py-4 md:border-b-0 md:border-r md:p-5">
          <div className="flex items-center justify-between md:block">
            <div>
              <Link
                href="/admin"
                className="text-lg font-black tracking-[-.04em]"
              >
                KLEID.IN
              </Link>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#001cac]">
                Super Admin · Full Access
              </p>
            </div>
          </div>

          <nav className="mt-8 hidden space-y-1 md:block">
            {nav.map((item) => {
              const active = isRouteActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "block shrink-0 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition " +
                    (active
                      ? "bg-[#001cac] !text-white"
                      : "text-black/55 hover:bg-black/[.04] hover:text-black")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={logout}
            className="mt-8 hidden w-full rounded-xl border border-black/10 px-3 py-2.5 text-left text-[12px] font-semibold text-black/60 md:block"
          >
            Logout
          </button>
        </aside>

        <main className="min-w-0 p-4 pb-[104px] md:p-7 lg:p-9">
          {children}
        </main>
      </div>

      {moreOpen ? (
        <div className="fixed inset-0 z-[130] md:hidden">
          <button
            type="button"
            aria-label="Close more menu"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
          />

          <div className="absolute bottom-[calc(84px+env(safe-area-inset-bottom))] left-3 right-3 max-h-[calc(100dvh-140px)] overflow-y-auto rounded-[22px] border border-black/10 bg-white p-2 shadow-2xl">
            <div className="px-3 pb-2 pt-2">
              <p className="text-[9px] font-bold uppercase tracking-[.14em] text-black/40">
                More
              </p>
            </div>

            <div className="grid gap-1">
              {mobileMore.map((item) => {
                const active = isRouteActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={
                      "flex min-h-12 items-center gap-3 rounded-xl px-3 text-xs font-bold transition " +
                      (active
                        ? "bg-[#001cac] !text-white"
                        : "text-black/70 hover:bg-black/[.04]")
                    }
                  >
                    <NavIcon name={item.icon} className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={logout}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-xs font-bold text-red-600 transition hover:bg-red-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[18px] w-[18px]"
                  aria-hidden="true"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M14 3h6v18h-6" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Admin mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-[140] border-t border-black/10 bg-white px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,.06)] md:hidden"
      >
        <div className="mx-auto grid max-w-[560px] grid-cols-5 gap-1">
          {mobilePrimary.map((item) => {
            const active = isRouteActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={
                  "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[9px] font-bold transition " +
                  (active
                    ? "bg-[#001cac]/[.07] text-[#001cac]"
                    : "text-black/45 active:bg-black/[.04]")
                }
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((current) => !current)}
            aria-expanded={moreOpen}
            className={
              "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[9px] font-bold transition " +
              (moreOpen || moreActive
                ? "bg-[#001cac]/[.07] text-[#001cac]"
                : "text-black/45 active:bg-black/[.04]")
            }
          >
            <NavIcon name="more" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
