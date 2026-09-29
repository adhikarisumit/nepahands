import { requireAdmin } from "@/lib/admin";
import { getSettings } from "@/lib/settings";
import { DEFAULT_HERO, resolveHero } from "@/lib/homepage";
import HeroForm from "./HeroForm";

export const metadata = { title: "Homepage" };

export default async function AdminHomepage() {
  const { supabase } = await requireAdmin();
  const [settings, { data: products }, { data: categories }] = await Promise.all([
    getSettings(),
    supabase.from("products").select("id, name, slug, images, active").order("created_at", { ascending: false }).limit(200),
    supabase.from("categories").select("name, slug").order("name"),
  ]);

  // Photos to pick from (every product image, newest products first)
  const photos = (products ?? []).flatMap((p) =>
    ((p.images as string[] | null) ?? []).map((src, i) => ({ src, product: p.name as string, slug: p.slug as string, key: `${p.id}-${i}` }))
  );
  const links = [
    { label: "Shop all", href: "/shop" },
    { label: "New in", href: "/shop?sort=newest" },
    { label: "Categories", href: "/categories" },
    { label: "Our story", href: "/about" },
    ...(categories ?? []).map((c) => ({ label: `Category: ${c.name}`, href: `/shop?category=${c.slug}` })),
    ...(products ?? []).filter((p) => p.active).map((p) => ({ label: `Product: ${p.name}`, href: `/product/${p.slug}` })),
  ];

  const hero = resolveHero(settings);
  const customised = !!(settings.branding as { hero?: unknown } | null)?.hero;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Homepage</h1>
        <p className="mt-1 text-sm text-ink/60">
          Edit the hero section at the top of your homepage — headline, buttons and the two featured photos. Changes go live when you save.
        </p>
      </div>
      <HeroForm initial={hero} defaults={DEFAULT_HERO} photos={photos} links={links} customised={customised} />
    </div>
  );
}
