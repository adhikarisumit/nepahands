import { getUserAndProfile } from "@/lib/supabase/server";
import CheckoutForm from "./CheckoutForm";
import { getFreshSettings } from "@/lib/settings";
import { getBankFx, type BankFx } from "@/lib/fx";
import { paymentMethods } from "@/lib/payments";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const { cancelled } = await searchParams;
  const { supabase, user, profile } = await getUserAndProfile();
  const fullName = profile?.full_name ?? "";
  const phone = profile?.phone ?? "";

  // Pre-fill the address from the customer's most recent order; load alongside settings.
  const [lastOrder, settings] = await Promise.all([
    user
      ? supabase
          .from("orders")
          .select("shipping_address")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getFreshSettings(), // payment details must be current, not a cached copy
  ]);
  const lastAddress = lastOrder.data?.shipping_address ?? null;
  const methods = paymentMethods(settings);

  // Bank account in another currency (e.g. NPR): convert the total at the current rate.
  let bankFx: BankFx | null = null;
  let bankFxError = false;
  if (methods.bank_transfer.available) {
    try {
      bankFx = await getBankFx(settings);
    } catch {
      bankFxError = true;
    }
  }

  return (
    <div className="container-x py-10">
      <h1 className="mb-2 text-4xl font-semibold">Checkout</h1>
      {cancelled && <p className="mb-6 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">Payment was cancelled. Your cart is still here.</p>}
      <CheckoutForm
        defaultEmail={user?.email ?? ""}
        isLoggedIn={!!user}
        defaultAddress={lastAddress ?? { full_name: fullName, phone, line1: "", city: "", postal_code: "", country: "AU" }}
        stripeEnabled={methods.stripe.available}
        paddleEnabled={methods.paddle.available}
        bankEnabled={methods.bank_transfer.available}
        bank={settings.bank_details ?? {}}
        bankQrUrl={settings.bank_qr_url ?? null}
        bankFx={bankFx}
        bankFxError={bankFxError}
      />
    </div>
  );
}
