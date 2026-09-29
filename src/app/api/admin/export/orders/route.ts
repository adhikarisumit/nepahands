import { NextResponse } from "next/server";
import { getUserAndProfile } from "@/lib/supabase/server";
import { isRange, RANGES } from "@/lib/analytics";
import { PROVIDER_LABEL, type Order, type PaymentProvider } from "@/lib/types";

/** Admin-only CSV export of orders placed in the selected Analytics range. */
export async function GET(req: Request) {
  const { supabase, profile } = await getUserAndProfile();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const param = new URL(req.url).searchParams.get("range") ?? undefined;
  const range = isRange(param) ? param : "30d";
  const since = new Date(Date.now() - RANGES[range].days * 86_400_000).toISOString();

  const rows: Order[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(name, quantity, price)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows.push(...((data as Order[]) ?? []));
    if (!data || data.length < 1000) break;
  }

  // Quote every field; neutralise values that spreadsheets would treat as formulas.
  const cell = (v: unknown) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = [
    "Order", "Date", "Status", "Email", "Customer", "Country", "Payment", "Items",
    "Subtotal", "Discount", "Coupon", "Shipping", "Tax", "Total", "Currency", "Tracking",
  ];
  const lines = rows.map((o) =>
    [
      o.order_number,
      new Date(o.created_at).toISOString(),
      o.status,
      o.email,
      o.shipping_address?.full_name,
      o.shipping_address?.country,
      o.payment_provider ? PROVIDER_LABEL[o.payment_provider as PaymentProvider] ?? o.payment_provider : "",
      (o.order_items ?? []).map((i) => `${i.quantity} x ${i.name}`).join("; "),
      o.subtotal,
      o.discount,
      o.coupon_code,
      o.shipping,
      o.tax,
      o.total,
      o.currency,
      o.tracking_number,
    ]
      .map(cell)
      .join(",")
  );
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${range}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
