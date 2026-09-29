import Link from "next/link";
import { AlertTriangle, DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatPrice, LOCALE, statusColor } from "@/lib/utils";
import type { Order, Product } from "@/lib/types";

const PAID = ["paid", "processing", "shipped", "delivered"];

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const since = new Date(Date.now() - 29 * 86400000);
  since.setHours(0, 0, 0, 0);

  const [paidOrders, recent, customers, products, lowStock, pending] = await Promise.all([
    supabase.from("orders").select("total, created_at").in("status", PAID).gte("created_at", since.toISOString()),
    supabase.from("orders").select("*").neq("status", "cancelled").order("created_at", { ascending: false }).limit(8),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id, name, stock, slug").lte("stock", 3).eq("active", true).order("stock").limit(8),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "processing"]),
  ]);

  const rows = (paidOrders.data ?? []) as Pick<Order, "total" | "created_at">[];
  const revenue = rows.reduce((s, o) => s + Number(o.total), 0);

  // Revenue per day for the last 30 days
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since.getTime() + i * 86400000);
    return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString(LOCALE, { month: "short", day: "numeric" }), total: 0 };
  });
  rows.forEach((o) => {
    const day = days.find((d) => d.key === new Date(o.created_at).toISOString().slice(0, 10));
    if (day) day.total += Number(o.total);
  });
  const max = Math.max(1, ...days.map((d) => d.total));

  const stats = [
    { label: "Revenue (30 days)", value: formatPrice(revenue), icon: DollarSign },
    { label: "Orders (30 days)", value: rows.length, icon: ShoppingCart },
    { label: "Customers", value: customers.count ?? 0, icon: Users },
    { label: "Products", value: products.count ?? 0, icon: Package },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        {!!pending.count && (
          <p className="mt-1 text-sm text-ink/60">
            <Link href="/admin/orders?status=paid" className="text-clay-700 underline">{pending.count} order{pending.count > 1 ? "s" : ""}</Link> waiting to be fulfilled.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between text-ink/60">
              <span className="text-sm">{label}</span>
              <Icon size={18} />
            </div>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-semibold">Revenue — last 30 days</h2>
        <div className="flex h-48 items-end gap-1">
          {days.map((d) => (
            <div key={d.key} className="group relative flex h-full flex-1 items-end">
              <div className="w-full rounded-t bg-clay-400 transition group-hover:bg-clay-600" style={{ height: `${Math.max(2, (d.total / max) * 100)}%` }} />
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white group-hover:block">
                {d.label}: {formatPrice(d.total)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink/40">
          <span>{days[0].label}</span>
          <span>{days[days.length - 1].label}</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between p-5">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-clay-700 hover:underline">View all</Link>
          </div>
          <table className="table-x">
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {((recent.data ?? []) as Order[]).map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`} className="font-medium text-clay-700 hover:underline">#{o.order_number}</Link></td>
                  <td className="max-w-40 truncate">{o.email}</td>
                  <td>{formatDate(o.created_at)}</td>
                  <td><span className={`badge ${statusColor[o.status]}`}>{o.status}</span></td>
                  <td className="text-right">{formatPrice(o.total, o.currency)}</td>
                </tr>
              ))}
              {!recent.data?.length && <tr><td colSpan={5} className="py-8 text-center text-ink/50">No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><AlertTriangle size={16} className="text-clay-600" /> Low stock</h2>
          <ul className="space-y-2 text-sm">
            {((lowStock.data ?? []) as Product[]).map((p) => (
              <li key={p.id} className="flex justify-between">
                <Link href={`/admin/products/${p.id}`} className="truncate hover:text-clay-700">{p.name}</Link>
                <span className={p.stock === 0 ? "font-semibold text-red-600" : "text-clay-700"}>{p.stock}</span>
              </li>
            ))}
            {!lowStock.data?.length && <li className="text-ink/50">All products well stocked.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
