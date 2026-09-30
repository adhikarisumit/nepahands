/**
 * Store identity — hard-coded (not editable from the admin panel).
 * Change the values here and redeploy to update the name, homepage copy, images or links.
 */

export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  pinterest?: string;
  x?: string;
};

export const BRAND = {
  name: "Nepahands",
  /** Default contact details (Admin → Settings → Contact email overrides the email if set). */
  contact_email: "nepahands@gmail.com",
  /** E.164 format for tel: links, plus a readable version for display. */
  phone: "+61478544668",
  phone_display: "+61 478 544 668",
  tagline: "Handmade felt from Nepal",
  /** Emblem (the "N" mark) shown next to the store name in the header, menu and admin. Empty = text only. */
  logo_url: "/logo-mark.png",
  /** Full logo (emblem + wordmark), used in the footer. */
  logo_full_url: "/logo-full.png",
  /** Browser-tab icon comes from src/app/icon.png (Next.js file convention); set this only to override it. */
  favicon_url: "",

  hero_eyebrow: "Handmade in Nepal",
  hero_title: "Soft, colourful felt — made by hand in Nepal.",
  hero_subtitle: "Felt ball rugs, coasters, pouches and décor, hand-felted from wool by Nepali artisans.",
  hero_cta: "Shop felt crafts",
  // Your own product photos in /public/images
  hero_image_1: "/images/felt-ball-rug.jpg",
  hero_image_2: "/images/felt-coasters.jpg",

  story_title: "Every piece, felted by hand.",
  story_text:
    "Each felt ball is rolled by hand from wool with warm water and soap, then stitched together one by one. No two pieces are exactly alike — small differences in colour and shape are part of the craft.",
  story_image: "/images/felt-mushroom-pouch.jpg",

  footer_text: "Handmade felt crafts from Nepal. Every purchase supports the artisans who make them.",
  meta_description: "Shop handmade felt ball rugs, coasters, pouches and décor, hand-felted from wool by artisans in Nepal — Nepahands.",

  /** Only links with a URL are shown in the footer. */
  social: {} as SocialLinks,
};

export type Brand = typeof BRAND;

export const SOCIAL_LABELS: Record<keyof SocialLinks, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  x: "X / Twitter",
};
