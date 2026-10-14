"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CURRENCY } from "@/lib/utils";

/** Currencies shoppers can view prices in. Orders are always charged in the store currency. */
export const DISPLAY_CURRENCIES = [CURRENCY, "USD"].filter((c, i, a) => a.indexOf(c) === i);

type CurrencyState = {
  /** Currency the shopper chose to see prices in. */
  display: string;
  /** 1 store-currency unit = rates[code] units of that currency. */
  rates: Record<string, number>;
  fetchedAt: number;
  /** True once the saved choice has been read from localStorage (avoids hydration mismatches). */
  ready: boolean;
  setDisplay: (code: string) => void;
};

export const useCurrency = create<CurrencyState>()(
  persist(
    (set) => ({
      display: CURRENCY,
      rates: {},
      fetchedAt: 0,
      ready: false,
      setDisplay: (code) => set({ display: DISPLAY_CURRENCIES.includes(code) ? code : CURRENCY }),
    }),
    {
      name: "nepahands-currency",
      skipHydration: true,
      partialize: (s) => ({ display: s.display, rates: s.rates, fetchedAt: s.fetchedAt }),
    }
  )
);

const RATE_MAX_AGE = 60 * 60 * 1000;

let syncing: Promise<void> | null = null;

/** Restores the saved currency and keeps exchange rates fresh. Safe to call from several components. */
export function syncCurrency() {
  syncing ??= doSync();
  return syncing;
}

async function doSync() {
  await useCurrency.persist.rehydrate();
  useCurrency.setState({ ready: true });
  const { fetchedAt, rates } = useCurrency.getState();
  const missing = DISPLAY_CURRENCIES.some((c) => c !== CURRENCY && !rates[c]);
  if (!missing && Date.now() - fetchedAt < RATE_MAX_AGE) return;
  try {
    const res = await fetch("/api/fx");
    const json = (await res.json()) as { rates?: Record<string, number> };
    if (res.ok && json.rates && Object.keys(json.rates).length) {
      useCurrency.setState({ rates: { ...rates, ...json.rates }, fetchedAt: Date.now() });
    }
  } catch {
    /* keep the last known rates; without any, prices stay in the store currency */
  }
}
