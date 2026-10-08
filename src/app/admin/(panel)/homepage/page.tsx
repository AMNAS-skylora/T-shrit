import { AdminHeroManager } from "@/components/AdminHeroManager";
import { AdminAnimationBarManager } from "@/components/AdminAnimationBarManager";

export const dynamic = "force-dynamic";

export default function AdminHomepagePage() {
  return (
    <>
      <AdminHeroManager />
      <AdminAnimationBarManager />
    </>
  );
}
