import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CURRENCY, LOCALE, STORE_TIMEZONE } from "./utils";
import type { OrderStatus, ShippingAddress } from "./types";

export const RANGES = {
  "7d": { days: 7, label: "Last 7 days", bucket: "day" },
  "30d": { days: 30, label: "Last 30 days", bucket: "day" },
  "90d": { days: 90, label: "Last 90 days", bucket: "day" },
  "12m": { days: 365, label: "Last 12 months", bucket: "month" },
} as const;
export type RangeKey = keyof typeof RANGES;
export const isRange = (v: string | undefined): v is RangeKey => !!v && v in RANGES;

/** Statuses that count as a completed sale. */
export const SALE_STATUSES: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

type OrderRow = {
  id: string;
  order_number: number;
  created_at: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  currency: string;
  payment_provider: string | null;
  coupon_code: string | null;
  user_id: string | null;
  email: string;
  shipping_address: ShippingAddress;
  order_items: { product_id: string | null; name: string; quantity: number; price: number }[];
};

/** PostgREST returns at most 1,000 rows per request — page through everything. */
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const size = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return rows;
}

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: STORE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const toKey = (d: Date, bucket: "day" | "month") => {
  const k = dayKey.format(d); // YYYY-MM-DD in store timezone
  return bucket === "day" ? k : k.slice(0, 7);
};
const bucketLabel = (key: string, bucket: "day" | "month") => {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d ?? 1, 12));
  return date.toLocaleDateString(LOCALE, bucket === "day" ? { day: "numeric", month: "short", timeZone: "UTC" } : { month: "short", year: "2-digit", timeZone: "UTC" });
};

export type Metric = { current: number; previous: number; change: number | null };
const metric = (current: number, previous: number): Metric => ({
  current,
  previous,
  change: previous > 0 ? (current - previous) / previous : current > 0 ? null : 0,
});

export type Ranked = { key: string; label: string; value: number; secondary?: number };

const round2 = (n: number) => Math.round(n * 100) / 100;
const countryName = (() => {
  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames([LOCALE], { type: "region" });
  } catch {
    /* older runtimes */
  }
  return (code: string) => (code && dn ? (dn.of(code.toUpperCase()) ?? code) : code || "Unknown");
})();

