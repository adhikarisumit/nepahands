import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component; middleware refreshes the session instead.
          }
        },
      },
    }
  );
}

export type SessionUser = { id: string; email: string | null };

/**
 * Current user + profile, deduplicated per request (layout and page share one lookup).
 * getClaims() verifies the JWT signature locally against the project's cached signing keys,
 * avoiding a round trip to the Auth server on every render. Mutations (server actions, API
 * routes) still use getUser() for a fully server-side check.
 */
export const getUserAndProfile = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { supabase, user: null as SessionUser | null, profile: null };
  const user: SessionUser = { id: claims.sub, email: (claims.email as string | undefined) ?? null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { supabase, user: user as SessionUser | null, profile };
});
