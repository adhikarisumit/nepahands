import { requireAdmin } from "@/lib/admin";
import { BRAND } from "@/lib/branding";
import AdminSidebar from "./AdminSidebar";

export const metadata = { title: { default: "Admin", template: "%s | Admin" } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-screen bg-[#f7f4f1] lg:flex">
      <AdminSidebar email={user.email ?? ""} storeName={BRAND.name} logoUrl={BRAND.logo_url} />
      <main className="flex-1 overflow-x-hidden p-4 sm:p-8">{children}</main>
    </div>
  );
}
