import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * True when the user has a DELIVERED order containing this product — the requirement for
 * writing a review. The database enforces the same rule (reviews insert policy,
 * supabase/migrations/005_verified_reviews.sql); this check gives a friendly message first.
 * Uses the viewer's own client, so RLS limits it to their own orders.
 */
export async function hasReceivedProduct(supabase: SupabaseClient, userId: string, productId: string) {
  const { data, error } = await supabase
    .from("order_items")
    .select("id, orders!inner(user_id, status)")
    .eq("product_id", productId)
    .eq("orders.user_id", userId)
    .eq("orders.status", "delivered")
    .limit(1);
  if (error) {
    console.error("Review eligibility check failed", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}
