"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ExternalLink, FileText, Landmark, XCircle, ZoomIn } from "lucide-react";
import Modal from "@/components/Modal";
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
  const [viewing, setViewing] = useState(false);
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
          {!proofUrl && (
            <p className="pt-2 text-xs text-ink/50">
              The customer didn&apos;t upload a receipt. Look for the payment remark and transaction ID above on your bank statement.
            </p>
          )}
          {awaiting && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              A receipt can be edited or reused — always check the money has actually arrived in your bank account before confirming.
            </p>
          )}
        </dl>

        {/* Payment receipt */}
        {proofUrl && (
          <div className="w-full md:w-60">
            <p className="eyebrow mb-2">Payment receipt</p>
            {isPdf ? (
              <a
                href={proofUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-ink/10 bg-clay-50 text-sm text-clay-700 hover:border-ink/30"
              >
                <FileText size={30} /> Open PDF receipt
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setViewing(true)}
                className="group relative block w-full overflow-hidden rounded-lg border border-ink/10 bg-clay-50 hover:border-ink/30"
                title="View full size"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proofUrl} alt="Payment receipt uploaded by the customer" className="max-h-72 w-full object-contain" />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-ink/70 py-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  <ZoomIn size={13} /> View full size
                </span>
              </button>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {!isPdf && (
                <button type="button" onClick={() => setViewing(true)} className="flex items-center gap-1 text-clay-700 hover:underline">
                  <ZoomIn size={12} /> View full size
                </button>
              )}
              <a href={proofUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-clay-700 hover:underline">
                <ExternalLink size={12} /> Open in new tab
              </a>
            </div>
          </div>
        )}
      </div>

      {proofUrl && !isPdf && (
        <Modal open={viewing} onClose={() => setViewing(false)} title={`Payment receipt — order #${orderNumber}`} size="xl">
          <dl className="mb-4 grid gap-3 rounded-md bg-clay-50 p-3 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-ink/50">Expected amount</dt><dd className="font-semibold">{formatPrice(total, currency)}</dd></div>
            <div><dt className="text-xs text-ink/50">Payment remark</dt><dd className="font-mono">{code}</dd></div>
            <div><dt className="text-xs text-ink/50">Transaction ID</dt><dd className="break-all font-mono">{reference || "—"}</dd></div>
          </dl>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proofUrl} alt="Payment receipt uploaded by the customer" className="mx-auto max-h-[70vh] w-auto rounded-md border border-ink/10" />
        </Modal>
      )}
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
