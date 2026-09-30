import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "./supabase/public";
import { BRAND } from "./branding";
import type { StoreSettings } from "./types";

export const SETTINGS_TAG = "settings";

const FALLBACK: StoreSettings = {
  id: 1,
  store_name: BRAND.name,
  shipping_flat: 8,
  free_shipping_threshold: 0,
  tax_rate: 0,
  announcement: null,
  contact_email: null,
};

// Settings are read on every page (root layout), so they're cached across requests and
// invalidated with revalidateTag(SETTINGS_TAG) whenever an admin saves settings.
// (The store name and branding are hard-coded in lib/branding.ts, not read from here.)
const loadSettings = unstable_cache(
  async (): Promise<StoreSettings> => {
    const { data, error } = await createPublicClient().from("store_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw new Error(error.message); // don't cache a failed read
    return (data as StoreSettings) ?? FALLBACK;
  },
  ["store-settings-v2"],
  { tags: [SETTINGS_TAG], revalidate: 3600 }
);

/**
 * Uncached read for admin forms, so an editor always sees (and saves) the real current values
 * rather than a cached copy.
 */
export async function getFreshSettings(): Promise<StoreSettings> {
  const { data, error } = await createPublicClient().from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return getSettings();
  return data as StoreSettings;
}

export const getSettings = cache(async (): Promise<StoreSettings> => {
  try {
    return await loadSettings();
  } catch (e) {
    console.error("Failed to load store settings", e);
    return FALLBACK;
  }
});
