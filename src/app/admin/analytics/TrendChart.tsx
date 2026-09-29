"use client";

import { useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Point = { key: string; label: string; revenue: number; orders: number };
type MetricKey = "revenue" | "orders";

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "orders", label: "Orders" },
];

/** Rounds an axis maximum up to a "nice" number (1, 2, 2.5, 5 × 10ⁿ). */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/**
 * Single-series line/area chart with a crosshair + tooltip. One measure at a time
 * (Revenue or Orders) so there's only ever one y-axis.
 */
export default function TrendChart({ data }: { data: Point[] }) {
  const [metric, setMetric] = useState<MetricKey>("revenue");
  const [hover, setHover] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  const values = data.map((d) => d[metric]);
  const max = niceMax(Math.max(0, ...values));
  const fmt = (v: number) => (metric === "revenue" ? formatPrice(v) : v.toLocaleString());
  const fmtAxis = (v: number) =>
    metric === "revenue" ? (v >= 1000 ? `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k` : `$${v.toLocaleString()}`) : v.toLocaleString();
  const total = values.reduce((s, v) => s + v, 0);

  // Geometry in a 1000×300 viewBox; text is HTML so it never stretches.
  const W = 1000;
  const H = 300;
  const x = (i: number) => (data.length <= 1 ? W / 2 : (i / (data.length - 1)) * W);
  const y = (v: number) => H - (v / max) * H;
  const { line, area } = useMemo(() => {
    const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    return {
      line: `M${pts.join(" L")}`,
      area: `M0,${H} L${pts.join(" L")} L${W},${H} Z`,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric, data, max]);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  const onMove = (clientX: number) => {
    const el = plotRef.current;
    if (!el || !data.length) return;
    const r = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setHover(Math.round(ratio * (data.length - 1)));
  };

  const h = hover != null ? data[hover] : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink/60">{metric === "revenue" ? "Revenue" : "Orders"} over time</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums">{fmt(total)}</p>
        </div>
        <div role="tablist" aria-label="Chart measure" className="inline-flex rounded-md border border-ink/15 p-0.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              role="tab"
              aria-selected={metric === m.key}
              onClick={() => setMetric(m.key)}
              className={cn("rounded px-3 py-1.5 text-xs font-medium transition-colors", metric === m.key ? "bg-ink text-white" : "text-ink/60 hover:text-ink")}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {/* Y axis labels */}
        <div className="relative w-12 shrink-0 text-right text-[11px] tabular-nums text-ink/45" style={{ height: 220 }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${100 - (t / max) * 100}%` }}>
              {fmtAxis(t)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            ref={plotRef}
            className="relative cursor-crosshair touch-none"
            style={{ height: 220 }}
            onMouseMove={(e) => onMove(e.clientX)}
            onMouseLeave={() => setHover(null)}
            onTouchStart={(e) => onMove(e.touches[0].clientX)}
            onTouchMove={(e) => onMove(e.touches[0].clientX)}
            onTouchEnd={() => setHover(null)}
            role="img"
            aria-label={`${metric === "revenue" ? "Revenue" : "Orders"} chart, total ${fmt(total)}`}
          >
            {/* Recessive grid */}
            {ticks.map((t) => (
              <div key={t} className="absolute inset-x-0 border-t border-ink/[0.07]" style={{ top: `${100 - (t / max) * 100}%` }} />
            ))}
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
              <path d={area} fill="rgb(var(--clay-700) / 0.10)" />
              <path d={line} fill="none" stroke="rgb(var(--clay-700))" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
            </svg>

            {/* Crosshair + point + tooltip */}
            {h && hover != null && (
              <>
                <div className="pointer-events-none absolute inset-y-0 border-l border-ink/30" style={{ left: `${(x(hover) / W) * 100}%` }} />
                <div
                  className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-clay-700 shadow"
                  style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(values[hover]) / H) * 100}%` }}
                />
                <div
                  className="pointer-events-none absolute top-0 z-10 min-w-[140px] -translate-y-full rounded-md bg-ink px-3 py-2 text-xs text-white shadow-lg"
                  style={{
                    left: `${(x(hover) / W) * 100}%`,
                    transform: `translate(${hover > data.length / 2 ? "calc(-100% - 8px)" : "8px"}, -4px)`,
                  }}
                >
                  <p className="text-white/60">{h.label}</p>
                  <p className="mt-0.5 font-semibold tabular-nums">{formatPrice(h.revenue)}</p>
                  <p className="tabular-nums text-white/80">
                    {h.orders} order{h.orders === 1 ? "" : "s"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* X axis labels */}
          <div className="relative mt-2 h-4 text-[11px] text-ink/45">
            {data.map((d, i) => {
              const last = data.length - 1;
              // Every Nth label plus the last one; skip a label that would crowd the last.
              const show = i === last || (i % labelEvery === 0 && last - i >= labelEvery / 2);
              if (!show) return null;
              return (
                <span
                  key={d.key}
                  className="absolute whitespace-nowrap"
                  style={{
                    left: `${(x(i) / W) * 100}%`,
                    transform: i === 0 ? "none" : i === last ? "translateX(-100%)" : "translateX(-50%)",
                  }}
                >
                  {d.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Accessible table view */}
      <details className="mt-5 text-sm">
        <summary className="cursor-pointer text-xs text-ink/60 underline underline-offset-4 hover:text-ink">View as table</summary>
        <div className="mt-3 max-h-64 overflow-auto rounded-md border border-ink/10">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-ink/10 text-ink/50">
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 text-right font-medium">Revenue</th>
                <th className="px-3 py-2 text-right font-medium">Orders</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.key} className="border-b border-ink/5 last:border-0">
                  <td className="px-3 py-1.5">{d.label}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatPrice(d.revenue)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{d.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
