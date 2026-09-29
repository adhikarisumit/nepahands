import "server-only";
import type Stripe from "stripe";
import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "./catalog";
import { createAdminClient } from "./supabase/admin";
import { getStripe } from "./stripe";
import { paddleRequest } from "./paddle";
import { fromMinor } from "./money";

/** Idempotent: marks the order paid, decrements stock and counts coupon use only once. */
export async function markOrderPaid(orderId: string, paymentId: string | null) {
  const db = createAdminClient();
  const { data, error } = await db.rpc("mark_order_paid", { p_order_id: orderId, p_payment_id: paymentId });
  if (error) throw new Error(error.message);
  if (data) {
    // Stock changed — refresh cached product pages. Next.js forbids this during a page render
    // (the success-page fallback path); the 5-minute cache revalidate covers that case.
    try {
      revalidateTag(CATALOG_TAG);
    } catch {
      /* called during render */
    }
  }
  return data as boolean;
}

export async function handleStripeSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id || session.client_reference_id;
  if (!orderId || session.payment_status !== "paid") return false;
  const paymentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? session.id;
  return markOrderPaid(orderId, paymentId);
}

export async function confirmStripeSession(sessionId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  return handleStripeSession(session);
}

type PaddleTransaction = {
  id: string;
  status: string;
  custom_data?: { order_id?: string } | null;
  currency_code: string;
  details?: { totals?: { tax?: string; grand_total?: string; total?: string } };
};

export async function handlePaddleTransaction(txn: PaddleTransaction) {
  const orderId = txn.custom_data?.order_id;
  if (!orderId || !["paid", "completed"].includes(txn.status)) return false;

  const changed = await markOrderPaid(orderId, txn.id);
  const totals = txn.details?.totals;
  if (changed && totals) {
    // Paddle adds sales tax as merchant of record — store what the customer actually paid.
    await createAdminClient()
      .from("orders")
      .update({
        tax: fromMinor(totals.tax ?? 0, txn.currency_code),
        total: fromMinor(totals.grand_total ?? totals.total ?? 0, txn.currency_code),
      })
      .eq("id", orderId);
  }
  return changed;
}

export async function confirmPaddleTransaction(transactionId: string) {
  const { data } = await paddleRequest<{ data: PaddleTransaction }>(`/transactions/${encodeURIComponent(transactionId)}`);
  return handlePaddleTransaction(data);
}
