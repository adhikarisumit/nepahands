"use client";

import { useTransition } from "react";
import { CheckCircle2, FileText, Landmark, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { confirmBankPayment, updateOrder } from "../../actions";
import { useConfirm } from "@/components/ConfirmDialog";
import type { OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

type Props = {
  id: string;
  orderNumber: number;
  /** Remark code shown to the customer at checkout (older orders used ORDER-<number>). */
  code: string;
  status: OrderStatus;
  total: number;
  currency: string;
  reference: string | null;
  proofUrl: string | null;
  isPdf: boolean;
};

export default function BankPaymentReview({ id, orderNumber, code, status, total, currency, reference, proofUrl, isPdf }: Props) {
  const [pending, start] = useTransition();
  const confirm = useConfirm();
  const awaiting = status === "pending";

  return (
    <div className={`card overflow-hidden ${awaiting ? "border-yellow-300" : ""}`}>
      <div className={`flex items-center gap-3 px-5 py-3 ${awaiting ? "bg-yellow-50" : "bg-green-50"}`}>
        <Landmark size={18} className={awaiting ? "text-yellow-700" : "text-green-700"} />
        <p className="font-semibold">{awaiting ? "Bank transfer — awaiting payment confirmation" : "Bank transfer — payment confirmed"}</p>
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto]">
        <dl className="space-y-2 text-sm">
          <div className="flex flex-col sm:flex-row sm:gap-2"><dt className="text-ink/50 sm:w-40">Expected amount</dt><dd className="font-semibold">{formatPrice(total, currency)}</dd></div>
          <div className="flex flex-col sm:flex-row sm:gap-2"><dt className="text-ink/50 sm:w-40">Payment remark to look for</dt><dd className="font-mono font-semibold">{code}</dd></div>
          <div className="flex flex-col sm:flex-row sm:gap-2">
            <dt className="text-ink/50 sm:w-40">Customer&apos;s transaction ID</dt>
            <dd className="font-mono">{reference || <span className="font-sans text-ink/40">Not submitted</span>}</dd>
          </div>
          {!proofUrl && <p className="pt-2 text-xs text-ink/50">No screenshot uploaded yet. Check your bank statement for the reference above.</p>}
        </dl>
        {proofUrl && (
          <a href={proofUrl} target="_blank" rel="noreferrer" className="group block" title="Open full size">
            {isPdf ? (
              <span className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-xl border border-clay-100 text-sm text-clay-700">
                <FileText size={28} /> View PDF
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proofUrl} alt="Payment proof" className="h-40 w-40 rounded-xl border border-clay-100 object-cover transition group-hover:opacity-90" />
            )}
            <span className="mt-1 block text-center text-xs text-ink/50">Payment proof</span>
          </a>
        )}
      </div>
      {awaiting && (
        <div className="flex flex-wrap gap-2 border-t border-clay-100 p-5">
          <button
            className="btn-primary"
            disabled={pending}
            onClick={async () => {
              const ok = await confirm({
                title: "Confirm payment received?",
                message: (
                  <>
                    Only confirm once <strong className="text-ink">{formatPrice(total, currency)}</strong> with reference{" "}
                    <span className="font-mono text-ink">{code}</span> is in your bank account. The order is marked paid and stock is
                    reduced.
                  </>
                ),
                confirmLabel: "Yes, payment received",
              });
              if (!ok) return;
              start(async () => {
                const res = await confirmBankPayment(id);
                if (res.error) toast.error(res.error);
                else toast.success("Payment confirmed — order marked as paid");
              });
            }}
          >
            <CheckCircle2 size={16} /> Confirm payment received
          </button>
          <button
            className="btn-outline text-red-700"
            disabled={pending}
            onClick={async () => {
              const ok = await confirm({
                title: `Cancel order #${orderNumber}?`,
                message: "Use this if you can't find the payment in your bank account. The order is marked cancelled. If the customer did pay, refund them from your bank.",
                confirmLabel: "Cancel order",
                cancelLabel: "Keep order",
                danger: true,
              });
              if (!ok) return;
              const fd = new FormData();
              fd.set("status", "cancelled");
              start(async () => {
                const res = await updateOrder(id, fd);
                if (res.error) toast.error(res.error);
                else toast.success("Order cancelled");
              });
            }}
          >
            <XCircle size={16} /> Cancel order
          </button>
        </div>
      )}
    </div>
  );
}
