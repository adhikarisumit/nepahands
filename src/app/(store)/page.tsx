import Link from "next/link";
import { ArrowRight, HandHeart, Leaf, Truck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import SmartImage from "@/components/SmartImage";
import { BRAND as brand } from "@/lib/branding";
import { resolveHero } from "@/lib/homepage";
import { getSettings } from "@/lib/settings";
import { getCategories, getFeaturedProducts, getLatestProducts } from "@/lib/catalog";
import type { Category, Product } from "@/lib/types";

export default async function HomePage() {
  const [settings, featured, latest, allCategories] = await Promise.all([
    getSettings(),
    getFeaturedProducts(8).catch(() => [] as Product[]),
    getLatestProducts(4).catch(() => [] as Product[]),
    getCategories().catch(() => [] as Category[]),
  ]);
  const categories = allCategories.slice(0, 4);
  const hero = resolveHero(settings); // editable in Admin → Homepage

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            {hero.eyebrow && <p className="text-sm uppercase tracking-[0.2em] text-clay-600">{hero.eyebrow}</p>}
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-ink sm:text-5xl lg:text-6xl">{hero.title}</h1>
            {hero.subtitle && <p className="mt-6 max-w-lg whitespace-pre-line text-lg text-ink/70">{hero.subtitle}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={hero.cta_link} className="btn-primary px-7 py-3">
                {hero.cta_label} <ArrowRight size={16} />
              </Link>
              {hero.secondary_label && (
                <Link href={hero.secondary_link} className="btn-outline px-7 py-3">
                  {hero.secondary_label}
                </Link>
              )}
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-clay-100">
              <SmartImage src={hero.image_1} alt="" sizes="(min-width: 1024px) 25vw, 50vw" priority />
            </div>
            <div className="relative mt-12 aspect-[3/4] overflow-hidden rounded-3xl bg-clay-100">
              <SmartImage src={hero.image_2} alt="" sizes="(min-width: 1024px) 25vw, 50vw" priority />
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-y border-clay-100 bg-white">
        <div className="container-x grid gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: HandHeart, title: "Made by Nepali artisans", text: "Every purchase supports the makers directly." },
            { icon: Leaf, title: "Natural wool felt", text: "Felted by hand with just wool, water and soap." },
            { icon: Truck, title: "Packed with care", text: "Every order is checked and packed by hand." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 text-clay-600" size={22} />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-ink/60">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="container-x py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-3xl font-semibold">Shop by craft</h2>
            <Link href="/categories" className="text-sm text-clay-700 hover:underline">All categories →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(categories as Category[]).map((c) => (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-clay-200">
                {c.image_url && (
                  <SmartImage src={c.image_url} alt={c.name} sizes="(min-width: 1024px) 25vw, 50vw" className="transition duration-500 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-4 left-4 text-xl font-semibold text-white">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured && featured.length > 0 && (
        <section className="container-x py-8">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-3xl font-semibold">Featured pieces</h2>
            <Link href="/shop" className="text-sm text-clay-700 hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {(featured as Product[]).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Story banner */}
      <section className="container-x py-16">
        <div className="grid overflow-hidden rounded-3xl bg-clay-800 text-clay-50 lg:grid-cols-2">
          <div className="p-10 lg:p-14">
            <h2 className="text-3xl font-semibold">{brand.story_title}</h2>
            <p className="mt-4 whitespace-pre-line text-clay-100/80">{brand.story_text}</p>
            <Link href="/about" className="btn mt-8 bg-clay-50 text-clay-900 hover:bg-white">Read our story</Link>
          </div>
          <div className="relative min-h-64">
            <SmartImage src={brand.story_image} alt="" sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
        </div>
      </section>

      {/* Latest */}
      {latest && latest.length > 0 && (
        <section className="container-x py-8">
          <h2 className="mb-8 text-3xl font-semibold">Just arrived</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {(latest as Product[]).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
