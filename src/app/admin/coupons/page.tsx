import { requireAdmin } from "@/lib/admin";
import CouponManager from "./CouponManager";
import type { Coupon } from "@/lib/types";

export const metadata = { title: "Coupons" };

export default async function AdminCoupons() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Coupons</h1>
      <CouponManager coupons={(data as Coupon[]) ?? []} />
    </div>
  );
}
