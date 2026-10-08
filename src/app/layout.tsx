import type { Metadata } from "next";
import "./globals.css";
import "./mobile-ui.css";
import "./admin-forms.css";
import { SiteChrome } from "@/components/SiteChrome";
import { getCatalogProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/site-settings";
import { store } from "@/config/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: store.name,
    template: `%s | ${store.name}`,
  },
  description: store.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [products, settings] = await Promise.all([
    getCatalogProducts(),
    getStoreSettings(),
  ]);

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className="min-h-screen bg-[#fafafa] text-kleid-ink antialiased"
      >
        <SiteChrome products={products} settings={settings}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
