import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/heic", "application/pdf"];
// Vercel rejects request bodies over 4.5 MB, so keep uploads that pass through this route under 4 MB.
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Customer submits bank-transfer proof. The unguessable order UUID acts as the capability,
 * so guests can use it too. Only pending bank-transfer orders accept proof.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const db = createAdminClient();
  const { data: order } = await db.from("orders").select("id, status, payment_provider").eq("id", id).maybeSingle();
  if (!order || order.payment_provider !== "bank_transfer") return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "pending") return NextResponse.json({ error: "This order is no longer awaiting payment" }, { status: 400 });

  const form = await req.formData();
  const reference = String(form.get("reference") ?? "").trim().slice(0, 120);
  const file = form.get("file");

  const update: Record<string, string> = {};
  if (reference) update.payment_reference = reference;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File must be under 4 MB" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Upload an image or PDF" }, { status: 400 });
    const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
    const path = `${id}/${Date.now()}.${ext}`;
    const { error } = await db.storage.from("payment-proofs").upload(path, file, { contentType: file.type });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    update.payment_proof_path = path;
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Add a transaction ID or a screenshot" }, { status: 400 });

  const { error } = await db.from("orders").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
