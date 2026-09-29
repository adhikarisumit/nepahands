import "server-only";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "./supabase/server";

/** Guards admin pages. RLS also enforces admin access on every write. */
export async function requireAdmin() {
  const { supabase, user, profile } = await getUserAndProfile();
  if (!user) redirect("/login?next=/admin");
  if (profile?.role !== "admin") redirect("/");
  return { supabase, user, profile };
}
