import { AdminLoginForm } from "@/components/AdminLoginForm";

export const metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  return (
    <main data-admin-ui className="flex min-h-screen items-center justify-center bg-[#f5f6f8] p-5">
      <AdminLoginForm />
    </main>
  );
}
