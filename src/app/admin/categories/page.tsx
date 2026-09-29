import { requireAdmin } from "@/lib/admin";
import CategoryManager from "./CategoryManager";
import type { Category } from "@/lib/types";

export const metadata = { title: "Categories" };

export default async function AdminCategories() {
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("products").select("category_id"),
  ]);
  const counts: Record<string, number> = {};
  (products ?? []).forEach((p) => p.category_id && (counts[p.category_id] = (counts[p.category_id] ?? 0) + 1));

  return (
    <CategoryManager categories={(categories as Category[]) ?? []} counts={counts} />
  );
}
