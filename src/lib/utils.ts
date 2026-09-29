import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY || "AUD").toUpperCase();

/** Number/date formatting follows the store currency: AUD → Australian style ($48.00, 29 Sept 2026). */
export const LOCALE = CURRENCY === "AUD" ? "en-AU" : "en-US";

/** Timezone used to group orders by day in Analytics (so "today" matches the store's local day). */
export const STORE_TIMEZONE = process.env.NEXT_PUBLIC_STORE_TIMEZONE || (CURRENCY === "AUD" ? "Australia/Sydney" : "UTC");

const priceFormatters = new Map<string, Intl.NumberFormat>();

export function formatPrice(amount: number | string, currency = CURRENCY) {
  // In the store's own currency show the local symbol ($); for any other currency (e.g. an old
  // order placed in USD) show an unambiguous symbol such as "US$".
  const key = currency.toUpperCase();
  let fmt = priceFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: key });
    priceFormatters.set(key, fmt);
  }
  return fmt.format(Number(amount));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString(LOCALE, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Public site address (used for Stripe return URLs). Set NEXT_PUBLIC_SITE_URL to your domain;
 * on Vercel it falls back to the project's production URL, then the deployment URL.
 */
export const siteUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    "http://localhost:3000";
  return url.replace(/\/$/, "");
};

export const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%23f5ece2'/><text x='50%' y='50%' font-family='serif' font-size='28' fill='%23c07c4d' text-anchor='middle' dominant-baseline='middle'>Handmade</text></svg>";

export const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-200 text-gray-700",
  refunded: "bg-red-100 text-red-800",
};
