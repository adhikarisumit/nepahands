import { CreditCard, Store, Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { getFreshSettings } from "@/lib/settings";
import { paymentMethods, type MethodStatus } from "@/lib/payments";
import { formatPrice } from "@/lib/utils";
import { shippingRule } from "@/lib/shipping";
import SettingsForm from "./SettingsForm";
import PaymentSettingsForm from "./PaymentSettingsForm";
import UsersPanel from "./UsersPanel";
import SettingsSection, { Chip } from "./SettingsSection";

export const metadata = { title: "Settings" };

export default async function AdminSettings() {
  const { supabase, user } = await requireAdmin();
  const [settings, { data: admins }] = await Promise.all([
    getFreshSettings(),
    supabase.from("profiles").select("id, email, full_name, created_at").eq("role", "admin").order("created_at"),
  ]);
  const needsMigration = settings.bank_enabled === undefined;
  const methods = paymentMethods(settings);
  const adminList = admins ?? [];
  const ship = shippingRule(settings);

  const methodChip = (label: string, m: MethodStatus) => (
    <Chip
      key={label}
      label={label}
      value={m.available ? "Live" : m.enabled ? "Needs setup" : "Off"}
      tone={m.available ? "good" : m.enabled ? "warn" : "off"}
    />
  );

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-ink/60">Store details, shipping, tax, payments and who can access the admin panel.</p>
      </div>

      <SettingsSection
        id="general"
        icon={<Store size={20} />}
        title="General"
        description="Contact email, announcement bar, shipping and tax."
        buttonLabel="Edit"
        modalSize="lg"
        summary={
          <>
            <Chip label="Contact" value={settings.contact_email || "Not set"} tone={settings.contact_email ? "neutral" : "warn"} />
            <Chip label="Shipping" value={ship.rate <= 0 ? "Free" : ship.minPrice > 0 ? `${formatPrice(ship.rate)} · items over ${formatPrice(ship.minPrice)}` : formatPrice(ship.rate)} />
            <Chip label="Tax" value={`${Number(settings.tax_rate)}%`} />
            <Chip label="Announcement" value={settings.announcement ? "On" : "Off"} tone={settings.announcement ? "good" : "off"} />
          </>
        }
      >
        <SettingsForm settings={settings} />
      </SettingsSection>

      <SettingsSection
        id="payments"
        icon={<CreditCard size={20} />}
        title="Payments"
        description="Payment methods customers can use at checkout, and bank transfer details."
        buttonLabel="Manage"
        summary={
          needsMigration ? (
            <Chip value="Database update needed" tone="warn" />
          ) : (
            <>
              {methodChip("Stripe", methods.stripe)}
              {methodChip("Paddle", methods.paddle)}
              {methodChip("Bank transfer", methods.bank_transfer)}
            </>
          )
        }
      >
        {needsMigration && (
          <p className="mb-4 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
            Run <code className="font-mono">supabase/migrations/003_payment_methods.sql</code> in the Supabase SQL Editor to enable
            payment switches and bank transfer.
          </p>
        )}
        <PaymentSettingsForm
          methods={methods}
          bank={settings.bank_details ?? {}}
          qrUrl={settings.bank_qr_url ?? null}
          env={{
            stripeLive: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ?? false,
            stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
            paddleEnv: process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox",
            paddleWebhook: !!process.env.PADDLE_WEBHOOK_SECRET,
          }}
        />
      </SettingsSection>

      <SettingsSection
        id="users"
        icon={<Users size={20} />}
        title="Users & admins"
        description="Create accounts for customers or staff, and manage admin access."
        buttonLabel="Manage users"
        summary={
          <>
            <Chip label="Admins" value={adminList.length} />
            {adminList.slice(0, 3).map((a) => (
              <Chip key={a.id} value={a.full_name || a.email || "—"} />
            ))}
            {adminList.length > 3 && <Chip value={`+${adminList.length - 3} more`} tone="off" />}
          </>
        }
      >
        <UsersPanel admins={adminList} currentUserId={user.id} />
      </SettingsSection>
    </div>
  );
}
