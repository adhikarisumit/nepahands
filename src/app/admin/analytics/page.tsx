import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Download, Minus } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { getAnalytics, isRange, RANGES, type Metric, type RangeKey } from "@/lib/analytics";
import { cn, CURRENCY, formatPrice } from "@/lib/utils";
import TrendChart from "./TrendChart";
import BarList from "./BarList";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: r } = await searchParams;
  const range: RangeKey = isRange(r) ? r : "30d";
  const { supabase } = await requireAdmin();
  const a = await getAnalytics(supabase, range);
  const money = (v: number) => formatPrice(v);
  const count = (v: number) => v.toLocaleString();

  return (
    <div className="space-y-6">
      {/* Header + filters in one row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <p className="mt-1 text-sm text-ink/60">
            {RANGES[range].label} compared with the previous {RANGES[range].days} days · amounts in {CURRENCY}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Date range" className="inline-flex rounded-md border border-ink/15 bg-white p-0.5">
            {(Object.keys(RANGES) as RangeKey[]).map((k) => (
              <Link
                key={k}
                href={`/admin/analytics?range=${k}`}
                aria-current={k === range ? "page" : undefined}
                className={cn("rounded px-3 py-1.5 text-xs font-medium transition-colors", k === range ? "bg-ink text-white" : "text-ink/60 hover:text-ink")}
              >
                {k === "12m" ? "12 months" : k.replace("d", " days")}
              </Link>
            ))}
          </nav>
          <a href={`/api/admin/export/orders?range=${range}`} className="btn-outline py-2 text-xs">
            <Download size={14} /> Export CSV
          </a>
        </div>
      </div>

      {a.otherCurrencyCount > 0 && (
        <p className="rounded-md bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {a.otherCurrencyCount} older order{a.otherCurrencyCount === 1 ? " was" : "s were"} placed in another currency and{" "}
          {a.otherCurrencyCount === 1 ? "is" : "are"} excluded from the money figures.
        </p>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Revenue" m={a.kpis.revenue} format={money} />
        <Kpi label="Orders" m={a.kpis.orders} format={count} />
        <Kpi label="Avg. order value" m={a.kpis.aov} format={money} />
        <Kpi label="Items sold" m={a.kpis.items} format={count} />
        <Kpi label="New customers" m={a.kpis.newCustomers} format={count} hint="Accounts created" />
        <Kpi label="Refunds" m={a.kpis.refunds} format={money} invert />
      </div>

      {/* Trend */}
      <div className="card p-5 sm:p-6">
        <TrendChart data={a.timeline} />
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="Top products" items={a.topProducts} format={money} secondary={(n) => `${n} sold`} />
        <BarList title="Sales by category" items={a.categories} format={money} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BarList title="Payment methods" items={a.payments} format={money} secondary={(n) => `${n} order${n === 1 ? "" : "s"}`} />
        <BarList title="Top countries" items={a.countries} format={money} secondary={(n) => `${n} order${n === 1 ? "" : "s"}`} />
        <BarList title="Orders by status" items={a.statuses} format={count} empty="No orders in this period." />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Customers */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold">Customers who bought</h3>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{a.buyers.total}</p>
          {a.buyers.total > 0 ? (
            <>
              <div className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full">
                <div className="bg-clay-700" style={{ width: `${(a.buyers.new / a.buyers.total) * 100}%` }} title={`New: ${a.buyers.new}`} />
                <div className="bg-clay-300" style={{ width: `${(a.buyers.returning / a.buyers.total) * 100}%` }} title={`Returning: ${a.buyers.returning}`} />
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-clay-700" /> First-time <span className="tabular-nums text-ink/60">{a.buyers.new}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-clay-300" /> Returning <span className="tabular-nums text-ink/60">{a.buyers.returning}</span>
                </li>
              </ul>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink/50">No purchases in this period.</p>
          )}
        </div>

        {/* Coupons */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold">Discount codes</h3>
          <div className="mt-3 flex flex-wrap gap-8">
            <div>
              <p className="text-3xl font-semibold tabular-nums">{formatPrice(a.coupons.totalDiscount)}</p>
              <p className="text-xs text-ink/50">Total discount given</p>
            </div>
            <div>
              <p className="text-3xl font-semibold tabular-nums">{a.coupons.ordersWithCoupon}</p>
              <p className="text-xs text-ink/50">Orders using a code</p>
            </div>
          </div>
          {a.coupons.top.length > 0 && (
            <ul className="mt-4 divide-y divide-ink/10 border-t border-ink/10 text-sm">
              {a.coupons.top.map((c) => (
                <li key={c.key} className="flex justify-between gap-3 py-2">
                  <span className="font-mono text-xs">{c.label}</span>
                  <span className="tabular-nums text-ink/70">
                    {c.secondary} use{c.secondary === 1 ? "" : "s"} · −{formatPrice(c.value)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs text-ink/45">
        Sales include orders that are paid, processing, shipped or delivered. Pending, cancelled and refunded orders are not counted as revenue.
      </p>
    </div>
  );
}

function Kpi({ label, m, format, invert, hint }: { label: string; m: Metric; format: (v: number) => string; invert?: boolean; hint?: string }) {
  // For refunds, going up is bad — flip the colour, keep the arrow direction truthful.
  const up = m.change != null && m.change > 0;
  const down = m.change != null && m.change < 0;
  const good = invert ? down : up;
  const bad = invert ? up : down;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-xs text-ink/55">{label}</p>
      <p className="mt-1.5 break-words text-xl font-semibold tabular-nums sm:text-2xl">{format(m.current)}</p>
      <p
        className={cn("mt-2 inline-flex items-center gap-0.5 text-xs", good ? "text-emerald-700" : bad ? "text-red-700" : "text-ink/45")}
        title={`Previous period: ${format(m.previous)}`}
      >
        <Icon size={13} aria-hidden />
        {m.change == null ? "New" : m.change === 0 ? "No change" : `${Math.abs(Math.round(m.change * 100))}%`}
        <span className="ml-1 text-ink/40">{hint ?? "vs previous"}</span>
      </p>
    </div>
  );
}
