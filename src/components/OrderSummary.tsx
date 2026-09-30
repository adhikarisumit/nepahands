"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useCart, cartSubtotal } from "@/store/cart";
import { CURRENCY, formatPrice } from "@/lib/utils";
import type { QuoteResult } from "./useQuote";

type Props = {
  quote: QuoteResult | null;
  loading: boolean;
  /** Rendered under the total, e.g. the checkout button and trust notes. */
  footer?: React.ReactNode;
  /** The total in another currency when the customer pays that way (e.g. bank transfer in NPR). */
  converted?: { amount: string; note: string } | null;
};

export default function OrderSummary({ quote, loading, footer, converted }: Props) {
  const { items, coupon, setCoupon } = useCart();
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const subtotal = quote?.subtotal ?? cartSubtotal(items);

  const applyCode = () => {
    if (!code.trim()) return;
    setCoupon(code.trim().toUpperCase());
    setCode("");
    setShowCode(false);
  };

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 sm:p-6">
      <h2 className="eyebrow">Order summary</h2>

      <dl className="mt-5 space-y-3 text-sm">
        <Row label="Subtotal" value={formatPrice(subtotal)} />
        {!!quote?.discount && (
          <Row label={`Discount${quote.coupon ? ` (${quote.coupon.code})` : ""}`} value={`−${formatPrice(quote.discount)}`} valueClass="text-sage-600" />
        )}
        <Row label="Shipping" value={!quote ? "—" : quote.shipping === 0 ? "Free" : formatPrice(quote.shipping)} />
        {!!quote?.tax && <Row label="Tax" value={formatPrice(quote.tax)} />}
      </dl>

      {/* Discount code: collapsed by default, like most established stores */}
      <div className="mt-4 border-t border-ink/10 pt-4 text-sm">
        {coupon ? (
          <div className="flex items-center justify-between gap-3">
            <span>
              Code <span className="font-mono font-medium">{coupon}</span>
              {quote?.couponError ? <span className="block text-xs text-red-700">{quote.couponError}</span> : <span className="text-ink/50"> applied</span>}
            </span>
            <button type="button" onClick={() => setCoupon(null)} className="flex items-center gap-1 text-ink/50 hover:text-ink" aria-label="Remove discount code">
              <X size={14} /> Remove
            </button>
          </div>
        ) : showCode ? (
          // Not a <form>: this summary renders inside the checkout form, and forms can't be nested.
          <div className="flex gap-2">
            <input
              className="input py-2"
              placeholder="Discount code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyCode();
                }
                if (e.key === "Escape") setShowCode(false);
              }}
            />
            <button type="button" className="btn-outline shrink-0 py-2" onClick={applyCode}>Apply</button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowCode(true)} className="text-ink/70 underline underline-offset-4 hover:text-ink">
            Add a discount code
          </button>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-4">
        <span className="font-medium">Total</span>
        <span className={`text-xl font-semibold tabular-nums transition-opacity ${loading ? "opacity-40" : ""}`}>
          <span className="mr-1.5 align-middle text-xs font-normal text-ink/50">{CURRENCY}</span>
          {formatPrice(quote?.total ?? subtotal)}
        </span>
      </div>
      {converted && quote && (
        <div className={`mt-3 rounded-md bg-clay-50 px-3 py-2.5 transition-opacity ${loading ? "opacity-40" : ""}`}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">You pay</span>
            <span className="text-lg font-semibold tabular-nums">{converted.amount}</span>
          </div>
          <p className="mt-0.5 text-right text-xs text-ink/50">{converted.note}</p>
        </div>
      )}
      {quote && !quote.tax && <p className="mt-1 text-right text-xs text-ink/50">Taxes, if any, are shown at payment.</p>}
      {quote?.error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{quote.error}</p>}

      {footer && <div className="mt-5">{footer}</div>}
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/60">{label}</dt>
      <dd className={`tabular-nums ${valueClass ?? ""}`}>{value}</dd>
    </div>
  );
}
