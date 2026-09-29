import Link from "next/link";
import { ArrowRight, Heart, Package, ShoppingBag, Wallet } from "lucide-react";
import { getUserAndProfile } from "@/lib/supabase/server";
import OrderCard from "@/components/OrderCard";
import ProductCard from "@/components/ProductCard";
import type { Order, Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "My account" };

const PAID = ["paid", "processing", "shipped", "delivered"];

export default async function AccountOverview() {
  const { supabase, user } = await getUserAndProfile();
  if (!user) return null;

  const [{ data: ordersData }, { count: wishCount }, { data: picks }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(id, image, name, quantity)")
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
    supabase.from("wishlist").select("product_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("products").select("*").eq("active", true).eq("featured", true).limit(3),
  ]);

  const orders = (ordersData as Order[]) ?? [];
  const spent = orders.filter((o) => PAID.includes(o.status)).reduce((s, o) => s + Number(o.total), 0);
  const inProgress = orders.filter((o) => ["paid", "processing", "shipped"].includes(o.status)).length;

  const stats = [
    { label: "Total orders", value: orders.length, icon: Package, href: "/account/orders" },
    { label: "On the way", value: inProgress, icon: ShoppingBag, href: "/account/orders" },
    { label: "Total spent", value: formatPrice(spent), icon: Wallet, href: "/account/orders" },
    { label: "Wishlist", value: wishCount ?? 0, icon: Heart, href: "/wishlist" },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="card group p-4 transition hover:border-clay-300 hover:shadow-sm sm:p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-100 text-clay-700 transition group-hover:bg-clay-700 group-hover:text-white">
              <Icon size={18} />
            </span>
            <p className="mt-3 break-words text-xl font-semibold sm:mt-4 sm:text-2xl">{value}</p>
            <p className="text-sm text-ink/50">{label}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Recent orders</h2>
          {orders.length > 3 && (
            <Link href="/account/orders" className="text-sm text-clay-700 hover:underline">View all</Link>
          )}
        </div>
        {orders.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-clay-100 text-clay-600">
              <ShoppingBag size={28} />
            </span>
            <h3 className="mt-5 text-xl font-semibold">No orders yet</h3>
            <p className="mt-2 max-w-sm text-ink/60">
              When you buy something, you&apos;ll be able to track it here from workshop to doorstep.
            </p>
            <Link href="/shop" className="btn-primary mt-6">
              Start shopping <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        )}
      </section>

      {picks && picks.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-semibold">Picked for you</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
            {(picks as Product[]).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
