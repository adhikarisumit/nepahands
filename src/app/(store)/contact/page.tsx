import { getSettings } from "@/lib/settings";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();
  const email = settings.contact_email || "hello@example.com";
  return (
    <div className="container-x max-w-2xl py-16">
      <h1 className="text-4xl font-semibold">Get in touch</h1>
      <p className="mt-4 text-lg text-ink/70">
        Questions about an order, a custom piece, or becoming one of our artisans? We usually reply within one
        business day.
      </p>
      <div className="card mt-8 space-y-3 p-8">
        <p>
          <span className="text-ink/60">Email: </span>
          <a href={`mailto:${email}`} className="font-medium text-clay-700 underline">{email}</a>
        </p>
        <p className="text-sm text-ink/60">For order questions, please include your order number.</p>
      </div>
    </div>
  );
}
