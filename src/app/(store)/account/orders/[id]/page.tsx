import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import OrderDetail from "@/components/OrderDetail";
import BankTransferPanel from "@/components/BankTransferPanel";
import { getSettings } from "@/lib/settings";
import type { Order } from "@/lib/types";
import { cn, PLACEHOLDER_IMG } from "@/lib/utils";

export const metadata = { title: "Order details" };

const STEPS = [
  { key: "paid", label: "Confirmed" },
  { key: "processing", label: "Preparing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // RLS ensures customers can only read their own orders.
  const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const order = data as Order;
  const current = STEPS.findIndex((s) => s.key === order.status);
  const awaitingBank = order.payment_provider === "bank_transfer" && order.status === "pending";
  const settings = awaitingBank ? await getSettings() : null;

  // Once delivered, invite the customer to review each item (reviews require a delivered order).
  let reviewable: { id: string; name: string; slug: string; image: string | null; reviewed: boolean }[] = [];
  if (order.status === "delivered" && order.user_id) {
    const ids = [...new Set((order.order_items ?? []).map((i) => i.product_id).filter(Boolean))] as string[];
    if (ids.length) {
      const [{ data: products }, { data: mine }] = await Promise.all([
        supabase.from("products").select("id, slug").in("id", ids),
        supabase.from("reviews").select("product_id").eq("user_id", order.user_id).in("product_id", ids),
      ]);
      const reviewed = new Set((mine ?? []).map((r) => r.product_id));
      reviewable = (order.order_items ?? []).flatMap((item) => {
        const p = products?.find((x) => x.id === item.product_id);
        return p ? [{ id: p.id, name: item.name, slug: p.slug, image: item.image, reviewed: reviewed.has(p.id) }] : [];
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/account/orders" className="text-sm text-clay-700 hover:underline">← All orders</Link>
        <h2 className="mt-1 text-2xl font-semibold">Order #{order.order_number}</h2>
      </div>

      {awaitingBank && settings && (
        <BankTransferPanel
          orderId={order.id}
          orderNumber={order.order_number}
          total={Number(order.total)}
          currency={order.currency}
          bank={settings.bank_details ?? {}}
          qrUrl={settings.bank_qr_url ?? null}
          submittedReference={order.payment_reference ?? null}
          proofSubmitted={!!order.payment_proof_path}
        />
      )}

      {current >= 0 && (
        <div className="card px-3 py-5 sm:p-6">
          <ol className="flex items-center">
            {STEPS.map((s, i) => (
              <li key={s.key} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                <div className="flex flex-col items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium sm:h-9 sm:w-9",
                      i <= current ? "bg-clay-700 text-white" : "bg-clay-100 text-ink/40"
                    )}
                  >
                    {i <= current ? <Check size={16} /> : i + 1}
                  </span>
                  <span className={cn("text-[11px] sm:text-xs", i <= current ? "font-medium text-ink" : "text-ink/40")}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("mx-1 mb-6 h-0.5 flex-1 rounded sm:mx-2", i < current ? "bg-clay-700" : "bg-clay-100")} />
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {reviewable.length > 0 && (
        <div className="card p-5 sm:p-6">
          <h3 className="font-semibold">How was your order?</h3>
          <p className="mt-1 text-sm text-ink/60">Your order has been delivered — reviews help other shoppers and the artisans who made your pieces.</p>
          <ul className="mt-4 divide-y divide-ink/10">
            {reviewable.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image || PLACEHOLDER_IMG} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                {p.reviewed ? (
                  <span className="flex items-center gap-1 text-xs text-sage-600"><Check size={14} /> Reviewed</span>
                ) : (
                  <Link href={`/product/${p.slug}#reviews`} className="btn-outline shrink-0 px-4 py-2 text-xs">
                    <Star size={14} /> Write a review
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <OrderDetail order={order} />
    </div>
  );
}
