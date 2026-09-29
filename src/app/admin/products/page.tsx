import { requireAdmin } from "@/lib/admin";
import ProductsManager from "./ProductsManager";
import type { Category, Product } from "@/lib/types";

export const metadata = { title: "Products" };

type SP = Promise<{ q?: string; new?: string; edit?: string }>;

export default async function AdminProducts({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();

  let query = supabase.from("products").select("*, categories(name, slug)").order("created_at", { ascending: false });
  if (sp.q) query = query.ilike("name", `%${sp.q.replace(/[%,]/g, "")}%`);
  const [{ data: products }, { data: categories }] = await Promise.all([query, supabase.from("categories").select("*").order("name")]);

  return (
    <ProductsManager
      products={(products as Product[]) ?? []}
      categories={(categories as Category[]) ?? []}
      query={sp.q}
      initialOpen={sp.new ? "new" : sp.edit}
    />
  );
}
