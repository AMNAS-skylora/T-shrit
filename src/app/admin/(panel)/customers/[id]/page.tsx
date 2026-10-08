import { AdminCustomerDetail } from "@/components/AdminCustomerDetail";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminCustomerDetail customerId={id} />;
}
