import "server-only";
import { unstable_cache } from "next/cache";
import { CURRENCY } from "./utils";
import type { StoreSettings } from "./types";

export type BankFx = {
  /** Currency of the bank account, e.g. "NPR". */
  currency: string;
  /** 1 unit of store currency = `rate` units of bank currency. */
  rate: number;
  /** "manual" = fixed rate set by the admin; "live" = fetched exchange rate. */
  source: "manual" | "live";
  /** When the live rate was published (ISO date), if known. */
  asOf: string | null;
};

/**
 * Mid-market rate from free public sources (they publish once a day), cached for an hour.
 * Throws if no source answers, so a bad value is never cached.
 */
const fetchLiveRate = unstable_cache(
  async (from: string, to: string): Promise<{ rate: number; asOf: string | null }> => {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${f}`, { signal: AbortSignal.timeout(8000) });
      const json = await res.json();
      const rate = Number(json?.rates?.[t]);
      if (json?.result === "success" && rate > 0) {
        return { rate, asOf: json.time_last_update_utc ? new Date(json.time_last_update_utc).toISOString() : null };
      }
    } catch {
      /* fall through to the backup source */
    }
    const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${f.toLowerCase()}.json`, {
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    const rate = Number(json?.[f.toLowerCase()]?.[t.toLowerCase()]);
    if (!(rate > 0)) throw new Error(`No exchange rate available for ${f} → ${t}`);
    return { rate, asOf: json.date ? new Date(json.date).toISOString() : null };
  },
  ["fx-rate"],
  { revalidate: 3600 }
);

/** The bank account's currency from settings (defaults to the store currency). */
export function bankCurrency(settings: Pick<StoreSettings, "bank_details">) {
  const c = settings.bank_details?.currency?.trim().toUpperCase();
  return c && /^[A-Z]{3}$/.test(c) ? c : CURRENCY;
}

/**
 * Conversion for bank-transfer payments, or null when the bank account is in the store currency.
 * Uses the admin's fixed rate if set, otherwise the live rate. Throws if a live rate is needed
 * but can't be fetched.
 */
export async function getBankFx(settings: Pick<StoreSettings, "bank_details">): Promise<BankFx | null> {
  const currency = bankCurrency(settings);
  if (currency === CURRENCY) return null;
  const manual = Number(settings.bank_details?.manual_rate);
  if (manual > 0) return { currency, rate: manual, source: "manual", asOf: null };
  const live = await fetchLiveRate(CURRENCY, currency);
  return { currency, rate: live.rate, source: "live", asOf: live.asOf };
}

/** Live rate for display in admin settings (null if unavailable or same currency). */
export async function getLiveRate(to: string) {
  if (to.toUpperCase() === CURRENCY) return null;
  try {
    return await fetchLiveRate(CURRENCY, to);
  } catch {
    return null;
  }
}
