import "server-only";
import { createClient } from "@supabase/supabase-js";

// Secret-key client (sb_secret_…): bypasses RLS. Only use in trusted server code (API routes, webhooks).
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
