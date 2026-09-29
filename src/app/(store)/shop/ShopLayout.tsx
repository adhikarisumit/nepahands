"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

const SORTS = [
  { value: "", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A–Z" },
];

const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: "Under $25", max: 25 },
  { label: "$25 – $50", min: 25, max: 50 },
  { label: "$50 – $100", min: 50, max: 100 },
  { label: "Over $100", min: 100 },
];

const money = (v: number) => formatPrice(v).replace(/\.00$/, "");

type Props = { categories: Category[]; counts: Record<string, number>; total: number; children: React.ReactNode };

export default function ShopLayout({ categories, counts, total, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [drawer, setDrawer] = useState(false);
  const closeDrawer = useCallback(() => setDrawer(false), []);

  const selected = (sp.get("category") ?? "").split(",").filter(Boolean);
  const min = sp.get("min") ?? "";
  const max = sp.get("max") ?? "";
  const inStock = sp.get("stock") === "1";
  const sort = sp.get("sort") ?? "";

  const update = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(changes)) v ? params.set(k, v) : params.delete(k);
    params.delete("page");
    const qs = params.toString();
    start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const toggleCategory = (slug: string) => {
    const next = selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug];
    update({ category: next.join(",") || null });
  };
  const setPrice = (lo?: number, hi?: number) => update({ min: lo != null ? String(lo) : null, max: hi != null ? String(hi) : null });

  // Active filter chips
  const chips: { label: string; clear: () => void }[] = [
    ...selected.map((slug) => ({
      label: categories.find((c) => c.slug === slug)?.name ?? slug,
      clear: () => toggleCategory(slug),
    })),
  ];
  if (min || max) {
    const label = min && max ? `${money(+min)} – ${money(+max)}` : min ? `Over ${money(+min)}` : `Under ${money(+max)}`;
    chips.push({ label, clear: () => setPrice() });
  }
  if (inStock) chips.push({ label: "In stock", clear: () => update({ stock: null }) });
  const q = sp.get("q");
  if (q) chips.push({ label: `“${q}”`, clear: () => update({ q: null }) });
  const clearAll = () => start(() => router.push(pathname, { scroll: false }));

  const filters = (
    <Filters
      categories={categories}
      counts={counts}
      selected={selected}
      min={min}
      max={max}
      inStock={inStock}
      onToggleCategory={toggleCategory}
      onPrice={setPrice}
      onStock={(v) => update({ stock: v ? "1" : null })}
    />
  );

  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-[230px_1fr] lg:gap-12">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-24">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-semibold">Filters</p>
            {chips.length > 0 && (
              <button onClick={clearAll} className="text-xs text-ink/50 underline underline-offset-4 hover:text-ink">
                Clear all
              </button>
            )}
          </div>
          {filters}
        </div>
      </aside>

      <div className="min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink/60" aria-live="polite">
            <span className={cn("tabular-nums", pending && "opacity-50")}>{total}</span> {total === 1 ? "product" : "products"}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawer(true)} className="btn-outline h-10 px-3 text-sm lg:hidden">
              <SlidersHorizontal size={15} /> Filters
              {chips.length > 0 && <span className="rounded-full bg-ink px-1.5 text-[11px] text-white">{chips.length}</span>}
            </button>
            <label className="relative flex items-center">
              <span className="sr-only">Sort by</span>
              <span className="pointer-events-none absolute left-3 hidden text-sm text-ink/50 sm:block">Sort:</span>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value || null })}
                className="h-10 appearance-none rounded-md border border-ink/15 bg-white py-0 pl-3 pr-9 text-sm font-medium outline-none hover:border-ink/40 focus:border-ink/50 sm:pl-12"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 text-ink/50" />
            </label>
          </div>
        </div>

        {/* Active filter chips */}
        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button
                key={c.label}
                onClick={c.clear}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white py-1 pl-3 pr-2 text-xs hover:border-ink/40"
                aria-label={`Remove filter ${c.label}`}
              >
                {c.label} <X size={13} className="text-ink/50" />
              </button>
            ))}
            <button onClick={clearAll} className="text-xs text-ink/50 underline underline-offset-4 hover:text-ink">
              Clear all
            </button>
          </div>
        )}

        <div className={cn("mt-6 transition-opacity", pending && "opacity-60")}>{children}</div>
      </div>

      {/* Mobile / tablet filter drawer */}
      <FilterDrawer open={drawer} onClose={closeDrawer} total={total} pending={pending} onClear={chips.length ? clearAll : undefined}>
        {filters}
      </FilterDrawer>
    </div>
  );
}

