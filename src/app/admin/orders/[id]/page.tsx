import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import OrderDetail from "@/components/OrderDetail";
import OrderUpdateForm from "./OrderUpdateForm";
import BankPaymentReview from "./BankPaymentReview";
import type { Order } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const order = data as Order;

  // Payment screenshots live in a private bucket; give the admin a short-lived link.
  let proofUrl: string | null = null;
  if (order.payment_proof_path) {
    const { data: signed } = await createAdminClient().storage.from("payment-proofs").createSignedUrl(order.payment_proof_path, 60 * 30);
    proofUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-clay-700 hover:underline">← Orders</Link>
        <h1 className="mt-1 text-3xl font-semibold">Order #{order.order_number}</h1>
        <p className="text-sm text-ink/60">
          {order.email} · placed {formatDate(order.created_at)}
          {order.paid_at && ` · paid ${formatDate(order.paid_at)}`}
          {order.payment_id && <> · <span className="font-mono text-xs">{order.payment_id}</span></>}
        </p>
      </div>
      {order.payment_provider === "bank_transfer" && (
        <BankPaymentReview
          id={order.id}
          orderNumber={order.order_number}
          status={order.status}
          total={Number(order.total)}
          currency={order.currency}
          reference={order.payment_reference ?? null}
          proofUrl={proofUrl}
          isPdf={order.payment_proof_path?.endsWith(".pdf") ?? false}
        />
      )}
      <OrderUpdateForm id={order.id} status={order.status} tracking={order.tracking_number ?? ""} />
      <OrderDetail order={order} />
    </div>
  );
}
