import { AdminHomepageLayouts } from "@/components/AdminHomepageLayouts";
import { AdminHeroManager } from "@/components/AdminHeroManager";
import { AdminAnimationBarManager } from "@/components/AdminAnimationBarManager";

export const dynamic = "force-dynamic";

export default function AdminHomepagePage() {
  return (
    <>
      <AdminHeroManager />
      <div className="mt-8"><AdminHomepageLayouts /></div>
      <AdminAnimationBarManager />
    </>
  );
}