function Filters(props: {
  categories: Category[];
  counts: Record<string, number>;
  selected: string[];
  min: string;
  max: string;
  inStock: boolean;
  onToggleCategory: (slug: string) => void;
  onPrice: (min?: number, max?: number) => void;
  onStock: (v: boolean) => void;
}) {
  const { categories, counts, selected, min, max, inStock, onToggleCategory, onPrice, onStock } = props;
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);
  useEffect(() => {
    setLo(min);
    setHi(max);
  }, [min, max]);

  const activePreset = PRICE_RANGES.findIndex((r) => String(r.min ?? "") === min && String(r.max ?? "") === max);

  return (
    <div className="divide-y divide-ink/10 border-t border-ink/10">
      {categories.length > 0 && (
        <Section title="Category">
          <ul className="space-y-1">
            {categories.map((c) => {
              const on = selected.includes(c.slug);
              return (
                <li key={c.id}>
                  <button onClick={() => onToggleCategory(c.slug)} className="group flex w-full items-center gap-3 py-1.5 text-left text-sm" aria-pressed={on}>
                    <Box on={on} />
                    <span className={cn("flex-1", on ? "font-medium text-ink" : "text-ink/75 group-hover:text-ink")}>{c.name}</span>
                    <span className="text-xs tabular-nums text-ink/40">{counts[c.id] ?? 0}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section title="Price">
        <ul className="space-y-1">
          {PRICE_RANGES.map((r, i) => {
            const on = activePreset === i;
            return (
              <li key={r.label}>
                <button onClick={() => (on ? onPrice() : onPrice(r.min, r.max))} className="group flex w-full items-center gap-3 py-1.5 text-left text-sm" aria-pressed={on}>
                  <Box on={on} round />
                  <span className={on ? "font-medium text-ink" : "text-ink/75 group-hover:text-ink"}>{r.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onPrice(lo ? Math.max(0, Number(lo)) : undefined, hi ? Math.max(0, Number(hi)) : undefined);
          }}
        >
          <PriceInput value={lo} onChange={setLo} placeholder="Min" />
          <span className="text-ink/30">–</span>
          <PriceInput value={hi} onChange={setHi} placeholder="Max" />
          <button className="h-9 shrink-0 rounded-md border border-ink/15 px-3 text-xs font-medium hover:border-ink/40">Go</button>
        </form>
      </Section>

      <Section title="Availability">
        <label className="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm">
          <span className="text-ink/75">In stock only</span>
          <input type="checkbox" className="peer sr-only" checked={inStock} onChange={(e) => onStock(e.target.checked)} />
          <span className="relative h-5 w-9 shrink-0 rounded-full bg-ink/15 transition peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-clay-400 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4" />
        </label>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-ink/60 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function Box({ on, round }: { on: boolean; round?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center border transition-colors",
        round ? "rounded-full" : "rounded",
        on ? "border-ink bg-ink text-white" : "border-ink/25 bg-white group-hover:border-ink/50"
      )}
      aria-hidden
    >
      {on && (round ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : <Check size={11} strokeWidth={3} />)}
    </span>
  );
}

function PriceInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-0 flex-1">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink/40">$</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder={placeholder}
        aria-label={`${placeholder} price`}
        className="h-9 w-full rounded-md border border-ink/15 bg-white pl-6 pr-2 text-base outline-none placeholder:text-ink/35 focus:border-ink/50 sm:text-sm"
      />
    </div>
  );
}

function FilterDrawer({
  open,
  onClose,
  total,
  pending,
  onClear,
  children,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  pending: boolean;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <div className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={cn(
          "absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <p className="font-semibold">Filters</p>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5" aria-label="Close filters">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5">{children}</div>
        <div className="flex gap-2 border-t border-ink/10 p-4">
          {onClear && (
            <button onClick={onClear} className="btn-outline flex-1">
              Clear all
            </button>
          )}
          <button onClick={onClose} className="btn-primary flex-[2]">
            {pending ? "Updating…" : `Show ${total} result${total === 1 ? "" : "s"}`}
          </button>
        </div>
      </aside>
    </div>
  );
}
