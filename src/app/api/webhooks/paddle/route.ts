import { NextResponse } from "next/server";
import { verifyPaddleSignature } from "@/lib/paddle";
import { handlePaddleTransaction } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });

  const raw = await req.text();
  if (!verifyPaddleSignature(raw, req.headers.get("paddle-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw) as { event_type: string; data: any };
  const db = createAdminClient();

  try {
    switch (event.event_type) {
      case "transaction.paid":
      case "transaction.completed":
        await handlePaddleTransaction(event.data);
        break;

      case "transaction.canceled": {
        const orderId = event.data?.custom_data?.order_id;
        if (orderId) await db.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending");
        break;
      }

      case "adjustment.created":
      case "adjustment.updated": {
        const adj = event.data;
        if (adj?.action === "refund" && adj?.status === "approved" && adj?.transaction_id) {
          await db.from("orders").update({ status: "refunded" }).eq("payment_id", adj.transaction_id);
        }
        break;
      }
    }
  } catch (e) {
    console.error("Paddle webhook error", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
