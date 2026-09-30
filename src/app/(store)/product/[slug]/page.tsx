import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight, Hand, Lock, Truck } from "lucide-react";
import { getUserAndProfile } from "@/lib/supabase/server";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { LEGAL } from "@/lib/legal";
import { hasReceivedProduct } from "@/lib/reviews";
import ProductCard from "@/components/ProductCard";
import Gallery from "./Gallery";
import AddToCart from "./AddToCart";
import WishlistButton from "./WishlistButton";
import Reviews from "./Reviews";
import Stars from "./Stars";
import type { Product, Review } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

/** Active products come from the shared cache; admins can also preview inactive ones. */
async function loadProduct(slug: string): Promise<Product | null> {
  const cached = await getProductBySlug(slug).catch(() => null);
  if (cached) return cached;
  const { supabase, profile } = await getUserAndProfile();
  if (profile?.role !== "admin") return null;
  const { data } = await supabase.from("products").select("*, categories(name, slug)").eq("slug", slug).maybeSingle();
  return (data as Product) ?? null;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    openGraph: { images: product.images?.[0] ? [product.images[0]] : [] },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  // Product (cached) and the viewer (shared with the layout) load concurrently.
  const [product, { supabase, user }, settings] = await Promise.all([loadProduct(slug), getUserAndProfile(), getSettings()]);
  if (!product) notFound();

  const [{ data: reviewsData }, related, wish, received] = await Promise.all([
    supabase.from("reviews").select("*").eq("product_id", product.id).order("created_at", { ascending: false }),
    product.category_id ? getRelatedProducts(product.category_id, product.id).catch(() => [] as Product[]) : Promise.resolve([] as Product[]),
    user
      ? supabase.from("wishlist").select("product_id").eq("user_id", user.id).eq("product_id", product.id).maybeSingle()
      : Promise.resolve({ data: null }),
    // Reviews are only open to customers whose order with this item has been delivered.
    user ? hasReceivedProduct(supabase, user.id, product.id) : Promise.resolve(false),
  ]);

  const reviews = (reviewsData as Review[]) ?? [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const hasReviewed = !!user && reviews.some((r) => r.user_id === user.id);

  const price = Number(product.price);
  const compareAt = Number(product.compare_at_price ?? 0);
  const onSale = compareAt > price;
  const savePct = onSale ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  const shipping = Number(settings.shipping_flat) || 0;

  const details: [string, string | null][] = [
    ["Made by", product.artisan],
    ["Material", product.material],
    ["Made in", product.origin],
    ["Category", product.categories?.name ?? null],
    ["SKU", product.sku],
  ];

  return (
    <div className="container-x pb-24 pt-6 sm:pt-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-ink/50">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight size={12} />
        <Link href="/shop" className="hover:text-ink">Shop</Link>
        {product.categories && (
          <>
            <ChevronRight size={12} />
            <Link href={`/shop?category=${product.categories.slug}`} className="hover:text-ink">{product.categories.name}</Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="truncate text-ink/80">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
        <Gallery images={product.images} name={product.name} />

        {/* Buy box — stays in view while the gallery scrolls on desktop */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {product.artisan && <p className="eyebrow text-clay-700">{product.artisan}</p>}
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-[2.5rem]">{product.name}</h1>

          {reviews.length > 0 && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink">
              <Stars value={avg} /> <span className="tabular-nums">{avg.toFixed(1)}</span>
              <span className="underline underline-offset-4">
                {reviews.length} review{reviews.length > 1 ? "s" : ""}
              </span>
            </a>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold tabular-nums sm:text-3xl">{formatPrice(price)}</span>
            {onSale && (
              <>
                <span className="text-lg text-ink/40 line-through tabular-nums">{formatPrice(compareAt)}</span>
                <span className="rounded bg-clay-700 px-2 py-0.5 text-xs font-medium text-white">Save {savePct}%</span>
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-ink/50">
            {shipping > 0 ? `+ ${formatPrice(shipping)} shipping` : "Free shipping"} · Taxes calculated at checkout
          </p>

          <div className="mt-6 border-t border-ink/10 pt-6">
            <StockStatus stock={product.stock} />
            <div className="mt-4">
              <AddToCart
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price,
                  image: product.images?.[0] ?? null,
                  stock: product.stock,
                }}
                isLoggedIn={!!user}
              />
            </div>
            <div className="mt-3">
              <WishlistButton productId={product.id} initial={!!wish.data} isLoggedIn={!!user} />
            </div>
          </div>

          {/* Trust points */}
          <ul className="mt-6 grid gap-x-4 gap-y-3 rounded-lg bg-clay-50 p-4 text-xs text-ink/70 sm:grid-cols-3">
            <li className="flex items-center gap-2"><Truck size={15} className="shrink-0 text-clay-700" /> Ships in {LEGAL.processingTime}</li>
            <li className="flex items-center gap-2"><Hand size={15} className="shrink-0 text-clay-700" /> Handmade by an artisan</li>
            <li className="flex items-center gap-2"><Lock size={15} className="shrink-0 text-clay-700" /> Secure checkout</li>
          </ul>

          {/* Details accordions (native <details>, no JS needed) */}
          <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
            {product.description && (
              <Accordion title="Description" open>
                <p className="whitespace-pre-line">{product.description}</p>
              </Accordion>
            )}
            {details.some(([, v]) => v) && (
              <Accordion title="Details">
                <dl className="grid grid-cols-[110px_1fr] gap-y-2">
                  {details
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-ink/50">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                </dl>
                <p className="mt-3 text-ink/60">
                  Every piece is made by hand, so colour, size and texture can vary slightly from the photos — that&apos;s part of its character.
                </p>
              </Accordion>
            )}
            <Accordion title="Shipping">
              <ul className="space-y-1.5">
                <li>Dispatched within {LEGAL.processingTime} of payment.</li>
                <li>{shipping > 0 ? `Flat ${formatPrice(shipping)} shipping per order.` : "Free shipping on every order."}</li>
              </ul>
              <p className="mt-3">
                Read our <Link href="/shipping-policy" className="underline underline-offset-2">Shipping Policy</Link>.
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      <Reviews
        productId={product.id}
        slug={product.slug}
        reviews={reviews}
        average={avg}
        isLoggedIn={!!user}
        hasReviewed={hasReviewed}
        canReview={received}
      />

      {related.length > 0 && (
        <section className="mt-20 border-t border-ink/10 pt-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">You may also like</h2>
            {product.categories && (
              <Link href={`/shop?category=${product.categories.slug}`} className="text-sm text-ink/60 underline underline-offset-4 hover:text-ink">
                View all {product.categories.name.toLowerCase()}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function StockStatus({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-red-700">
        <span className="h-2 w-2 rounded-full bg-red-600" /> Sold out
      </p>
    );
  }
  if (stock <= 5) {
    return (
      <p className="flex items-center gap-2 text-sm text-clay-800">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" /> Only {stock} left — each piece is made by hand
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2 text-sm text-sage-600">
      <span className="h-2 w-2 rounded-full bg-emerald-500" /> In stock, ready to ship
    </p>
  );
}

function Accordion({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="group" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={16} className="text-ink/50 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-ink/75">{children}</div>
    </details>
  );
}
