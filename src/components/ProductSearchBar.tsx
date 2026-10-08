"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ProductSearchBar({
  initialValue = "",
}: {
  initialValue?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const clean = value.trim();
    const currentQuery = searchParams.get("q")?.trim() ?? "";

    // Never navigate when the URL already represents the current input.
    // Without this guard, router.replace() re-created searchParams and caused
    // an endless /products request loop.
    if (clean === currentQuery) return;

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (clean) {
        params.set("q", clean);
      } else {
        params.delete("q");
      }

      const next = params.toString();
      const nextUrl = next ? `${pathname}?${next}` : pathname;
      const currentUrl = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      if (nextUrl !== currentUrl) {
        router.replace(nextUrl, { scroll: false });
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [pathname, router, searchParams, value]);

  return (
    <div className="catalog-store-search" role="search">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>

      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search products..."
        aria-label="Search products"
        autoComplete="off"
      />

      {value ? (
        <button
          type="button"
          className="catalog-search-clear"
          aria-label="Clear search"
          onClick={() => setValue("")}
        >
          ×
        </button>
      ) : (
        <span className="catalog-search-hint">TYPE TO SEARCH</span>
      )}
    </div>
  );
}
