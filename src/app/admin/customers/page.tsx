import Link from "next/link";
import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatPrice } from "@/lib/utils";
import RoleToggle from "./RoleToggle";

export const metadata = { title: "Customers" };

type ProfileRow = { id: string; email: string | null; full_name: string | null; phone: string | null; role: string; created_at: string };

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { supabase } = await requireAdmin();
  // Customers only — admins are managed in Settings → Users & admins.
  let query = supabase.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false }).limit(200);
  if (q) {
    const term = q.replace(/[%,()]/g, "");
    query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
  }
  const [{ data: profiles }, { data: orders }] = await Promise.all([
    query,
    supabase.from("orders").select("user_id, total").in("status", ["paid", "processing", "shipped", "delivered"]),
  ]);
  const customers = (profiles ?? []) as ProfileRow[];

  const stats: Record<string, { count: number; spent: number }> = {};
  (orders ?? []).forEach((o) => {
    if (!o.user_id) return;
    stats[o.user_id] ??= { count: 0, spent: 0 };
    stats[o.user_id].count++;
    stats[o.user_id].spent += Number(o.total);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Customers</h1>
          <p className="mt-1 text-sm text-ink/60">
            {customers.length} customer{customers.length === 1 ? "" : "s"}
            {q && <> matching “{q}”</>} · Admins are listed under{" "}
            <Link href="/admin/settings" className="text-clay-700 underline underline-offset-2">Settings → Users &amp; admins</Link>
          </p>
        </div>
        <form className="w-full sm:w-auto"><input name="q" defaultValue={q} placeholder="Search name or email…" className="input sm:w-60" /></form>
      </div>
      <div className="card overflow-x-auto">
        <table className="table-x">
          <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Orders</th><th>Spent</th><th>Role</th></tr></thead>
          <tbody>
            {customers.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.full_name || "—"}</td>
                <td>{p.email}</td>
                <td>{formatDate(p.created_at)}</td>
                <td>{stats[p.id]?.count ?? 0}</td>
                <td>{formatPrice(stats[p.id]?.spent ?? 0)}</td>
                <td><RoleToggle userId={p.id} role="customer" isSelf={false} /></td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <Users className="mx-auto text-clay-300" size={32} />
                  <p className="mt-3 text-ink/60">{q ? "No customers match your search." : "No customers yet."}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
