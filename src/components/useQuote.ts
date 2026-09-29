"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/lib/types";

export type QuoteResult = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  coupon: { code: string; type: string; value: number } | null;
  couponError: string | null;
  error?: string;
};

/** Fetches server-side pricing (DB prices, shipping, tax, coupon) for the current cart. */
export function useQuote(items: CartItem[], coupon: string | null) {
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(items.map((i) => [i.id, i.quantity])) + (coupon ?? "");

  useEffect(() => {
    if (items.length === 0) return setQuote(null);
    const ctrl = new AbortController();
    setLoading(true);
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((i) => ({ id: i.id, quantity: i.quantity })), coupon }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then(setQuote)
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { quote, loading };
}
