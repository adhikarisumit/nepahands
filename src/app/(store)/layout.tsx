import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getUserAndProfile } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { BRAND } from "@/lib/branding";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [{ user, profile }, settings] = await Promise.all([getUserAndProfile(), getSettings()]);
  return (
    <div className="flex min-h-screen flex-col">
      <Header
        isLoggedIn={!!user}
        isAdmin={profile?.role === "admin"}
        announcement={settings.announcement}
        storeName={BRAND.name}
        logoUrl={BRAND.logo_url}
        userName={profile?.full_name}
        userEmail={user?.email}
      />
      <main className="flex-1">{children}</main>
      <Footer
        storeName={BRAND.name}
        logoUrl={BRAND.logo_url}
        text={BRAND.footer_text}
        social={BRAND.social}
        contactEmail={settings.contact_email}
      />
    </div>
  );
}
