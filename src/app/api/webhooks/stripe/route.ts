import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { handleStripeSession } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch (e) {
    return NextResponse.json({ error: `Invalid signature: ${(e as Error).message}` }, { status: 400 });
  }

  const db = createAdminClient();
  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleStripeSession(event.data.object as Stripe.Checkout.Session);
        break;

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const orderId = s.metadata?.order_id;
        if (orderId) await db.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending");
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (pi && charge.refunded) await db.from("orders").update({ status: "refunded" }).eq("payment_id", pi);
        break;
      }
    }
  } catch (e) {
    console.error("Stripe webhook error", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
