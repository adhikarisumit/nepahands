import { BRAND } from "./branding";

/**
 * Business details used by the hard-coded legal pages (src/app/(store)/(legal)/*).
 * Edit these values once and every policy updates. Have the final text reviewed by
 * a lawyer for your country — these pages are a starting template, not legal advice.
 */
export const LEGAL = {
  /** Registered business / trading name shown in the policies. */
  businessName: BRAND.name,
  /** Public website address. */
  website: "https://nepahands.vercel.app",
  /** Where customers send legal, privacy and refund requests. */
  contactEmail: BRAND.contact_email,
  /** Customer phone number (display format) and tel: link value. */
  phone: BRAND.phone_display,
  phoneHref: `tel:${BRAND.phone}`,
  /** Registered business address (required by most consumer and privacy laws). */
  address: "[Your registered business address]",
  /** Country / state whose laws govern the Terms. */
  governingLaw: "[Your country]",
  /** Date the current versions of the policies take effect. */
  effectiveDate: "September 29, 2026",

  /** Returns & refunds */
  returnWindowDays: 14,
  refundProcessingDays: "5–10 business days",

  /** Shipping */
  processingTime: "2–5 business days",
  domesticDelivery: "3–7 business days",
  internationalDelivery: "7–21 business days",
};

export const LEGAL_PAGES = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund & Return Policy" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
] as const;
