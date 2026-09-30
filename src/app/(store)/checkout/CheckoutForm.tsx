"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, CreditCard, Lock, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useCart } from "@/store/cart";
import OrderSummary from "@/components/OrderSummary";
import { useQuote } from "@/components/useQuote";
import { cn, CURRENCY, formatPrice, PLACEHOLDER_IMG } from "@/lib/utils";
import type { BankDetails, PaymentProvider, ShippingAddress } from "@/lib/types";
import BankPayFirst, { type BankProof } from "./BankPayFirst";
import { convertForBank, formatBankAmount, formatRate } from "@/lib/bankCurrency";

type Props = {
  defaultEmail: string;
  defaultAddress: ShippingAddress;
  isLoggedIn: boolean;
  stripeEnabled: boolean;
  paddleEnabled: boolean;
  bankEnabled: boolean;
  bank: BankDetails;
  bankQrUrl: string | null;
  /** Set when the bank account is in another currency (e.g. NPR): rate to convert the total. */
  bankFx: { currency: string; rate: number; source: "manual" | "live"; asOf: string | null } | null;
  /** The live exchange rate couldn't be loaded — bank transfer is paused until it can. */
  bankFxError: boolean;
};

/** Short, unambiguous code for the transfer remark (no 0/O or 1/I), e.g. "NH-7K2QXM". */
function makeBankCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "NH-" + Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

const COUNTRIES = [
  ["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"], ["AU", "Australia"], ["IN", "India"],
  ["NP", "Nepal"], ["DE", "Germany"], ["FR", "France"], ["NL", "Netherlands"], ["IT", "Italy"], ["ES", "Spain"],
  ["JP", "Japan"], ["SG", "Singapore"], ["AE", "United Arab Emirates"], ["NZ", "New Zealand"],
];

