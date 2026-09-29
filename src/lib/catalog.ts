import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "./supabase/public";
import type { Category, Product } from "./types";

/**
 * Public catalog reads, cached across requests. Admin product/category edits and paid orders
 * (stock changes) call revalidateTag(CATALOG_TAG), so shoppers see changes right away.
 * The 5-minute revalidate is only a safety net.
 */
export const CATALOG_TAG = "catalog";
const opts = { tags: [CATALOG_TAG], revalidate: 300 };

const db = () => createPublicClient();

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message); // errors are never cached
  return res.data as T;
}

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => unwrap(await db().from("categories").select("*").order("name")) ?? [],
  ["categories"],
  opts
);

/** Number of active products in each category (for the shop filter counts). */
export const getCategoryCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const rows = unwrap(await db().from("products").select("category_id").eq("active", true)) as { category_id: string | null }[] | null;
    const counts: Record<string, number> = {};
    for (const r of rows ?? []) if (r.category_id) counts[r.category_id] = (counts[r.category_id] ?? 0) + 1;
    return counts;
  },
  ["category-counts"],
  opts
);

export const getFeaturedProducts = unstable_cache(
  async (limit: number): Promise<Product[]> =>
    unwrap(await db().from("products").select("*").eq("active", true).eq("featured", true).limit(limit)) ?? [],
  ["featured-products"],
  opts
);

export const getLatestProducts = unstable_cache(
  async (limit: number): Promise<Product[]> =>
    unwrap(await db().from("products").select("*").eq("active", true).order("created_at", { ascending: false }).limit(limit)) ?? [],
  ["latest-products"],
  opts
);

const loadProductBySlug = unstable_cache(
  async (slug: string): Promise<Product | null> =>
    unwrap(await db().from("products").select("*, categories(name, slug)").eq("slug", slug).eq("active", true).maybeSingle()),
  ["product-by-slug"],
  opts
);
// cache() so generateMetadata and the page share one lookup per request
export const getProductBySlug = cache(loadProductBySlug);

export const getRelatedProducts = unstable_cache(
  async (categoryId: string, excludeId: string): Promise<Product[]> =>
    unwrap(
      await db().from("products").select("*").eq("active", true).eq("category_id", categoryId).neq("id", excludeId).limit(4)
    ) ?? [],
  ["related-products"],
  opts
);

export type ShopQuery = {
  q?: string;
  categoryIds?: string[];
  min?: number;
  max?: number;
  inStock?: boolean;
  sort?: string;
  page: number;
  pageSize: number;
};

export const searchProducts = unstable_cache(
  async (p: ShopQuery): Promise<{ products: Product[]; count: number }> => {
    let query = db().from("products").select("*", { count: "exact" }).eq("active", true);
    if (p.q) {
      const term = p.q.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,artisan.ilike.%${term}%,material.ilike.%${term}%`);
    }
    if (p.categoryIds?.length) query = query.in("category_id", p.categoryIds);
    if (p.min != null && !isNaN(p.min)) query = query.gte("price", p.min);
    if (p.max != null && !isNaN(p.max)) query = query.lte("price", p.max);
    if (p.inStock) query = query.gt("stock", 0);

    switch (p.sort) {
      case "price-asc":
        query = query.order("price", { ascending: true });
        break;
      case "price-desc":
        query = query.order("price", { ascending: false });
        break;
      case "name":
        query = query.order("name");
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      default:
        query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
    }

    const from = (p.page - 1) * p.pageSize;
    const { data, count, error } = await query.range(from, from + p.pageSize - 1);
    if (error) throw new Error(error.message);
    return { products: (data as Product[]) ?? [], count: count ?? 0 };
  },
  ["search-products"],
  opts
);
