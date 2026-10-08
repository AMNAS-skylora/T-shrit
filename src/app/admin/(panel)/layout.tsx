import type { ReactNode } from "react";
import { AdminShell } from "@/components/AdminShell";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
