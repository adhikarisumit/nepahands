import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { getCategories, getCategoryCounts, searchProducts } from "@/lib/catalog";
import ShopLayout from "./ShopLayout";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Shop" };

const PAGE_SIZE = 12;

type SP = Promise<{ q?: string; category?: string; sort?: string; min?: string; max?: string; page?: string; stock?: string }>;

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [categories, counts] = await Promise.all([
    getCategories().catch(() => [] as Category[]),
    getCategoryCounts().catch(() => ({}) as Record<string, number>),
  ]);
  // ?category=rugs,coasters — one or more category slugs
  const selectedSlugs = (sp.category ?? "").split(",").filter(Boolean);
  const selected = categories.filter((c) => selectedSlugs.includes(c.slug));

  const { products, count } = await searchProducts({
    q: sp.q?.slice(0, 100),
    categoryIds: selected.map((c) => c.id),
    min: sp.min ? Number(sp.min) : undefined,
    max: sp.max ? Number(sp.max) : undefined,
    inStock: sp.stock === "1",
    sort: sp.sort,
    page,
    pageSize: PAGE_SIZE,
  }).catch(() => ({ products: [] as Product[], count: 0 }));
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const pageHref = (p: number) => {
    const params = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    params.set("page", String(p));
    return `/shop?${params.toString()}`;
  };

  const single = selected.length === 1 ? selected[0] : null;
  const title = sp.q ? `Results for “${sp.q}”` : single ? single.name : "Shop all";
  const subtitle = single?.description || (sp.q ? null : "Handmade felt crafts from Nepal, made one piece at a time.");

  return (
    <div className="container-x py-8 sm:py-10">
      <div className="border-b border-ink/10 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-ink/60">{subtitle}</p>}
      </div>

      <ShopLayout categories={categories} counts={counts} total={count}>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
            {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-ink/15 px-6 py-16 text-center">
            <PackageSearch size={36} strokeWidth={1.25} className="text-ink/30" />
            <p className="mt-4 font-medium">No products match these filters</p>
            <p className="mt-1 text-sm text-ink/60">Try removing a filter or searching for something else.</p>
            <Link href="/shop" className="btn-outline mt-6">Clear all filters</Link>
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1">
            <PageLink href={pageHref(page - 1)} disabled={page <= 1} label="Previous page">
              <ChevronLeft size={16} />
            </PageLink>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={pageHref(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm tabular-nums",
                  p === page ? "bg-ink text-white" : "text-ink/70 hover:bg-ink/5"
                )}
              >
                {p}
              </Link>
            ))}
            <PageLink href={pageHref(page + 1)} disabled={page >= totalPages} label="Next page">
              <ChevronRight size={16} />
            </PageLink>
          </nav>
        )}
      </ShopLayout>
    </div>
  );
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-md text-ink/25">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-md text-ink/70 hover:bg-ink/5">
      {children}
    </Link>
  );
}
