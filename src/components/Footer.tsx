import Link from "next/link";
import BrandLogo from "./BrandLogo";
import { Mail, Phone } from "lucide-react";
import { BRAND, SOCIAL_LABELS, type SocialLinks } from "@/lib/branding";
import { LEGAL_PAGES } from "@/lib/legal";

type Props = {
  storeName: string;
  logoUrl?: string | null;
  text: string;
  social: SocialLinks;
  contactEmail?: string | null;
};

export default function Footer({ storeName, logoUrl, text, social, contactEmail }: Props) {
  const socials = (Object.keys(SOCIAL_LABELS) as (keyof SocialLinks)[]).filter((k) => social[k]?.trim());
  return (
    <footer className="mt-24 border-t border-clay-100 bg-clay-100/60">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <BrandLogo name={storeName} logoUrl={logoUrl} full className="h-24" />
          <p className="mt-3 text-sm text-ink/70">{text}</p>
          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((k) => (
                <a
                  key={k}
                  href={social[k]}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-clay-200 bg-white px-3 py-1 text-xs text-ink/70 hover:border-clay-500 hover:text-clay-700"
                >
                  {SOCIAL_LABELS[k]}
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Shop</p>
          <ul className="space-y-2 text-sm text-ink/70">
            <li><Link href="/shop">All products</Link></li>
            <li><Link href="/categories">Categories</Link></li>
            <li><Link href="/shop?sort=newest">New arrivals</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Help</p>
          <ul className="space-y-2 text-sm text-ink/70">
            <li><Link href="/account/orders">My orders</Link></li>
            <li><Link href="/about">Our story</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Legal</p>
          <ul className="space-y-2 text-sm text-ink/70">
            {LEGAL_PAGES.map((p) => (
              <li key={p.href}><Link href={p.href}>{p.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Get in touch</p>
          <ul className="space-y-2 text-sm text-ink/70">
            <li>
              <a href={`mailto:${contactEmail || BRAND.contact_email}`} className="flex items-center gap-2 hover:text-clay-700">
                <Mail size={15} className="shrink-0 text-ink/40" /> {contactEmail || BRAND.contact_email}
              </a>
            </li>
            <li>
              <a href={`tel:${BRAND.phone}`} className="flex items-center gap-2 hover:text-clay-700">
                <Phone size={15} className="shrink-0 text-ink/40" /> {BRAND.phone_display}
              </a>
            </li>
          </ul>
          <p className="mt-4 text-xs text-ink/50">Secure payments · Cards · Bank transfer</p>
        </div>
      </div>
      <div className="border-t border-clay-200 py-5 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} {storeName}. All rights reserved.
      </div>
    </footer>
  );
}
