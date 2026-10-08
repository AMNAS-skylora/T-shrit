import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TryOnCamera } from "@/components/TryOnCamera";
import { getCatalogProductBySlug } from "@/lib/catalog";

type TryOnPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Try-On Anywhere",
  robots: { index: false, follow: false },
};

export default async function TryOnPage({ params }: TryOnPageProps) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product || !product.featuredImage || product.status === "draft") {
    notFound();
  }

  return <TryOnCamera product={product} />;
}
