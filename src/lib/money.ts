const ZERO_DECIMAL = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);

/** Converts a decimal amount to the smallest currency unit used by Stripe and Paddle. */
export function toMinor(amount: number, currency: string) {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100);
}

export function fromMinor(amount: number | string, currency: string) {
  const n = Number(amount);
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? n : n / 100;
}
