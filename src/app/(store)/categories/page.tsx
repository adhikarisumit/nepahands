import Link from "next/link";
import { getCategories } from "@/lib/catalog";
import SmartImage from "@/components/SmartImage";
import type { Category } from "@/lib/types";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await getCategories().catch(() => [] as Category[]);
  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-4xl font-semibold">Categories</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link key={c.id} href={`/shop?category=${c.slug}`} className="group card overflow-hidden">
            <div className="relative aspect-[16/10] overflow-hidden bg-clay-100">
              {c.image_url && (
                <SmartImage
                  src={c.image_url}
                  alt={c.name}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="transition group-hover:scale-105"
                />
              )}
            </div>
            <div className="p-5">
              <h2 className="text-xl font-semibold">{c.name}</h2>
              {c.description && <p className="mt-1 text-sm text-ink/60">{c.description}</p>}
            </div>
          </Link>
        ))}
        {categories.length === 0 && <p className="text-ink/60">No categories yet.</p>}
      </div>
    </div>
  );
}
