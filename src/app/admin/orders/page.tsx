import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { cn, formatDate, formatPrice, statusColor } from "@/lib/utils";
import { Hash, Paperclip } from "lucide-react";
import { ORDER_STATUSES, PROVIDER_LABEL, type Order } from "@/lib/types";
import OrderRow from "./OrderRow";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 25;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const page = Math.max(1, Number(sp.page) || 1);

  let query = supabase.from("orders").select("*, order_items(quantity)", { count: "exact" }).order("created_at", { ascending: false });
  if (sp.status && ORDER_STATUSES.includes(sp.status as never)) query = query.eq("status", sp.status);
  if (sp.q) {
    const q = sp.q.replace(/[%,()#]/g, "").trim();
    query = /^\d+$/.test(q) ? query.eq("order_number", Number(q)) : query.ilike("email", `%${q}%`);
  }
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  const orders = (data as Order[]) ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const href = (changes: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...changes }).filter(([, v]) => v) as [string, string][]);
    return `/admin/orders?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Orders</h1>
        <form className="w-full sm:w-auto">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input name="q" defaultValue={sp.q} placeholder="Order # or email…" className="input sm:w-60" />
        </form>
      </div>
      <div className="flex flex-wrap gap-2">
        {[undefined, ...ORDER_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={href({ status: s, page: undefined })}
            className={cn("badge px-3 py-1.5", sp.status === s || (!sp.status && !s) ? "bg-clay-700 text-white" : "bg-white text-ink/70 hover:bg-clay-100")}
          >
            {s ?? "All"}
          </Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="table-x">
          <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th>Status</th><th className="text-right">Total</th><th></th></tr></thead>
          <tbody>
            {orders.map((o) => {
              const hasReceipt = !!o.payment_proof_path;
              const hasReference = !!o.payment_reference;
              const needsCheck = o.payment_provider === "bank_transfer" && o.status === "pending";
              return (
                <OrderRow key={o.id} href={`/admin/orders/${o.id}`} number={o.order_number}>
                  <td className="whitespace-nowrap">{formatDate(o.created_at)}</td>
                  <td>
                    <div className="max-w-48 truncate">{o.shipping_address?.full_name}</div>
                    <div className="max-w-48 truncate text-xs text-ink/50">{o.email}</div>
                  </td>
                  <td>{o.order_items?.reduce((n, i) => n + i.quantity, 0) ?? 0}</td>
                  <td>
                    <div>{o.payment_provider ? PROVIDER_LABEL[o.payment_provider] : "—"}</div>
                    {o.payment_provider === "bank_transfer" && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-ink/50">
                        {hasReceipt ? (
                          <><Paperclip size={12} /> Receipt attached</>
                        ) : hasReference ? (
                          <><Hash size={12} /> Transaction ID only</>
                        ) : (
                          "No proof yet"
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${statusColor[o.status]}`}>{o.status}</span>
                    {needsCheck && <div className="mt-1 text-xs font-medium text-amber-700">Needs verification</div>}
                  </td>
                  <td className="text-right font-medium tabular-nums">{formatPrice(o.total, o.currency)}</td>
                </OrderRow>
              );
            })}
            {orders.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-ink/50">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <Link href={href({ page: String(page - 1) })} className="btn-outline">Previous</Link>}
          <span className="self-center text-sm text-ink/60">Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={href({ page: String(page + 1) })} className="btn-outline">Next</Link>}
        </div>
      )}
    </div>
  );
}
