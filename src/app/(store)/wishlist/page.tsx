import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const { supabase, user } = await getUserAndProfile();
  if (!user) redirect("/login?next=/wishlist");

  const { data } = await supabase
    .from("wishlist")
    .select("products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const products = ((data ?? []) as unknown as { products: Product | null }[]).map((w) => w.products).filter(Boolean) as Product[];

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-4xl font-semibold">Wishlist</h1>
      {products.length === 0 ? (
        <div className="card p-12 text-center text-ink/60">
          Nothing saved yet. <Link href="/shop" className="text-clay-700 underline">Browse the shop</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
