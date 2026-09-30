"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog";
import { SETTINGS_TAG } from "@/lib/settings";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { isValidLink } from "@/lib/homepage";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

type Result = { error?: string; ok?: boolean };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v === "" ? null : Number(v);
};

// ---------- Products ----------
export async function saveProduct(id: string | null, fd: FormData): Promise<Result> {
  const { supabase } = await requireAdmin();
  const name = str(fd, "name");
  const price = num(fd, "price");
  if (!name) return { error: "Name is required" };
  if (price == null || isNaN(price) || price < 0) return { error: "Enter a valid price" };

  const payload = {
    name,
    slug: slugify(str(fd, "slug") || name),
    description: str(fd, "description") || null,
    price,
    compare_at_price: num(fd, "compare_at_price"),
    stock: Math.max(0, Math.floor(num(fd, "stock") ?? 0)),
    sku: str(fd, "sku") || null,
    category_id: str(fd, "category_id") || null,
    artisan: str(fd, "artisan") || null,
    material: str(fd, "material") || null,
    origin: str(fd, "origin") || null,
    images: JSON.parse(str(fd, "images") || "[]") as string[],
    featured: fd.get("featured") === "on",
    active: fd.get("active") === "on",
  };

  const { error } = id
    ? await supabase.from("products").update(payload).eq("id", id)
    : await supabase.from("products").insert(payload);
  if (error) return { error: error.code === "23505" ? "A product with this slug already exists" : error.message };

  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function toggleProduct(id: string, field: "active" | "featured", value: boolean): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").update({ [field]: value }).eq("id", id);
  if (error) return { error: error.message };
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
  return { ok: true };
}

// ---------- Categories ----------
export async function saveCategory(id: string | null, fd: FormData): Promise<Result> {
  const { supabase } = await requireAdmin();
  const name = str(fd, "name");
  if (!name) return { error: "Name is required" };
  const payload = {
    name,
    slug: slugify(str(fd, "slug") || name),
    description: str(fd, "description") || null,
    image_url: str(fd, "image_url") || null,
  };
  const { error } = id
    ? await supabase.from("categories").update(payload).eq("id", id)
    : await supabase.from("categories").insert(payload);
  if (error) return { error: error.code === "23505" ? "Slug already in use" : error.message };
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/categories");
  return { ok: true };
}

// ---------- Orders ----------
const PAID_STATUSES: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

export async function updateOrder(id: string, fd: FormData): Promise<Result> {
  const { supabase } = await requireAdmin();
  const status = str(fd, "status") as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) return { error: "Invalid status" };

  // Moving a pending order to a paid state (e.g. a confirmed bank transfer) goes through
  // mark_order_paid so stock and coupon usage are counted exactly once.
  const { data: current } = await supabase.from("orders").select("status").eq("id", id).single();
  if (current?.status === "pending" && PAID_STATUSES.includes(status)) {
    const { error: rpcError } = await createAdminClient().rpc("mark_order_paid", { p_order_id: id, p_payment_id: null });
    if (rpcError) return { error: rpcError.message };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status, tracking_number: str(fd, "tracking_number") || null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateTag(CATALOG_TAG); // stock may have changed
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function confirmBankPayment(id: string): Promise<Result> {
  await requireAdmin();
  const { data: changed, error } = await createAdminClient().rpc("mark_order_paid", { p_order_id: id, p_payment_id: null });
  if (error) return { error: error.message };
  if (!changed) return { error: "Order is not awaiting payment" };
  revalidateTag(CATALOG_TAG); // stock may have changed
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

// ---------- Customers ----------
export async function setRole(userId: string, role: "customer" | "admin"): Promise<Result> {
  const { supabase, user } = await requireAdmin();
  if (userId === user.id) return { error: "You can't change your own role" };
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/customers");
  revalidatePath("/admin/settings");
  return { ok: true };
}

/**
 * Creates a confirmed account (customer or admin) with a temporary password.
 * Uses the Supabase Auth admin API, so it only runs on the server for signed-in admins.
 */
export async function createUser(fd: FormData): Promise<Result & { email?: string }> {
  await requireAdmin();
  const email = str(fd, "email").toLowerCase();
  const fullName = str(fd, "full_name").slice(0, 120);
  const role = str(fd, "role") === "admin" ? "admin" : "customer";
  const password = String(fd.get("password") ?? "");

  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address" };
  if (!fullName) return { error: "Enter the person's name" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // can sign in immediately
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    const msg = error?.message ?? "Could not create the account";
    return { error: /already|registered|exists/i.test(msg) ? "An account with this email already exists" : msg };
  }

  // The signup trigger creates the profile; set the name and role (upsert in case the trigger hasn't run).
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: data.user.id, email, full_name: fullName, role }, { onConflict: "id" });
  if (profileError) return { error: `Account created, but setting the role failed: ${profileError.message}` };

  revalidatePath("/admin/settings");
  revalidatePath("/admin/customers");
  return { ok: true, email };
}

