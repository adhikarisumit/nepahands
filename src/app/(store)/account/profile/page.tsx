import { getUserAndProfile } from "@/lib/supabase/server";
import ProfileForm from "../ProfileForm";
import PasswordForm from "./PasswordForm";

export const metadata = { title: "Profile & security" };

export default async function ProfilePage() {
  const { user, profile } = await getUserAndProfile();
  if (!user) return null;
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold">Personal details</h2>
        <p className="mb-5 mt-1 text-sm text-ink/60">Used to pre-fill checkout and on your reviews.</p>
        <ProfileForm fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} email={user.email ?? ""} />
      </section>
      <section>
        <h2 className="text-2xl font-semibold">Password</h2>
        <p className="mb-5 mt-1 text-sm text-ink/60">Use a strong password that you don&apos;t use on any other website.</p>
        <PasswordForm email={user.email ?? ""} />
      </section>
    </div>
  );
}
