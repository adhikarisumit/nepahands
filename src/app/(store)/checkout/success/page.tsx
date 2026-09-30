import Link from "next/link";
import { CheckCircle2, Clock, Download } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmPaddleTransaction, confirmStripeSession } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import BankTransferPanel from "@/components/BankTransferPanel";
import { formatBankAmount, parseBankPayment } from "@/lib/bankCurrency";
import type { Order, StoreSettings } from "@/lib/types";
import ClearCart from "./ClearCart";

export const metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

type SP = Promise<{ order?: string; session_id?: string; ptxn?: string; _ptxn?: string }>;

export default async function SuccessPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const db = createAdminClient();

  if (!sp.order || !/^[0-9a-f-]{36}$/i.test(sp.order)) {
    return <Message title="Order not found" text="We couldn't find that order." />;
  }

  const load = async () => (await db.from("orders").select("*").eq("id", sp.order!).maybeSingle()).data as Order | null;
  let order = await load();
  if (!order) return <Message title="Order not found" text="We couldn't find that order." />;

  // Fallback in case the webhook hasn't arrived yet (e.g. local development).
  if (order.status === "pending" && order.payment_provider !== "bank_transfer") {
    try {
      if (order.payment_provider === "stripe" && sp.session_id) await confirmStripeSession(sp.session_id);
      const txn = sp.ptxn || sp._ptxn;
      if (order.payment_provider === "paddle" && txn && txn === order.payment_id) await confirmPaddleTransaction(txn);
    } catch (e) {
      console.error("Payment confirmation fallback failed", e);
    }
    order = (await load()) ?? order;
  }

  const paid = order.status !== "pending" && order.status !== "cancelled";

  // Bank transfer (pay-first): the customer has paid and attached proof — we're verifying it.
  const hasProof = !!(order.payment_reference || order.payment_proof_path);
  const bank = order.payment_provider === "bank_transfer" ? parseBankPayment(order.payment_id) : null;
  if (order.payment_provider === "bank_transfer" && order.status === "pending" && hasProof) {
    return (
      <div className="container-x py-16">
        <div className="card mx-auto max-w-lg p-8 text-center sm:p-10">
          <Clock className="mx-auto text-clay-600" size={52} strokeWidth={1.5} />
          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">Order received — verifying your payment</h1>
          <p className="mt-3 text-ink/70">
            Thanks! Order <strong className="text-ink">#{order.order_number}</strong> is in. We&apos;ll check your transfer and confirm the order as soon as
            the payment shows in our account.
          </p>
          <dl className="mx-auto mt-6 max-w-xs space-y-2 rounded-lg bg-clay-50 p-4 text-left text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Amount paid</dt>
              <dd className="text-right font-semibold tabular-nums">
                {bank?.currency && bank.amount != null ? formatBankAmount(bank.amount, bank.currency) : formatPrice(order.total, order.currency)}
                {bank?.currency && (
                  <span className="block text-xs font-normal text-ink/50">= {formatPrice(order.total, order.currency)} {order.currency}</span>
                )}
              </dd>
            </div>
            {bank?.code && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink/60">Payment remark</dt>
                <dd className="font-mono">{bank.code}</dd>
              </div>
            )}
            {order.payment_reference && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink/60">Transaction ID</dt>
                <dd className="break-all text-right font-mono">{order.payment_reference}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Screenshot</dt>
              <dd>{order.payment_proof_path ? "Received" : "Not provided"}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-ink/50">You can follow the status, or add a missing screenshot, under My orders.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/shop" className="btn-outline">Keep shopping</Link>
            <Link href={`/account/orders/${order.id}`} className="btn-primary">View order</Link>
          </div>
        </div>
      </div>
    );
  }

  // Older bank-transfer orders placed before pay-first: show bank details, QR and proof upload.
  if (order.payment_provider === "bank_transfer" && order.status === "pending") {
    const { data: settings } = await db.from("store_settings").select("*").eq("id", 1).single();
    const s = (settings ?? {}) as StoreSettings;
    return (
      <div className="container-x max-w-3xl py-14">
        <div className="mb-8 text-center">
          <CheckCircle2 className="mx-auto text-sage-600" size={52} />
          <h1 className="mt-4 text-3xl font-semibold">Order #{order.order_number} placed!</h1>
          <p className="mt-2 text-ink/70">
            Transfer the amount below and we&apos;ll ship as soon as your payment is confirmed. Pay soon — items aren&apos;t held until payment arrives.
          </p>
        </div>
        <BankTransferPanel
          orderId={order.id}
          orderNumber={order.order_number}
          total={Number(order.total)}
          currency={order.currency}
          bank={s.bank_details ?? {}}
          qrUrl={s.bank_qr_url ?? null}
          submittedReference={order.payment_reference ?? null}
          proofSubmitted={!!order.payment_proof_path}
        />
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/shop" className="btn-outline">Keep shopping</Link>
          <Link href="/account/orders" className="btn-primary">View my orders</Link>
        </div>
        <p className="mt-4 text-center text-xs text-ink/50">Bookmark this page — you can come back to it to submit your payment proof.</p>
      </div>
    );
  }

  return (
    <div className="container-x py-20">
      {paid && <ClearCart />}
      <div className="card mx-auto max-w-lg p-10 text-center">
        {paid ? <CheckCircle2 className="mx-auto text-sage-600" size={56} /> : <Clock className="mx-auto text-clay-500" size={56} />}
        <h1 className="mt-4 text-3xl font-semibold">{paid ? "Thank you for your order!" : "Payment processing"}</h1>
        <p className="mt-3 text-ink/70">
          {paid
            ? `Order #${order.order_number} is confirmed. You can track it any time under My orders.`
            : `We're waiting for payment confirmation for order #${order.order_number}. Refresh this page in a moment.`}
        </p>
        <p className="mt-6 text-2xl font-semibold">{formatPrice(order.total, order.currency)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-outline">Keep shopping</Link>
          <Link href="/account" className="btn-primary">View my orders</Link>
        </div>
        {paid && (
          <a href={`/api/orders/${order.id}/receipt`} download className="mt-4 inline-flex items-center gap-1.5 text-sm text-clay-700 underline underline-offset-4">
            <Download size={14} /> Download receipt (PDF)
          </a>
        )}
      </div>
    </div>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <div className="container-x py-24 text-center">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-3 text-ink/60">{text}</p>
      <Link href="/shop" className="btn-primary mt-8">Back to shop</Link>
    </div>
  );
}
