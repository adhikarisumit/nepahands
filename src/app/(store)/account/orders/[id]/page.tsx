import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, Download, ExternalLink, FileText, Star } from "lucide-react";
import PaymentProofForm from "@/components/PaymentProofForm";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SALE_STATUSES } from "@/lib/analytics";
import OrderDetail from "@/components/OrderDetail";
import BankTransferPanel from "@/components/BankTransferPanel";
import { getSettings } from "@/lib/settings";
import type { Order } from "@/lib/types";
import { cn, formatPrice, PLACEHOLDER_IMG } from "@/lib/utils";
import { formatBankAmount, parseBankPayment } from "@/lib/bankCurrency";

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
  const hasProof = !!(order.payment_reference || order.payment_proof_path);
  const bank = order.payment_provider === "bank_transfer" ? parseBankPayment(order.payment_id) : null;
  const settings = awaitingBank && !hasProof ? await getSettings() : null;
  // A receipt exists once payment is confirmed (paid / processing / shipped / delivered).
  const isPaid = SALE_STATUSES.includes(order.status);

  // While payment is being verified, let the customer see the proof they uploaded. The file is in a
  // private bucket; RLS above already proved this order is theirs, so hand out a short-lived link.
  let proofUrl: string | null = null;
  if (awaitingBank && order.payment_proof_path) {
    const { data: signed } = await createAdminClient().storage.from("payment-proofs").createSignedUrl(order.payment_proof_path, 60 * 30);
    proofUrl = signed?.signedUrl ?? null;
  }
  const proofIsPdf = order.payment_proof_path?.endsWith(".pdf") ?? false;

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/account/orders" className="text-sm text-clay-700 hover:underline">← All orders</Link>
          <h2 className="mt-1 text-2xl font-semibold">Order #{order.order_number}</h2>
        </div>
        {isPaid && (
          <a href={`/api/orders/${order.id}/receipt`} className="btn-outline" download>
            <Download size={16} /> Download receipt (PDF)
          </a>
        )}
      </div>

      {isPaid && order.payment_provider === "bank_transfer" && (
        <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <Check size={16} className="shrink-0" /> Your payment has been confirmed. You can download your receipt above.
        </p>
      )}

      {/* Pay-first bank transfer: already paid with proof attached — waiting for us to verify it. */}
      {awaitingBank && hasProof && (
        <div className="card overflow-hidden border-amber-200">
          <div className="flex items-center gap-3 bg-amber-50 px-5 py-3 text-amber-900">
            <Clock size={18} />
            <p className="font-semibold">We&apos;re verifying your payment</p>
          </div>
          <div className="space-y-4 p-5">
            <p className="text-sm text-ink/70">
              Your order will be confirmed as soon as the transfer shows in our account. You don&apos;t need to do anything else.
            </p>
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-ink/50">Amount paid</dt>
                <dd className="font-medium tabular-nums">
                  {bank?.currency && bank.amount != null ? formatBankAmount(bank.amount, bank.currency) : formatPrice(order.total, order.currency)}
                </dd>
              </div>
              {bank?.code && (
                <div>
                  <dt className="text-ink/50">Payment remark</dt>
                  <dd className="font-mono">{bank.code}</dd>
                </div>
              )}
              <div>
                <dt className="text-ink/50">Transaction ID</dt>
                <dd className="break-all font-mono">{order.payment_reference || "—"}</dd>
              </div>
              <div>
                <dt className="text-ink/50">Screenshot</dt>
                <dd>{order.payment_proof_path ? "Received" : "Not provided"}</dd>
              </div>
            </dl>

            {/* The proof the customer uploaded, so they can check the right file went through */}
            {proofUrl && (
              <div className="border-t border-ink/10 pt-4">
                <p className="text-sm font-semibold">Your uploaded payment receipt</p>
                <div className="mt-3 flex flex-wrap items-start gap-4">
                  {proofIsPdf ? (
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-lg border border-ink/10 bg-clay-50 text-xs text-clay-700 hover:border-ink/30"
                    >
                      <FileText size={26} /> PDF receipt
                    </a>
                  ) : (
                    <a href={proofUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-ink/10 bg-clay-50 hover:border-ink/30" title="Open full size">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={proofUrl} alt="The payment receipt you uploaded" className="max-h-56 w-auto max-w-[220px] object-contain" />
                    </a>
                  )}
                  <div className="text-sm text-ink/60">
                    <a href={proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-clay-700 hover:underline">
                      <ExternalLink size={14} /> View full size
                    </a>
                    <p className="mt-2 max-w-xs text-xs">
                      Uploaded the wrong file? Use the form below to replace it. Your store receipt (PDF) becomes available here once we confirm the payment.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="border-t border-ink/10 pt-4">
              <PaymentProofForm orderId={order.id} submittedReference={order.payment_reference ?? null} proofSubmitted={!!order.payment_proof_path} />
            </div>
          </div>
        </div>
      )}

      {/* Older orders placed before pay-first: still show how to pay. */}
      {awaitingBank && !hasProof && settings && (
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
