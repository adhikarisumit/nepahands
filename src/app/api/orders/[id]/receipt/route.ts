import { NextResponse } from "next/server";
import { getUserAndProfile } from "@/lib/supabase/server";
import { SALE_STATUSES } from "@/lib/analytics";
import { buildReceiptPdf } from "@/lib/receiptPdf";
import { BRAND } from "@/lib/branding";
import type { Order } from "@/lib/types";

/**
 * PDF receipt for a paid order. The order is loaded with the viewer's own session, so Row Level
 * Security only returns it to its owner (or an admin). Unpaid orders have no receipt.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const { supabase, user } = await getUserAndProfile();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const order = data as Order;
  if (!SALE_STATUSES.includes(order.status)) {
    return NextResponse.json({ error: "A receipt is available once payment for this order is confirmed." }, { status: 403 });
  }

  const pdf = await buildReceiptPdf(order);
  const filename = `${BRAND.name.replace(/[^A-Za-z0-9]+/g, "-")}-receipt-${order.order_number}.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
