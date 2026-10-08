import { AdminProductDetail } from "@/components/AdminProductDetail";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

type ProductAdminPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductAdminPage({
  params,
}: ProductAdminPageProps) {
  const { id } = await params;
  const productId = decodeURIComponent(id).trim();

  return <AdminProductDetail productId={productId} />;
}
