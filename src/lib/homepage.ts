import { BRAND } from "./branding";
import type { StoreSettings } from "./types";

/** Homepage hero content — edited in Admin → Homepage, stored in store_settings.branding.hero. */
export type Hero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_link: string;
  secondary_label: string;
  secondary_link: string;
  image_1: string;
  image_2: string;
};

export const DEFAULT_HERO: Hero = {
  eyebrow: BRAND.hero_eyebrow,
  title: BRAND.hero_title,
  subtitle: BRAND.hero_subtitle,
  cta_label: BRAND.hero_cta,
  cta_link: "/shop",
  secondary_label: "Meet the makers",
  secondary_link: "/about",
  image_1: BRAND.hero_image_1,
  image_2: BRAND.hero_image_2,
};

/** Saved values over the defaults; blank fields fall back (except the optional second button). */
export function resolveHero(settings: Pick<StoreSettings, "branding">): Hero {
  const saved = ((settings.branding as { hero?: Partial<Hero> } | null)?.hero ?? {}) as Partial<Hero>;
  const out = { ...DEFAULT_HERO };
  for (const k of Object.keys(DEFAULT_HERO) as (keyof Hero)[]) {
    const v = saved[k];
    if (typeof v !== "string") continue;
    // An empty secondary label means "hide the second button".
    if (v.trim() || k === "secondary_label") out[k] = v.trim();
  }
  return out;
}

/** Internal path ("/shop?category=rugs") or full https URL. */
export const isValidLink = (v: string) => /^\/(?!\/)\S*$/.test(v) || /^https:\/\/\S+$/i.test(v);
