import { Tag } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import CouponCard from "./CouponCard";
import type { Coupon } from "@/lib/types";

export const metadata = { title: "Available coupons" };
export const dynamic = "force-dynamic";

export default async function AccountCoupons() {
  // Coupons are admin-only under RLS; read the public ones with the server key and expose only safe fields.
  const { data } = await createAdminClient()
    .from("coupons")
    .select("id, code, type, value, min_order, max_uses, used_count, expires_at, description")
    .eq("active", true)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const now = new Date();
  const coupons = ((data ?? []) as Coupon[]).filter(
    (c) => (!c.expires_at || new Date(c.expires_at) > now) && (c.max_uses == null || c.used_count < c.max_uses)
  );

  return (
    <div>
      <h2 className="text-2xl font-semibold">Available coupons</h2>
      <p className="mb-6 mt-1 text-sm text-ink/60">Apply a code to your cart, or copy it to use at checkout.</p>
      {coupons.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-clay-100 text-clay-600">
            <Tag size={28} />
          </span>
          <h3 className="mt-5 text-xl font-semibold">No coupons right now</h3>
          <p className="mt-2 max-w-sm text-ink/60">Check back soon — we share new offers here first.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {coupons.map((c) => (
            <CouponCard
              key={c.id}
              code={c.code}
              type={c.type}
              value={Number(c.value)}
              minOrder={Number(c.min_order)}
              expiresAt={c.expires_at}
              description={c.description}
            />
          ))}
        </div>
      )}
    </div>
  );
}
