"use client";

import { QrCode, Upload, X } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import type { BankDetails } from "@/lib/types";

export type BankProof = { reference: string; file: File | null; paid: boolean };

type Props = {
  bank: BankDetails;
  qrUrl: string | null;
  /** Formatted amount to pay in the bank account's currency, e.g. "NPR 4,612" or "$56.00". */
  amount: string;
  /** Shown under the amount when it was converted, e.g. "= $42.94 AUD · 1 AUD = 107.39 NPR". */
  conversion?: string | null;
  /** Short code the customer puts in the transfer remark so the payment can be matched. */
  code: string;
  proof: BankProof;
  onChange: (p: BankProof) => void;
  /** Opens the full-size QR code popup. */
  onShowQr: () => void;
};

/** Pay-first bank transfer: pay with the details shown, then attach proof before placing the order. */
export default function BankPayFirst({ bank, qrUrl, amount, conversion, code, proof, onChange, onShowQr }: Props) {
  const rows: [string, string | undefined][] = [
    ["Bank", bank.bank_name],
    ["Account name", bank.account_name],
    ["Account number", bank.account_number],
    ["Branch", bank.branch],
    ["SWIFT / IFSC", bank.swift],
  ];

  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-ink/10">
      {/* Step 1 — pay */}
      <div className="p-4 sm:p-5">
        <Step n={1} title="Pay the exact amount" />
        <div className="mt-4 grid gap-5 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-clay-700 p-4 text-white">
                <p className="text-xs uppercase tracking-wide opacity-70">Amount to pay</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{amount}</p>
                {conversion && <p className="mt-1 text-xs tabular-nums opacity-80">{conversion}</p>}
              </div>
              <div className="rounded-lg border border-dashed border-clay-300 bg-clay-50 p-4">
                <p className="text-xs uppercase tracking-wide text-ink/50">Payment remark / reference</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-mono text-lg font-bold">{code}</p>
                  <CopyButton value={code} />
                </div>
              </div>
            </div>

            <dl className="divide-y divide-ink/10 rounded-lg border border-ink/10">
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
            <p className="text-xs text-ink/50">
              Add <strong className="text-ink/80">{code}</strong> as the remark on your transfer so we can match your payment.
            </p>
          </div>

          {qrUrl && (
            <button
              type="button"
              onClick={onShowQr}
              className="group flex flex-col items-center gap-2 self-start rounded-lg border border-ink/10 bg-white p-3 transition hover:border-clay-400"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="Payment QR code" className="h-28 w-28 object-contain" />
              <span className="flex items-center gap-1.5 text-xs font-medium text-clay-700 group-hover:underline">
                <QrCode size={14} /> Show QR code
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Step 2 — proof */}
      <div className="border-t border-ink/10 bg-clay-50/60 p-4 sm:p-5">
        <Step n={2} title="Add your proof of payment" />
        <p className="mt-1 text-sm text-ink/60">Enter the transaction ID from your bank or wallet, upload a screenshot of the payment — or both.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bank-reference">Transaction ID / reference</label>
            <input
              id="bank-reference"
              className="input"
              placeholder="e.g. TXN123456789"
              maxLength={120}
              value={proof.reference}
              onChange={(e) => onChange({ ...proof, reference: e.target.value })}
            />
          </div>
          <div>
            <span className="label">Payment screenshot</span>
            {proof.file ? (
              <div className="flex h-[42px] items-center justify-between gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm">
                <span className="truncate">{proof.file.name}</span>
                <button type="button" onClick={() => onChange({ ...proof, file: null })} className="shrink-0 text-ink/50 hover:text-ink" aria-label="Remove screenshot">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="btn-outline h-[42px] w-full cursor-pointer">
                <Upload size={16} /> Upload image or PDF
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => onChange({ ...proof, file: e.target.files?.[0] ?? null })}
                />
              </label>
            )}
            <p className="mt-1 text-xs text-ink/50">Max 4 MB.</p>
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-clay-700" checked={proof.paid} onChange={(e) => onChange({ ...proof, paid: e.target.checked })} />
          <span>
            I have paid <strong className="tabular-nums">{amount}</strong> to the account above.
          </span>
        </label>
      </div>
    </div>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">{n}</span>
      <h3 className="font-semibold">{title}</h3>
    </div>
  );
}
