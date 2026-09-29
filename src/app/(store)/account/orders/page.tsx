import Link from "next/link";
import { Package } from "lucide-react";
import { getUserAndProfile } from "@/lib/supabase/server";
import OrderCard from "@/components/OrderCard";
import type { Order } from "@/lib/types";

export const metadata = { title: "My orders" };

export default async function AccountOrders() {
  const { supabase, user } = await getUserAndProfile();
  if (!user) return null;
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(id, image, name, quantity)")
    .eq("user_id", user.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  const orders = (data as Order[]) ?? [];

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Orders</h2>
      {orders.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <Package size={32} className="text-clay-400" />
          <p className="mt-4 text-ink/60">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="btn-primary mt-6">Browse the shop</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => <OrderCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
