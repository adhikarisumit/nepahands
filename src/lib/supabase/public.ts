import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-less client with the publishable key (anonymous role). Safe to use inside
 * unstable_cache because it doesn't depend on who is viewing — RLS returns public data only.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
