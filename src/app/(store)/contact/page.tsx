import { Mail, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { BRAND } from "@/lib/branding";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();
  const email = settings.contact_email || BRAND.contact_email;
  return (
    <div className="container-x max-w-3xl py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Get in touch</h1>
      <p className="mt-4 text-lg text-ink/70">
        Questions about an order, a custom piece or wholesale? Send us an email or give us a call — we&apos;ll get back to you as soon as we can.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a href={`mailto:${email}`} className="card group flex items-start gap-4 p-6 transition hover:border-clay-300 hover:shadow-sm">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-50 text-clay-700">
            <Mail size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm text-ink/60">Email</span>
            <span className="block break-all font-medium group-hover:text-clay-700">{email}</span>
          </span>
        </a>
        <a href={`tel:${BRAND.phone}`} className="card group flex items-start gap-4 p-6 transition hover:border-clay-300 hover:shadow-sm">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-50 text-clay-700">
            <Phone size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm text-ink/60">Phone</span>
            <span className="block font-medium tabular-nums group-hover:text-clay-700">{BRAND.phone_display}</span>
          </span>
        </a>
      </div>

      <p className="mt-6 text-sm text-ink/60">For questions about an order, please include your order number so we can help faster.</p>
    </div>
  );
}