function rank(map: Map<string, { label: string; value: number; secondary?: number }>, limit: number): Ranked[] {
  return [...map.entries()]
    .map(([key, v]) => ({ key, ...v, value: round2(v.value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export async function getAnalytics(supabase: SupabaseClient, range: RangeKey) {
  const { days, bucket } = RANGES[range];
  const now = new Date();
  const start = new Date(now.getTime() - days * 86_400_000);
  const prevStart = new Date(start.getTime() - days * 86_400_000);

  const [orders, firstOrders, newCustomers, prevNewCustomers] = await Promise.all([
    fetchAll<OrderRow>((from, to) =>
      supabase
        .from("orders")
        .select(
          "id, order_number, created_at, status, total, subtotal, discount, shipping, tax, currency, payment_provider, coupon_code, user_id, email, shipping_address, order_items(product_id, name, quantity, price)"
        )
        .gte("created_at", prevStart.toISOString())
        .order("created_at")
        .range(from, to)
    ),
    // Every completed sale ever (light columns) — to tell new buyers from returning ones
    fetchAll<{ user_id: string | null; email: string; created_at: string }>((from, to) =>
      supabase.from("orders").select("user_id, email, created_at").in("status", SALE_STATUSES).order("created_at").range(from, to)
    ),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer").gte("created_at", start.toISOString()),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .gte("created_at", prevStart.toISOString())
      .lt("created_at", start.toISOString()),
  ]);

  // Money metrics only include orders in the store currency (older orders may be in another currency).
  const inCurrency = orders.filter((o) => o.currency?.toUpperCase() === CURRENCY);
  const otherCurrencyCount = orders.length - inCurrency.length;
  const current = inCurrency.filter((o) => new Date(o.created_at) >= start);
  const previous = inCurrency.filter((o) => new Date(o.created_at) < start);
  const sales = (list: OrderRow[]) => list.filter((o) => SALE_STATUSES.includes(o.status));
  const cur = sales(current);
  const prev = sales(previous);

  const sum = (list: OrderRow[], f: (o: OrderRow) => number) => round2(list.reduce((s, o) => s + f(o), 0));
  const items = (list: OrderRow[]) => list.reduce((s, o) => s + o.order_items.reduce((n, i) => n + i.quantity, 0), 0);
  const revenueCur = sum(cur, (o) => Number(o.total));
  const revenuePrev = sum(prev, (o) => Number(o.total));
  const refunded = (list: OrderRow[]) => list.filter((o) => o.status === "refunded");

  const kpis = {
    revenue: metric(revenueCur, revenuePrev),
    orders: metric(cur.length, prev.length),
    aov: metric(cur.length ? round2(revenueCur / cur.length) : 0, prev.length ? round2(revenuePrev / prev.length) : 0),
    items: metric(items(cur), items(prev)),
    newCustomers: metric(newCustomers.count ?? 0, prevNewCustomers.count ?? 0),
    refunds: metric(sum(refunded(current), (o) => Number(o.total)), sum(refunded(previous), (o) => Number(o.total))),
  };

  // Time series (every bucket present, even with no sales)
  // Buckets start at the range start so every order counted in the KPIs also appears on the chart.
  const keys: string[] = [];
  if (bucket === "day") {
    for (let t = start.getTime(); t < now.getTime() + 86_400_000; t += 86_400_000) keys.push(toKey(new Date(Math.min(t, now.getTime())), "day"));
  } else {
    const first = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 15));
    for (let d = first; d <= now || toKey(d, "month") === toKey(now, "month"); d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 15))) {
      keys.push(toKey(d, "month"));
      if (keys.length > 14) break;
    }
  }
  const uniqueKeys = [...new Set(keys)];
  const series = new Map(uniqueKeys.map((k) => [k, { revenue: 0, orders: 0 }]));
  for (const o of cur) {
    const s = series.get(toKey(new Date(o.created_at), bucket));
    if (s) {
      s.revenue += Number(o.total);
      s.orders += 1;
    }
  }
  const timeline = uniqueKeys.map((k) => ({ key: k, label: bucketLabel(k, bucket), revenue: round2(series.get(k)!.revenue), orders: series.get(k)!.orders }));

  // Products & categories
  const productIds = [...new Set(cur.flatMap((o) => o.order_items.map((i) => i.product_id)).filter(Boolean))] as string[];
  const { data: productRows } = productIds.length
    ? await supabase.from("products").select("id, categories(name)").in("id", productIds)
    : { data: [] as { id: string; categories: { name: string } | null }[] };
  const categoryOf = new Map(
    ((productRows ?? []) as unknown as { id: string; categories: { name: string } | null }[]).map((p) => [p.id, p.categories?.name ?? "Uncategorised"])
  );

  const byProduct = new Map<string, { label: string; value: number; secondary: number }>();
  const byCategory = new Map<string, { label: string; value: number }>();
  for (const o of cur) {
    for (const i of o.order_items) {
      const key = i.product_id ?? `name:${i.name}`;
      const line = Number(i.price) * i.quantity;
      const p = byProduct.get(key) ?? { label: i.name, value: 0, secondary: 0 };
      p.value += line;
      p.secondary += i.quantity;
      byProduct.set(key, p);
      const cat = (i.product_id && categoryOf.get(i.product_id)) || "Uncategorised";
      const c = byCategory.get(cat) ?? { label: cat, value: 0 };
      c.value += line;
      byCategory.set(cat, c);
    }
  }

  // Payment methods, countries, coupons
  const providerLabel: Record<string, string> = { stripe: "Card (Stripe)", paddle: "Paddle", bank_transfer: "Bank transfer" };
  const byProvider = new Map<string, { label: string; value: number; secondary: number }>();
  const byCountry = new Map<string, { label: string; value: number; secondary: number }>();
  const byCoupon = new Map<string, { label: string; value: number; secondary: number }>();
  for (const o of cur) {
    const pk = o.payment_provider ?? "unknown";
    const p = byProvider.get(pk) ?? { label: providerLabel[pk] ?? "Unknown", value: 0, secondary: 0 };
    p.value += Number(o.total);
    p.secondary += 1;
    byProvider.set(pk, p);

    const cc = (o.shipping_address?.country ?? "").toUpperCase();
    const c = byCountry.get(cc) ?? { label: countryName(cc), value: 0, secondary: 0 };
    c.value += Number(o.total);
    c.secondary += 1;
    byCountry.set(cc, c);

    if (o.coupon_code) {
      const k = byCoupon.get(o.coupon_code) ?? { label: o.coupon_code, value: 0, secondary: 0 };
      k.value += Number(o.discount);
      k.secondary += 1;
      byCoupon.set(o.coupon_code, k);
    }
  }

  // Order status (all orders placed in the period)
  const statusCounts = new Map<string, { label: string; value: number }>();
  for (const o of current) {
    const s = statusCounts.get(o.status) ?? { label: o.status, value: 0 };
    s.value += 1;
    statusCounts.set(o.status, s);
  }

  // New vs returning buyers: based on each customer's first-ever completed order
  const firstSeen = new Map<string, number>();
  for (const o of firstOrders) {
    const k = o.user_id ?? o.email.toLowerCase();
    if (!firstSeen.has(k)) firstSeen.set(k, new Date(o.created_at).getTime());
  }
  const buyers = new Set(cur.map((o) => o.user_id ?? o.email.toLowerCase()));
  let newBuyers = 0;
  for (const b of buyers) if ((firstSeen.get(b) ?? 0) >= start.getTime()) newBuyers++;

  return {
    range,
    start,
    kpis,
    timeline,
    bucket,
    topProducts: rank(byProduct, 8),
    categories: rank(byCategory, 8),
    payments: rank(byProvider, 5),
    countries: rank(byCountry, 8),
    coupons: {
      totalDiscount: sum(cur, (o) => Number(o.discount)),
      ordersWithCoupon: cur.filter((o) => o.coupon_code).length,
      top: rank(byCoupon, 5),
    },
    statuses: rank(statusCounts, 10),
    buyers: { total: buyers.size, new: newBuyers, returning: buyers.size - newBuyers },
    otherCurrencyCount,
  };
}

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
