import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Coupon, Product, StoreSettings } from "./types";
import { cartShipping, shippingRule } from "./shipping";

export type RequestedItem = { id: string; quantity: number };

export type PricedLine = {
  product_id: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
};

export type Quote = {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  coupon: Coupon | null;
  couponError?: string;
};

const round = (n: number) => Math.round(n * 100) / 100;

export function couponProblem(coupon: Coupon | null, subtotal: number): string | null {
  if (!coupon || !coupon.active) return "Invalid coupon code";
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return "This coupon has expired";
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) return "This coupon has reached its usage limit";
  if (subtotal < Number(coupon.min_order)) return `Minimum order of ${coupon.min_order} required`;
  return null;
}

/**
 * Prices a cart entirely from database values - client-sent prices are never trusted.
 * Must be called with the service-role client (coupons are admin-only under RLS).
 */
export async function quoteCart(
  db: SupabaseClient,
  items: RequestedItem[],
  couponCode?: string | null
): Promise<Quote> {
  const clean = items
    .filter((i) => i && typeof i.id === "string" && Number.isInteger(i.quantity) && i.quantity > 0)
    .slice(0, 100);
  if (clean.length === 0) throw new Error("Your cart is empty");

  const { data: products, error } = await db
    .from("products")
    .select("id, name, price, stock, images, active")
    .in("id", clean.map((i) => i.id));
  if (error) throw new Error(error.message);

  const lines: PricedLine[] = clean.map((item) => {
    const p = (products as Product[]).find((x) => x.id === item.id);
    if (!p || !p.active) throw new Error("A product in your cart is no longer available");
    if (p.stock < item.quantity) throw new Error(`Only ${p.stock} left of "${p.name}"`);
    return { product_id: p.id, name: p.name, image: p.images?.[0] ?? null, price: Number(p.price), quantity: item.quantity };
  });

  const { data: settingsRow } = await db.from("store_settings").select("*").eq("id", 1).single();
  const settings = (settingsRow ?? { shipping_flat: 0, free_shipping_threshold: 0, tax_rate: 0 }) as StoreSettings;

  const subtotal = round(lines.reduce((s, l) => s + l.price * l.quantity, 0));

  let coupon: Coupon | null = null;
  let couponError: string | undefined;
  let discount = 0;
  if (couponCode) {
    const { data } = await db.from("coupons").select("*").eq("code", couponCode.trim().toUpperCase()).maybeSingle();
    const problem = couponProblem(data as Coupon | null, subtotal);
    if (problem) couponError = problem;
    else {
      coupon = data as Coupon;
      discount =
        coupon.type === "percent" ? round((subtotal * Number(coupon.value)) / 100) : Math.min(Number(coupon.value), subtotal);
    }
  }

  const afterDiscount = round(subtotal - discount);
  // Flat shipping, charged only when the cart has a product priced above the admin's threshold
  // (cheaper items ship free). Based on each product's own price, before discounts.
  const shipping = cartShipping(lines.map((l) => l.price), shippingRule(settings));
  const tax = round((afterDiscount * Number(settings.tax_rate)) / 100);
  const total = round(afterDiscount + shipping + tax);

  return { lines, subtotal, discount, shipping, tax, total, coupon, couponError };
}
