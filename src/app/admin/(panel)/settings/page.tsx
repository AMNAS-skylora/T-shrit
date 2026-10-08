import { AdminBackendStatus } from "@/components/AdminBackendStatus";
import { AdminAccountSettings } from "@/components/AdminAccountSettings";
import { AdminStoreSettings } from "@/components/AdminStoreSettings";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return <><AdminStoreSettings /><AdminAccountSettings /><div className="mt-6"><AdminBackendStatus /></div></>;
}
