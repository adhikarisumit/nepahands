import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { quoteCart, type RequestedItem } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";
import { paddleRequest } from "@/lib/paddle";
import { toMinor } from "@/lib/money";
import { CURRENCY, siteUrl } from "@/lib/utils";
import { paymentMethods } from "@/lib/payments";
import { BRAND } from "@/lib/branding";
import { getBankFx } from "@/lib/fx";
import { convertForBank, encodeBankPayment } from "@/lib/bankCurrency";
import type { PaymentProvider, ShippingAddress, StoreSettings } from "@/lib/types";

type Body = {
  provider: PaymentProvider;
  items: RequestedItem[];
  coupon?: string | null;
  email: string;
  address: ShippingAddress;
  notes?: string;
  /** Bank transfer: code the customer put in the transfer remark, and their bank's transaction ID. */
  bankCode?: string;
  bankReference?: string;
  /** Exchange rate the customer was shown (bank account in another currency). */
  bankRate?: number;
};

const REQUIRED_ADDRESS: (keyof ShippingAddress)[] = ["full_name", "line1", "city", "postal_code", "country"];
const PROOF_TYPES = ["image/png", "image/jpeg", "image/webp", "image/heic", "application/pdf"];
// Vercel rejects request bodies over 4.5 MB, so the screenshot sent with the order stays under 4 MB.
const PROOF_MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  let body: Body;
  let proof: File | null = null;
  try {
    // Bank-transfer orders arrive as multipart (order JSON + optional payment screenshot).
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData();
      body = JSON.parse(String(form.get("payload") ?? "{}"));
      const f = form.get("proof");
      if (f instanceof File && f.size > 0) proof = f;
    } else {
      body = await req.json();
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Bank transfer is pay-first: the order is only accepted with proof of payment.
  const bankReference = body.bankReference?.toString().trim().slice(0, 120) ?? "";
  const bankCode = /^NH-[A-Z0-9]{6}$/.test(body.bankCode ?? "") ? body.bankCode! : null;
  if (body.provider === "bank_transfer") {
    if (!bankReference && !proof) return bad("Please pay first, then add your transaction ID or a payment screenshot");
    if (proof) {
      if (proof.size > PROOF_MAX_BYTES) return bad("Screenshot must be under 4 MB");
      if (!PROOF_TYPES.includes(proof.type)) return bad("Upload the payment proof as an image or PDF");
    }
  }

  if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) return bad("Enter a valid email");
  for (const f of REQUIRED_ADDRESS) if (!body.address?.[f]?.toString().trim()) return bad("Please complete your shipping address");

  const db = createAdminClient();

  // Only accept methods the admin has switched on and configured.
  const { data: settings } = await db.from("store_settings").select("*").eq("id", 1).single();
  const methods = paymentMethods((settings ?? {}) as StoreSettings);
  if (!methods[body.provider]?.available) return bad("That payment method is not available");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Purchases require an account (no guest checkout).
  if (!user) return bad("Please sign in to place an order", 401);

  let quote;
  try {
    quote = await quoteCart(db, body.items, body.coupon);
  } catch (e) {
    return bad((e as Error).message);
  }
  if (quote.couponError) return bad(quote.couponError);

  // Bank account in another currency (e.g. NPR): lock in the converted amount the customer paid.
  // We honour the rate they were shown as long as it's still close to the current one.
  let bankPaymentId = bankCode;
  if (body.provider === "bank_transfer") {
    let fx;
    try {
      fx = await getBankFx((settings ?? {}) as StoreSettings);
    } catch {
      return bad("We couldn't get the exchange rate right now. Please try again in a minute.", 503);
    }
    if (fx) {
      const shown = Number(body.bankRate);
      if (!(shown > 0) || Math.abs(shown - fx.rate) / fx.rate > 0.03) {
        return bad("The exchange rate has changed. Please refresh the page and check the amount before paying.", 409);
      }
      const code = bankCode ?? `ORDER`;
      bankPaymentId = encodeBankPayment({ code, currency: fx.currency, amount: convertForBank(quote.total, shown, fx.currency), rate: shown });
    }
  }

  const address: ShippingAddress = {
    full_name: body.address.full_name.trim(),
    phone: body.address.phone?.trim(),
    line1: body.address.line1.trim(),
    line2: body.address.line2?.trim(),
    city: body.address.city.trim(),
    state: body.address.state?.trim(),
    postal_code: body.address.postal_code.trim(),
    country: body.address.country.trim(),
  };

  // 1. Create the pending order (service role; owned by the signed-in customer)
  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: user.id,
      email: body.email.trim().toLowerCase(),
      status: "pending",
      payment_provider: body.provider,
      subtotal: quote.subtotal,
      discount: quote.discount,
      shipping: quote.shipping,
      tax: quote.tax,
      total: quote.total,
      currency: CURRENCY,
      coupon_code: quote.coupon?.code ?? null,
      shipping_address: address,
      notes: body.notes?.slice(0, 1000) || null,
    })
    .select("id, order_number")
    .single();
  if (error || !order) return bad(error?.message ?? "Could not create order", 500);

  const { error: itemsError } = await db.from("order_items").insert(quote.lines.map((l) => ({ ...l, order_id: order.id })));
  if (itemsError) {
    await db.from("orders").delete().eq("id", order.id);
    return bad(itemsError.message, 500);
  }

  // 2. Bank transfer: the customer has already paid — store their proof with the order.
  //    It stays pending until an admin checks the bank account and confirms it
  //    (stock and coupon usage are only counted at that point).
  if (body.provider === "bank_transfer") {
    const update: Record<string, string> = {};
    if (bankReference) update.payment_reference = bankReference;
    // Remark code shown at checkout (+ converted amount and rate for a foreign-currency account)
    if (bankPaymentId) update.payment_id = bankPaymentId;
    if (proof) {
      const ext = proof.type === "application/pdf" ? "pdf" : proof.type.split("/")[1];
      const path = `${order.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await db.storage.from("payment-proofs").upload(path, proof, { contentType: proof.type });
      if (uploadError) {
        await db.from("orders").delete().eq("id", order.id); // don't keep an order without its proof
        return bad(`Could not upload your payment proof: ${uploadError.message}`, 500);
      }
      update.payment_proof_path = path;
    }
    const { error: proofError } = await db.from("orders").update(update).eq("id", order.id);
    if (proofError) {
      await db.from("orders").delete().eq("id", order.id);
      return bad(proofError.message, 500);
    }
    return NextResponse.json({ provider: "bank_transfer", orderId: order.id });
  }

  // 3. Create the payment session
  try {
    if (body.provider === "stripe") {
      const url = await createStripeSession(order, quote, body.email);
      return NextResponse.json({ provider: "stripe", url, orderId: order.id });
    }
    const transactionId = await createPaddleTransaction(order, quote);
    await db.from("orders").update({ payment_id: transactionId }).eq("id", order.id);
    return NextResponse.json({ provider: "paddle", transactionId, orderId: order.id });
  } catch (e) {
    await db.from("orders").update({ status: "cancelled", notes: `Payment init failed: ${(e as Error).message}` }).eq("id", order.id);
    return bad((e as Error).message, 502);
  }
}

async function createStripeSession(
  order: { id: string; order_number: number },
  quote: Awaited<ReturnType<typeof quoteCart>>,
  email: string
) {
  const stripe = getStripe();
  const currency = CURRENCY.toLowerCase();

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = quote.lines.map((l) => ({
    quantity: l.quantity,
    price_data: {
      currency,
      unit_amount: toMinor(l.price, CURRENCY),
      product_data: { name: l.name, ...(l.image?.startsWith("http") ? { images: [l.image] } : {}) },
    },
  }));
  if (quote.tax > 0) {
    line_items.push({
      quantity: 1,
      price_data: { currency, unit_amount: toMinor(quote.tax, CURRENCY), product_data: { name: "Tax" } },
    });
  }

  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (quote.discount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: toMinor(quote.discount, CURRENCY),
      currency,
      duration: "once",
      max_redemptions: 1,
      name: quote.coupon?.code ?? "Discount",
    });
    discounts = [{ coupon: coupon.id }];
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    client_reference_id: order.id,
    metadata: { order_id: order.id },
    payment_intent_data: { metadata: { order_id: order.id } },
    line_items,
    discounts,
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: quote.shipping === 0 ? "Free shipping" : "Standard shipping",
          fixed_amount: { amount: toMinor(quote.shipping, CURRENCY), currency },
        },
      },
    ],
    success_url: `${siteUrl()}/checkout/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/checkout?cancelled=1`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

async function createPaddleTransaction(order: { id: string; order_number: number }, quote: Awaited<ReturnType<typeof quoteCart>>) {
  // Paddle is merchant of record and calculates sales tax itself, so we charge the
  // pre-tax amount (items − discount + shipping) as one non-catalog line item.
  const amount = quote.subtotal - quote.discount + quote.shipping;
  const itemCount = quote.lines.reduce((n, l) => n + l.quantity, 0);
  const res = await paddleRequest<{ data: { id: string } }>("/transactions", {
    method: "POST",
    body: JSON.stringify({
      items: [
        {
          quantity: 1,
          price: {
            name: `Order #${order.order_number}`,
            description: quote.lines.map((l) => `${l.quantity}× ${l.name}`).join(", ").slice(0, 400),
            unit_price: { amount: String(toMinor(amount, CURRENCY)), currency_code: CURRENCY },
            product: {
              name: `${BRAND.name} order (${itemCount} item${itemCount > 1 ? "s" : ""})`,
              tax_category: "standard",
            },
          },
        },
      ],
      currency_code: CURRENCY,
      custom_data: { order_id: order.id },
    }),
  });
  return res.data.id;
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
