import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { quoteCart } from "@/lib/pricing";

export async function POST(req: Request) {
  try {
    const { items, coupon } = await req.json();
    const quote = await quoteCart(createAdminClient(), items ?? [], coupon);
    return NextResponse.json({
      subtotal: quote.subtotal,
      discount: quote.discount,
      shipping: quote.shipping,
      tax: quote.tax,
      total: quote.total,
      coupon: quote.coupon ? { code: quote.coupon.code, type: quote.coupon.type, value: quote.coupon.value } : null,
      couponError: quote.couponError ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
