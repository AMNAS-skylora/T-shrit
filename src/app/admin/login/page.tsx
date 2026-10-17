import { AdminLoginForm } from "@/components/AdminLoginForm";

export const metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  return (
    <main data-admin-ui className="flex h-[100dvh] min-h-0 w-full items-center justify-center overflow-x-hidden overflow-y-auto overscroll-contain bg-[#f5f6f8] px-4 py-4 sm:px-6">
      <div className="my-auto w-full max-w-[440px] shrink-0">
        <AdminLoginForm />
      </div>
    </main>
  );
}
