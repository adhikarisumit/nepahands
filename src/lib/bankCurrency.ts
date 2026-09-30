// Bank-transfer currency helpers — pure functions, safe on server and client.
// The store sells in AUD, but the bank account may be in another currency (e.g. NPR).

/** Currencies normally paid in whole units (no cents). */
const WHOLE_UNIT = new Set(["NPR", "JPY", "KRW", "INR", "VND", "IDR", "PKR", "LKR", "BDT"]);

/**
 * Converts a store-currency amount to the bank currency. Rounds UP (whole units for NPR etc.,
 * otherwise cents) so the converted payment never falls short of the order total.
 */
export function convertForBank(amount: number, rate: number, currency: string) {
  const raw = amount * rate;
  return WHOLE_UNIT.has(currency.toUpperCase()) ? Math.ceil(raw - 1e-9) : Math.ceil(raw * 100 - 1e-9) / 100;
}

/** "NPR 4,612" / "USD 27.50" — always with the currency code so it can't be confused with AUD. */
export function formatBankAmount(amount: number, currency: string) {
  const c = currency.toUpperCase();
  const whole = WHOLE_UNIT.has(c);
  return `${c} ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 })}`;
}

export const formatRate = (rate: number) => rate.toLocaleString("en-US", { maximumFractionDigits: rate >= 10 ? 2 : 4 });

export type BankPayment = {
  /** Remark code the customer adds to the transfer, e.g. "NH-7K2QXM". */
  code: string;
  /** Set when the bank account's currency differs from the store currency. */
  currency?: string;
  amount?: number;
  rate?: number;
};

/**
 * Bank orders keep their remark code — and, for a foreign-currency account, the exact amount
 * and rate the customer was shown — in orders.payment_id as "CODE|CUR|AMOUNT|RATE".
 * (Older orders hold just the code, or nothing.)
 */
export function encodeBankPayment(p: BankPayment) {
  return p.currency && p.amount != null && p.rate != null ? `${p.code}|${p.currency.toUpperCase()}|${p.amount}|${p.rate}` : p.code;
}

export function parseBankPayment(paymentId: string | null | undefined): BankPayment | null {
  if (!paymentId) return null;
  const [code, currency, amount, rate] = paymentId.split("|");
  if (!code) return null;
  if (currency && Number(amount) > 0 && Number(rate) > 0) return { code, currency, amount: Number(amount), rate: Number(rate) };
  return { code };
}