// ---------- Coupons ----------
export async function saveCoupon(id: string | null, fd: FormData): Promise<Result> {
  const { supabase } = await requireAdmin();
  const code = str(fd, "code").toUpperCase().replace(/\s+/g, "");
  const type = str(fd, "type");
  const value = num(fd, "value");
  if (!code) return { error: "Code is required" };
  if (!["percent", "fixed"].includes(type)) return { error: "Invalid type" };
  if (!value || value <= 0) return { error: "Value must be positive" };
  if (type === "percent" && value > 100) return { error: "Percent can't exceed 100" };

  const expires = str(fd, "expires_at");
  const payload = {
    code,
    type,
    value,
    min_order: num(fd, "min_order") ?? 0,
    max_uses: num(fd, "max_uses"),
    expires_at: expires ? new Date(expires).toISOString() : null,
    active: fd.get("active") === "on",
    is_public: fd.get("is_public") === "on",
    description: str(fd, "description") || null,
  };
  const { error } = id
    ? await supabase.from("coupons").update(payload).eq("id", id)
    : await supabase.from("coupons").insert(payload);
  if (error) return { error: error.code === "23505" ? "That code already exists" : error.message };
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function deleteCoupon(id: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/coupons");
  return { ok: true };
}

// ---------- Reviews ----------
export async function deleteReview(id: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/reviews");
  return { ok: true };
}

// ---------- Settings ----------
export async function saveSettings(fd: FormData): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("store_settings")
    .update({
      shipping_flat: Math.max(0, num(fd, "shipping_flat") ?? 0),
      // Products priced above this pay shipping; at or below it they ship free (see lib/shipping.ts)
      free_shipping_threshold: Math.max(0, num(fd, "free_shipping_threshold") ?? 0),
      tax_rate: num(fd, "tax_rate") ?? 0,
      announcement: str(fd, "announcement").slice(0, 200) || null,
      contact_email: str(fd, "contact_email") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Saves the homepage hero (Admin → Homepage). Pass reset=1 to go back to the default content. */
export async function saveHero(fd: FormData): Promise<Result> {
  const { supabase } = await requireAdmin();
  const reset = fd.get("reset") === "1";

  const hero: Record<string, string> = {};
  if (!reset) {
    const text = (k: string, max: number) => str(fd, k).slice(0, max);
    hero.eyebrow = text("eyebrow", 80);
    hero.title = text("title", 160);
    hero.subtitle = text("subtitle", 400);
    hero.cta_label = text("cta_label", 40);
    hero.cta_link = text("cta_link", 300);
    hero.secondary_label = text("secondary_label", 40);
    hero.secondary_link = text("secondary_link", 300);
    hero.image_1 = text("image_1", 1000);
    hero.image_2 = text("image_2", 1000);

    if (!hero.title) return { error: "Add a headline" };
    if (!hero.cta_label) return { error: "Add a label for the main button" };
    for (const k of ["cta_link", "secondary_link"] as const) {
      if (hero[k] && !isValidLink(hero[k])) return { error: "Links must start with / (a page on this site) or https://" };
    }
    for (const k of ["image_1", "image_2"] as const) {
      if (hero[k] && !/^(\/(?!\/)|https:\/\/)\S+$/i.test(hero[k])) return { error: "Images must be uploaded or use an https:// link" };
    }
  }

  // Keep anything else stored in the same JSON column.
  const { data: row } = await supabase.from("store_settings").select("branding").eq("id", 1).single();
  const branding = { ...((row?.branding as Record<string, unknown>) ?? {}) };
  if (reset) delete branding.hero;
  else branding.hero = hero;

  const { error } = await supabase.from("store_settings").update({ branding, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) return { error: error.message };
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/");
  revalidatePath("/admin/homepage");
  return { ok: true };
}

export async function savePaymentSettings(fd: FormData): Promise<Result> {
  const { supabase } = await requireAdmin();
  const qr = str(fd, "bank_qr_url");
  if (qr && !/^https?:\/\//.test(qr)) return { error: "QR code must be an image URL" };
  const { error } = await supabase
    .from("store_settings")
    .update({
      stripe_enabled: fd.get("stripe_enabled") === "on",
      paddle_enabled: fd.get("paddle_enabled") === "on",
      bank_enabled: fd.get("bank_enabled") === "on",
      bank_details: {
        bank_name: str(fd, "bank_name"),
        account_name: str(fd, "account_name"),
        account_number: str(fd, "account_number"),
        branch: str(fd, "branch"),
        swift: str(fd, "swift"),
        instructions: str(fd, "instructions").slice(0, 1000),
        // Bank account currency (e.g. NPR) and an optional fixed exchange rate; blank = live rate
        currency: /^[A-Z]{3}$/.test(str(fd, "currency").toUpperCase()) ? str(fd, "currency").toUpperCase() : "",
        manual_rate: (num(fd, "manual_rate") ?? 0) > 0 ? String(num(fd, "manual_rate")) : "",
      },
      bank_qr_url: qr || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) {
    return { error: error.code === "42703" || error.code === "PGRST204" ? "Run supabase/migrations/003_payment_methods.sql first" : error.message };
  }
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}
