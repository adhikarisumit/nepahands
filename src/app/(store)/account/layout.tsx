import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import { LOCALE } from "@/lib/utils";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login?next=/account");

  const name = profile?.full_name || user.email?.split("@")[0] || "there";
  const initials = name
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const since = new Date(profile?.created_at ?? Date.now()).toLocaleDateString(LOCALE, { month: "long", year: "numeric" });

  return (
    <div>
      <section className="border-b border-clay-100 bg-gradient-to-br from-clay-100 via-clay-50 to-white">
        <div className="container-x flex items-center gap-4 py-6 sm:gap-5 sm:py-10">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-clay-700 text-lg font-semibold text-white shadow-md sm:h-16 sm:w-16 sm:text-xl">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink/50">Welcome back,</p>
            <h1 className="truncate text-2xl font-semibold sm:text-4xl">{name}</h1>
            <p className="mt-1 truncate text-sm text-ink/50">
              {user.email}
              <span className="hidden sm:inline"> · Member since {since}</span>
            </p>
          </div>
        </div>
      </section>
      {/* Account navigation lives in the header dropdown (UserMenu). */}
      <div className="container-x py-6 sm:py-10">{children}</div>
    </div>
  );
}
