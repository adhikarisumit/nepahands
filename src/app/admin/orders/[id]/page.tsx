import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import OrderDetail from "@/components/OrderDetail";
import OrderUpdateForm from "./OrderUpdateForm";
import BankPaymentReview from "./BankPaymentReview";
import { Mail, Phone } from "lucide-react";
import { formatBankAmount, formatRate, parseBankPayment } from "@/lib/bankCurrency";
import { PROVIDER_LABEL, type Order } from "@/lib/types";
import { formatDate, LOCALE, statusColor, STORE_TIMEZONE } from "@/lib/utils";

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

  const bank = order.payment_provider === "bank_transfer" ? parseBankPayment(order.payment_id) : null;
  const placed = new Date(order.created_at).toLocaleString(LOCALE, { dateStyle: "medium", timeStyle: "short", timeZone: STORE_TIMEZONE });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-clay-700 hover:underline">← Orders</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">Order #{order.order_number}</h1>
          <span className={`badge ${statusColor[order.status]}`}>{order.status}</span>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Placed {placed}
          {order.paid_at && ` · paid ${formatDate(order.paid_at)}`} · {order.payment_provider ? PROVIDER_LABEL[order.payment_provider] : "No payment method"}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a href={`mailto:${order.email}`} className="flex items-center gap-1.5 text-clay-700 hover:underline">
            <Mail size={14} /> {order.email}
          </a>
          {order.shipping_address?.phone && (
            <a href={`tel:${order.shipping_address.phone}`} className="flex items-center gap-1.5 text-clay-700 hover:underline">
              <Phone size={14} /> {order.shipping_address.phone}
            </a>
          )}
        </p>
      </div>
      {order.payment_provider === "bank_transfer" && (
        <BankPaymentReview
          id={order.id}
          orderNumber={order.order_number}
          code={bank?.code || `ORDER-${order.order_number}`}
          bankAmount={bank?.currency && bank.amount != null ? formatBankAmount(bank.amount, bank.currency) : null}
          bankRate={bank?.currency && bank.rate ? `1 ${order.currency} = ${formatRate(bank.rate)} ${bank.currency}` : null}
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
