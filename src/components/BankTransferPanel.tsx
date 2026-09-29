import { Landmark } from "lucide-react";
import type { BankDetails } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import CopyButton from "./CopyButton";
import PaymentProofForm from "./PaymentProofForm";

type Props = {
  orderId: string;
  orderNumber: number;
  total: number;
  currency: string;
  bank: BankDetails;
  qrUrl: string | null;
  submittedReference: string | null;
  proofSubmitted: boolean;
};

export default function BankTransferPanel({ orderId, orderNumber, total, currency, bank, qrUrl, submittedReference, proofSubmitted }: Props) {
  const reference = `ORDER-${orderNumber}`;
  const rows: [string, string | undefined][] = [
    ["Bank", bank.bank_name],
    ["Account name", bank.account_name],
    ["Account number", bank.account_number],
    ["Branch", bank.branch],
    ["SWIFT / IFSC", bank.swift],
  ];

  return (
    <div className="card overflow-hidden text-left">
      <div className="flex items-center gap-3 border-b border-clay-100 bg-clay-50 px-4 py-4 sm:px-6">
        <Landmark size={20} className="text-clay-700" />
        <h2 className="text-lg font-semibold">Complete your payment</h2>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-clay-700 p-4 text-white">
              <p className="text-xs uppercase tracking-wide opacity-70">Amount to pay</p>
              <p className="mt-1 text-2xl font-bold">{formatPrice(total, currency)}</p>
            </div>
            <div className="rounded-xl border border-dashed border-clay-300 bg-clay-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink/50">Payment reference</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="break-all font-mono text-lg font-bold">{reference}</p>
                <CopyButton value={reference} />
              </div>
            </div>
          </div>

          <dl className="divide-y divide-clay-100 rounded-xl border border-clay-100">
            {rows
              .filter(([, v]) => v?.trim())
              .map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-ink/50">{label}</dt>
                  <dd className="flex min-w-0 items-center gap-2 break-all text-right font-medium">
                    {value}
                    <CopyButton value={value!} />
                  </dd>
                </div>
              ))}
          </dl>

          {bank.instructions && <p className="whitespace-pre-line text-sm text-ink/70">{bank.instructions}</p>}
          <p className="text-xs text-ink/50">Please use <strong>{reference}</strong> as the payment remark so we can match your transfer.</p>
        </div>

        {qrUrl && (
          <div className="flex flex-col items-center gap-2 md:order-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="Payment QR code" className="h-52 w-52 rounded-xl border border-clay-100 bg-white object-contain p-2" />
            <p className="text-xs text-ink/50">Scan to pay</p>
            <a href={qrUrl} download target="_blank" rel="noreferrer" className="text-xs text-clay-700 underline">Open QR image</a>
          </div>
        )}
      </div>

      <div className="border-t border-clay-100 bg-clay-50/60 p-4 sm:p-6">
        <PaymentProofForm orderId={orderId} submittedReference={submittedReference} proofSubmitted={proofSubmitted} />
      </div>
    </div>
  );
}
