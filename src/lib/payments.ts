import type { PaymentProvider, StoreSettings } from "./types";

export type MethodStatus = { enabled: boolean; configured: boolean; available: boolean };

/**
 * A method is available at checkout only when the admin has switched it on AND it is configured
 * (API keys in the environment, or bank details / QR code entered in settings).
 */
export function paymentMethods(settings: StoreSettings): Record<PaymentProvider, MethodStatus> {
  const bank = settings.bank_details ?? {};
  const status = (enabled: boolean, configured: boolean) => ({ enabled, configured, available: enabled && configured });
  return {
    stripe: status(
      settings.stripe_enabled !== false,
      !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ),
    paddle: status(
      settings.paddle_enabled !== false,
      !!process.env.PADDLE_API_KEY && !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    ),
    bank_transfer: status(settings.bank_enabled === true, !!(bank.account_number?.trim() || settings.bank_qr_url)),
  };
}
