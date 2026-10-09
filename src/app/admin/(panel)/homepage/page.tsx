import { AdminHomepageLayouts } from "@/components/AdminHomepageLayouts";
import { AdminHomeAbout } from "@/components/AdminHomeAbout";
import { AdminHeroManager } from "@/components/AdminHeroManager";

export const dynamic = "force-dynamic";

export default function AdminHomepagePage() {
  return (
    <>
      <AdminHeroManager />
      <div className="mt-8"><AdminHomeAbout /></div>
      <div className="mt-8"><AdminHomepageLayouts /></div>
    </>
  );
}
