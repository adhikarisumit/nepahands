import type { Ranked } from "@/lib/analytics";

type Props = {
  title: string;
  items: Ranked[];
  /** Formats the main value (e.g. money). */
  format: (v: number) => string;
  /** Optional secondary value, e.g. "3 sold". */
  secondary?: (v: number) => string;
  empty?: string;
};

/**
 * Ranked horizontal bars, one hue (magnitude only). Labels and values stay in text colour;
 * the bar length carries the comparison. Each row has a native tooltip with the exact figures.
 */
export default function BarList({ title, items, format, secondary, empty = "No data for this period." }: Props) {
  const max = Math.max(0, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-6 pb-2 text-sm text-ink/50">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((i) => {
            const share = total > 0 ? Math.round((i.value / total) * 100) : 0;
            return (
              <li
                key={i.key}
                className="group"
                title={`${i.label}: ${format(i.value)}${i.secondary != null && secondary ? ` · ${secondary(i.secondary)}` : ""} (${share}%)`}
              >
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate capitalize text-ink/80">{i.label}</span>
                  <span className="shrink-0 tabular-nums">
                    {format(i.value)}
                    {i.secondary != null && secondary && <span className="ml-1.5 text-xs text-ink/45">{secondary(i.secondary)}</span>}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                  <div
                    className="h-full rounded-full bg-clay-600 transition-colors group-hover:bg-clay-800"
                    style={{ width: `${max > 0 ? Math.max(2, (i.value / max) * 100) : 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
