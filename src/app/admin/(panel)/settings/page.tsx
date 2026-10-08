import { AdminBackendStatus } from "@/components/AdminBackendStatus";
import { AdminStoreSettings } from "@/components/AdminStoreSettings";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return <><AdminBackendStatus /><AdminStoreSettings /></>;
}