export default function CheckoutForm({ defaultEmail, defaultAddress, isLoggedIn, stripeEnabled, paddleEnabled, bankEnabled, bank, bankQrUrl, bankFx, bankFxError }: Props) {
  const router = useRouter();
  const { items, coupon, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [address, setAddress] = useState<ShippingAddress>(defaultAddress);
  const [notes, setNotes] = useState("");
  const anyMethod = stripeEnabled || paddleEnabled || bankEnabled;
  const [provider, setProvider] = useState<PaymentProvider>(stripeEnabled ? "stripe" : paddleEnabled ? "paddle" : "bank_transfer");
  const [submitting, setSubmitting] = useState(false);
  const [paddle, setPaddle] = useState<Paddle | undefined>();
  // Bank transfer is pay-first: the customer pays, then attaches proof before placing the order.
  const [bankCode] = useState(makeBankCode);
  const [proof, setProof] = useState<BankProof>({ reference: "", file: null, paid: false });
  const isBank = provider === "bank_transfer";
  const bankReady = !!(proof.reference.trim() || proof.file) && proof.paid && !bankFxError;

  useEffect(() => setMounted(true), []);
  const { quote, loading } = useQuote(mounted ? items : [], coupon);

  // What the customer must transfer: converted to the bank account's currency when it differs (e.g. NPR).
  const bankAmount = !quote
    ? "—"
    : bankFx
      ? formatBankAmount(convertForBank(quote.total, bankFx.rate, bankFx.currency), bankFx.currency)
      : formatPrice(quote.total);
  const bankConversion =
    quote && bankFx ? `= ${formatPrice(quote.total)} ${CURRENCY} · 1 ${CURRENCY} = ${formatRate(bankFx.rate)} ${bankFx.currency}` : null;

  useEffect(() => {
    if (!paddleEnabled) return;
    initializePaddle({
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      eventCallback: (e) => {
        if (e.name === "checkout.completed") {
          clear();
        }
      },
    }).then(setPaddle);
  }, [paddleEnabled, clear]);

  if (!mounted) return null;
  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink/60">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary mt-6">Browse products</Link>
      </div>
    );
  }

  const set = (k: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddress((a) => ({ ...a, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBank) {
      if (!proof.reference.trim() && !proof.file) return void toast.error("Add your transaction ID or a payment screenshot first");
      if (!proof.paid) return void toast.error("Please confirm that you've completed the payment");
      if (proof.file && proof.file.size > 4 * 1024 * 1024) return void toast.error("Screenshot must be under 4 MB");
    }
    setSubmitting(true);
    try {
      const payload = {
        provider,
        email,
        address,
        notes,
        coupon: quote?.couponError ? null : coupon,
        items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        ...(isBank ? { bankCode, bankReference: proof.reference.trim(), bankRate: bankFx?.rate } : {}),
      };
      let res: Response;
      if (isBank) {
        // Order details + payment screenshot travel together, so an order never exists without its proof.
        const fd = new FormData();
        fd.set("payload", JSON.stringify(payload));
        if (proof.file) fd.set("proof", proof.file);
        res = await fetch("/api/checkout", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (data.provider === "stripe") {
        window.location.href = data.url;
        return;
      }
      if (data.provider === "bank_transfer") {
        // Paid and placed — the next page confirms we're verifying the payment.
        clear();
        router.push(`/checkout/success?order=${data.orderId}`);
        return;
      }
      if (!paddle) throw new Error("Paddle is still loading, please try again");
      paddle.Checkout.open({
        transactionId: data.transactionId,
        customer: { email },
        settings: {
          displayMode: "overlay",
          theme: "light",
          successUrl: `${window.location.origin}/checkout/success?order=${data.orderId}&ptxn=${data.transactionId}`,
        },
      });
      setSubmitting(false);
    } catch (err) {
      toast.error((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 grid gap-10 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Contact</h2>
            {!isLoggedIn && (
              <Link href="/login?next=/checkout" className="text-sm text-clay-700 underline">Sign in for faster checkout</Link>
            )}
          </div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </section>

        <section className="card p-6">
          <h2 className="mb-4 text-xl font-semibold">Shipping address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" className="sm:col-span-2"><input className="input" required value={address.full_name} onChange={set("full_name")} /></Field>
            <Field label="Address" className="sm:col-span-2"><input className="input" required value={address.line1} onChange={set("line1")} /></Field>
            <Field label="Apartment, suite (optional)" className="sm:col-span-2"><input className="input" value={address.line2 ?? ""} onChange={set("line2")} /></Field>
            <Field label="City"><input className="input" required value={address.city} onChange={set("city")} /></Field>
            <Field label="State / Province"><input className="input" value={address.state ?? ""} onChange={set("state")} /></Field>
            <Field label="Postal code"><input className="input" required value={address.postal_code} onChange={set("postal_code")} /></Field>
            <Field label="Country">
              <select className="input" required value={address.country} onChange={set("country")}>
                {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            </Field>
            <Field label="Phone (optional)" className="sm:col-span-2"><input className="input" type="tel" value={address.phone ?? ""} onChange={set("phone")} /></Field>
            <Field label="Order notes (optional)" className="sm:col-span-2">
              <textarea className="input min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gift message, delivery instructions…" />
            </Field>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-4 text-xl font-semibold">Payment</h2>
          {!anyMethod && (
            <p className="text-sm text-red-700">No payment methods are available right now. Please contact us to complete your order.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {stripeEnabled && (
              <PayOption active={provider === "stripe"} onClick={() => setProvider("stripe")} icon={<CreditCard size={20} />} title="Card (Stripe)" text="Visa, Mastercard, Amex, Apple Pay, Google Pay" />
            )}
            {paddleEnabled && (
              <PayOption active={provider === "paddle"} onClick={() => setProvider("paddle")} icon={<Wallet size={20} />} title="Paddle" text="Cards, PayPal & local methods. Tax calculated at payment." />
            )}
            {bankEnabled && (
              <PayOption active={provider === "bank_transfer"} onClick={() => setProvider("bank_transfer")} icon={<Landmark size={20} />} title="Bank transfer / QR" text="Pay by bank transfer or scan our QR code, then place your order with proof of payment." />
            )}
          </div>
          {isBank && (
            <BankPayFirst
              bank={bank}
              qrUrl={bankQrUrl}
              amount={bankAmount}
              conversion={bankConversion}
              code={bankCode}
              proof={proof}
              onChange={setProof}
            />
          )}
        </section>
      </div>

      <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        <div className="card p-6">
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-clay-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.image || PLACEHOLDER_IMG} alt="" className="h-full w-full object-cover" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-white">{i.quantity}</span>
                </div>
                <span className="flex-1">{i.name}</span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
        <OrderSummary quote={quote} loading={loading} />
        <button className="btn-primary w-full py-3" disabled={submitting || loading || !!quote?.error || !anyMethod || (isBank && !bankReady)}>
          <Lock size={16} />{" "}
          {submitting
            ? isBank ? "Placing order…" : "Redirecting to payment…"
            : isBank ? "I've paid — place order" : `Pay ${quote ? formatPrice(quote.total) : ""}`}
        </button>
        {isBank && !bankReady && (
          <p className="text-center text-xs text-amber-700">
            {bankFxError
              ? "We can't load the exchange rate right now, so bank transfer is unavailable. Please try again in a minute."
              : `Pay ${bankAmount} first, then add your proof of payment to place the order.`}
          </p>
        )}
        <p className="text-center text-xs text-ink/50">
          By placing your order you agree to our{" "}
          <Link href="/terms" target="_blank" className="underline hover:text-clay-700">Terms of Service</Link>,{" "}
          <Link href="/refund-policy" target="_blank" className="underline hover:text-clay-700">Refund Policy</Link> and{" "}
          <Link href="/privacy-policy" target="_blank" className="underline hover:text-clay-700">Privacy Policy</Link>. We never store your card details.
        </p>
      </div>
    </form>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function PayOption({ active, onClick, icon, title, text }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; text: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex items-start gap-3 rounded-xl border-2 p-4 text-left transition", active ? "border-clay-600 bg-clay-50" : "border-clay-100 hover:border-clay-300")}
    >
      <span className="mt-0.5 text-clay-700">{icon}</span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-ink/60">{text}</span>
      </span>
    </button>
  );
}
