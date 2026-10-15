"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { HomeShoppingMotion } from "@/components/HomeShoppingMotion";
import { Header } from "@/components/Header";
import { CartProvider } from "@/components/CartProvider";
import { Footer } from "@/components/Footer";
import { ShopPageTransition } from "@/components/ShopPageTransition";
import { ProductImageTransition } from "@/components/ProductImageTransition";
import { StoreSettingsProvider } from "@/components/StoreSettingsContext";
import type { Product } from "@/types/product";
import type { StoreSettings } from "@/types/commerce";

export function SiteChrome({
  children,
  products,
  settings,
}: {
  children: React.ReactNode;
  products: Product[];
  settings: StoreSettings;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const showAnnouncement =
    settings.announcementEnabled &&
    !announcementDismissed;
  const overlayHomeHeader = false;

  useEffect(() => {
    if (isAdmin) return;
    setAnnouncementDismissed(
      window.sessionStorage.getItem("kleidin-announcement-dismissed") === "1",
    );
  }, [isAdmin]);


  if (isAdmin) return <>{children}</>;

  return (
    <StoreSettingsProvider settings={settings}>
      <CartProvider>
      {showAnnouncement ? (
        <div className="relative flex min-h-9 w-full items-center justify-center gap-2 bg-[#111111] px-10 py-2 text-center text-[9px] font-bold uppercase tracking-[.14em] text-white">
          <span>{settings.announcementText}</span>
          {settings.announcementButtonLabel && settings.announcementButtonHref ? (
            <Link
              href={settings.announcementButtonHref}
              className="border-b border-white/70 !text-white"
            >
              {settings.announcementButtonLabel}
            </Link>
          ) : null}

          <button
            type="button"
            aria-label="Close announcement"
            onClick={() => {
              setAnnouncementDismissed(true);
              window.sessionStorage.setItem(
                "kleidin-announcement-dismissed",
                "1",
              );
            }}
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[24px] font-normal leading-none text-white/80 transition hover:text-white"
          >
            ×
          </button>
        </div>
      ) : null}
      <HomeShoppingMotion />
      <ProductImageTransition />
      <ShopPageTransition />
      <Header
        products={products}
        settings={settings}
        overlayHome={overlayHomeHeader}
      />
      <main
        className={overlayHomeHeader ? "site-main-home-overlay" : undefined}
      >
        {children}
      </main>
      {settings.footerEnabled ? <Footer settings={settings} /> : null}
      </CartProvider>
    </StoreSettingsProvider>
  );
}
