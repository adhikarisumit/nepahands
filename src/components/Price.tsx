"use client";

import { useCallback } from "react";
import { useCurrency } from "@/store/currency";
import { CURRENCY, formatPrice } from "@/lib/utils";

/**
 * Formats store-currency amounts in the shopper's chosen display currency.
 * Falls back to the store currency until the choice and rate are known.
 */
export function useFormatPrice() {
  const display = useCurrency((s) => (s.ready ? s.display : CURRENCY));
  const rate = useCurrency((s) => s.rates[s.display]);
  const converted = display !== CURRENCY && rate > 0;
  const format = useCallback(
    (amount: number | string) => (converted ? formatPrice(Number(amount) * rate, display) : formatPrice(amount)),
    [converted, rate, display]
  );
  return { format, converted, display };
}

/** A price in the shopper's display currency. `amount` is always in the store currency. */
export default function Price({ amount }: { amount: number | string }) {
  const { format } = useFormatPrice();
  return <>{format(amount)}</>;
}
