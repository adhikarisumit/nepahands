"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasReceivedProduct } from "@/lib/reviews";

export async function toggleWishlist(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in" };

  const { data: existing } = await supabase
    .from("wishlist")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId);
    if (error) return { error: error.message };
    revalidatePath("/wishlist");
    return { saved: false };
  }
  const { error } = await supabase.from("wishlist").insert({ user_id: user.id, product_id: productId });
  if (error) return { error: error.message };
  revalidatePath("/wishlist");
  return { saved: true };
}

export async function submitReview(input: { productId: string; slug: string; rating: number; comment: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in" };
  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) return { error: "Rating must be between 1 and 5" };

  if (!(await hasReceivedProduct(supabase, user.id, input.productId))) {
    return { error: "You can review this item once your order containing it has been delivered." };
  }

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const { error } = await supabase.from("reviews").insert({
    product_id: input.productId,
    user_id: user.id,
    rating,
    comment: input.comment.slice(0, 2000),
    author_name: profile?.full_name || user.email?.split("@")[0],
  });
  if (error) {
    if (error.code === "23505") return { error: "You already reviewed this product" };
    if (error.code === "42501") return { error: "You can review this item once your order containing it has been delivered." };
    return { error: error.message };
  }
  revalidatePath(`/product/${input.slug}`);
  return { ok: true };
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in" };
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: String(formData.get("full_name") ?? ""), phone: String(formData.get("phone") ?? "") })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/account");
  return { ok: true };
}
