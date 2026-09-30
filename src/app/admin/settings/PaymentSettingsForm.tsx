"use client";

import { useState, useTransition } from "react";
import { CreditCard, ImagePlus, Landmark, Loader2, Trash2, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { savePaymentSettings } from "../actions";
import { useCloseSettingsModal } from "./SettingsSection";
import type { BankDetails } from "@/lib/types";
import type { MethodStatus } from "@/lib/payments";
import { cn, formatPrice } from "@/lib/utils";
import { convertForBank, formatBankAmount, formatRate } from "@/lib/bankCurrency";

type Props = {
  methods: { stripe: MethodStatus; paddle: MethodStatus; bank_transfer: MethodStatus };
  bank: BankDetails;
  qrUrl: string | null;
  env: { stripeLive: boolean; stripeWebhook: boolean; paddleEnv: string; paddleWebhook: boolean };
  /** Store currency (e.g. "AUD") and today's live rates from it to the supported bank currencies. */
  storeCurrency: string;
  liveRates: Record<string, number>;
};

const CURRENCY_NAMES: Record<string, string> = {
  NPR: "Nepalese Rupee",
  INR: "Indian Rupee",
  AUD: "Australian Dollar",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
};

export default function PaymentSettingsForm({ methods, bank, qrUrl, env, storeCurrency, liveRates }: Props) {
  const [pending, start] = useTransition();
  const closeModal = useCloseSettingsModal();
  const [bankCur, setBankCur] = useState(bank.currency && CURRENCY_NAMES[bank.currency] ? bank.currency : storeCurrency);
  const [manualRate, setManualRate] = useState(bank.manual_rate ?? "");
  const foreign = bankCur !== storeCurrency;
  const live = liveRates[bankCur] ?? 0;
  const effectiveRate = Number(manualRate) > 0 ? Number(manualRate) : live;
  const [bankOn, setBankOn] = useState(methods.bank_transfer.enabled);
  const [qr, setQr] = useState(qrUrl ?? "");
  const [uploading, setUploading] = useState(false);

  const uploadQr = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Choose an image file");
    setUploading(true);
    const supabase = createClient();
    const path = `qr/${Date.now()}.${file.name.split(".").pop() || "png"}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) return void toast.error(error.message);
    setQr(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    toast.success("QR uploaded — remember to save");
  };

  return (
    <form
      className="card space-y-6 p-6"
      action={(fd) => {
        fd.set("bank_qr_url", qr);
        start(async () => {
          const res = await savePaymentSettings(fd);
          if (res.error) toast.error(res.error);
          else {
            toast.success("Payment settings saved");
            closeModal();
          }
        });
      }}
    >
      <h3 className="font-semibold">Payment methods</h3>

      <div className="space-y-3">
        <MethodRow
          name="stripe_enabled"
          icon={<CreditCard size={20} />}
          title="Card payments (Stripe)"
          status={methods.stripe}
          notes={[
            methods.stripe.configured ? (env.stripeLive ? "Live keys" : "Test keys") : "Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
            env.stripeWebhook ? "Webhook secret set" : "Webhook secret missing",
          ]}
        />
        <MethodRow
          name="paddle_enabled"
          icon={<Wallet size={20} />}
          title="Paddle"
          status={methods.paddle}
          notes={[
            methods.paddle.configured ? `Environment: ${env.paddleEnv}` : "Add PADDLE_API_KEY and NEXT_PUBLIC_PADDLE_CLIENT_TOKEN",
            env.paddleWebhook ? "Webhook secret set" : "Webhook secret missing",
          ]}
        />
        <MethodRow
          name="bank_enabled"
          icon={<Landmark size={20} />}
          title="Bank transfer / QR"
          status={{ ...methods.bank_transfer, enabled: bankOn }}
          onToggle={setBankOn}
          notes={[
            methods.bank_transfer.configured ? "Bank details set" : "Add an account number or QR code below",
            "Customers pay first and attach proof; you verify and confirm each order",
          ]}
        />
      </div>

      <div className={cn("space-y-4 rounded-xl border border-clay-100 p-5 transition", !bankOn && "opacity-60")}>
        <h3 className="font-semibold">Bank transfer details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank name" name="bank_name" value={bank.bank_name} placeholder="e.g. Nabil Bank" />
          <Field label="Account holder name" name="account_name" value={bank.account_name} />
          <Field label="Account number / IBAN" name="account_number" value={bank.account_number} />
          <Field label="Branch" name="branch" value={bank.branch} />
          <Field label="SWIFT / IFSC / routing" name="swift" value={bank.swift} />
        </div>

        {/* Currency of the bank account — customers are shown the converted amount to pay */}
        <div className="rounded-lg bg-clay-50 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="bank-currency">Bank account currency</label>
              <select id="bank-currency" name="currency" className="input" value={bankCur} onChange={(e) => setBankCur(e.target.value)}>
                <option value={storeCurrency}>{storeCurrency} — same as store prices</option>
                {Object.keys(CURRENCY_NAMES)
                  .filter((c) => c !== storeCurrency)
                  .map((c) => (
                    <option key={c} value={c}>{c} — {CURRENCY_NAMES[c]}</option>
                  ))}
              </select>
            </div>
            {foreign && (
              <div>
                <label className="label" htmlFor="manual-rate">Your own rate (optional)</label>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-sm text-ink/60">1 {storeCurrency} =</span>
                  <input
                    id="manual-rate"
                    name="manual_rate"
                    type="number"
                    step="0.0001"
                    min="0"
                    className="input"
                    value={manualRate}
                    onChange={(e) => setManualRate(e.target.value)}
                    placeholder={live ? formatRate(live) : "live rate"}
                  />
                  <span className="shrink-0 text-sm text-ink/60">{bankCur}</span>
                </div>
              </div>
            )}
          </div>
          {foreign && (
            <p className="mt-3 text-sm text-ink/70">
              {Number(manualRate) > 0 ? (
                <>Using <strong>your fixed rate</strong>: 1 {storeCurrency} = {formatRate(Number(manualRate))} {bankCur}.</>
              ) : live ? (
                <>Using the <strong>live rate</strong> (updated daily): 1 {storeCurrency} = {formatRate(live)} {bankCur}.</>
              ) : (
                <span className="text-red-700">No live rate available for {bankCur} right now — enter your own rate.</span>
              )}{" "}
              {effectiveRate > 0 && (
                <>
                  A {formatPrice(50)} order is shown to customers as <strong>{formatBankAmount(convertForBank(50, effectiveRate, bankCur), bankCur)}</strong>.
                </>
              )}
              {Number(manualRate) <= 0 && live ? " Leave the rate box empty to keep following the live rate, or enter your bank's rate to fix it." : ""}
            </p>
          )}
        </div>
        <div>
          <label className="label">Instructions for customers</label>
          <textarea
            name="instructions"
            className="input min-h-20"
            defaultValue={bank.instructions ?? ""}
            placeholder="e.g. Orders are confirmed within 24 hours of receiving payment."
          />
        </div>

        <div>
          <label className="label">Payment QR code</label>
          <p className="mb-3 text-xs text-ink/50">Upload your bank, eSewa, Khalti, Fonepay, UPI or any wallet QR. It&apos;s shown to customers after they order.</p>
          <div className="flex flex-wrap items-center gap-4">
            {qr ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="Payment QR" className="h-36 w-36 rounded-xl border border-clay-100 bg-white object-contain p-2" />
                <button
                  type="button"
                  onClick={() => setQr("")}
                  className="absolute -right-2 -top-2 rounded-full bg-white p-1.5 text-red-600 shadow ring-1 ring-clay-100"
                  title="Remove QR"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="flex h-36 w-36 items-center justify-center rounded-xl border-2 border-dashed border-clay-200 text-xs text-ink/40">No QR yet</div>
            )}
            <label className="btn-outline cursor-pointer">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              {qr ? "Replace QR" : "Upload QR"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadQr(e.target.files?.[0])} />
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary px-8" disabled={pending || uploading}>{pending ? "Saving…" : "Save payment settings"}</button>
      </div>
    </form>
  );
}

function MethodRow({
  name,
  icon,
  title,
  status,
  notes,
  onToggle,
}: {
  name: string;
  icon: React.ReactNode;
  title: string;
  status: MethodStatus;
  notes: string[];
  onToggle?: (on: boolean) => void;
}) {
  const [on, setOn] = useState(status.enabled);
  const live = on && status.configured;
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-clay-100 p-3 hover:border-clay-300 sm:gap-4 sm:p-4">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", live ? "bg-green-100 text-green-700" : "bg-clay-100 text-ink/50")}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
          {title}
          <span className={cn("badge", live ? "bg-green-100 text-green-800" : on ? "bg-yellow-100 text-yellow-800" : "bg-gray-200 text-gray-600")}>
            {live ? "live at checkout" : on ? "needs setup" : "off"}
          </span>
        </span>
        <span className="block text-xs text-ink/50">{notes.join(" · ")}</span>
      </span>
      <input
        type="checkbox"
        name={name}
        checked={on}
        onChange={(e) => {
          setOn(e.target.checked);
          onToggle?.(e.target.checked);
        }}
        className="peer sr-only"
      />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-clay-200 transition peer-checked:bg-clay-700 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}

function Field({ label, name, value, placeholder }: { label: string; name: string; value?: string; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} className="input" defaultValue={value ?? ""} placeholder={placeholder} />
    </div>
  );
}
