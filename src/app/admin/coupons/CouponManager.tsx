"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { deleteCoupon, saveCoupon } from "../actions";
import type { Coupon } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";

export default function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [pending, start] = useTransition();
  const reset = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="card overflow-x-auto">
        <table className="table-x">
          <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Expires</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {coupons.map((c) => {
              const expired = c.expires_at && new Date(c.expires_at) < new Date();
              return (
                <tr key={c.id}>
                  <td className="font-mono font-semibold">
                    {c.code}
                    {c.is_public && <span className="badge ml-2 bg-clay-100 font-sans text-clay-700">public</span>}
                  </td>
                  <td>{c.type === "percent" ? `${c.value}%` : formatPrice(c.value)}</td>
                  <td>{Number(c.min_order) > 0 ? formatPrice(c.min_order) : "—"}</td>
                  <td>{c.used_count}{c.max_uses != null && ` / ${c.max_uses}`}</td>
                  <td>{c.expires_at ? formatDate(c.expires_at) : "Never"}</td>
                  <td>
                    <span className={`badge ${c.active && !expired ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                      {expired ? "expired" : c.active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="btn-ghost p-2" onClick={() => { setEditing(c); setFormKey((k) => k + 1); }}><Pencil size={16} /></button>
                      <button
                        className="btn-ghost p-2 text-red-600"
                        onClick={() =>
                          confirm(`Delete coupon ${c.code}?`) &&
                          start(async () => {
                            const res = await deleteCoupon(c.id);
                            if (res.error) toast.error(res.error);
                            else toast.success("Deleted");
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-ink/50">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <form
        key={formKey}
        className="card h-fit space-y-4 p-6"
        action={(fd) =>
          start(async () => {
            const res = await saveCoupon(editing?.id ?? null, fd);
            if (res.error) return void toast.error(res.error);
            toast.success("Coupon saved");
            reset();
          })
        }
      >
        <h2 className="font-semibold">{editing ? "Edit coupon" : "New coupon"}</h2>
        <div><label className="label">Code *</label><input name="code" className="input uppercase" required defaultValue={editing?.code} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue={editing?.type ?? "percent"}>
              <option value="percent">Percent %</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div><label className="label">Value *</label><input name="value" type="number" step="0.01" min="0.01" className="input" required defaultValue={editing?.value} /></div>
          <div><label className="label">Min order</label><input name="min_order" type="number" step="0.01" min="0" className="input" defaultValue={editing?.min_order ?? 0} /></div>
          <div><label className="label">Max uses</label><input name="max_uses" type="number" min="1" className="input" defaultValue={editing?.max_uses ?? ""} placeholder="Unlimited" /></div>
        </div>
        <div><label className="label">Expires</label><input name="expires_at" type="date" className="input" defaultValue={editing?.expires_at?.slice(0, 10) ?? ""} /></div>
        <div><label className="label">Customer-facing description</label><input name="description" className="input" defaultValue={editing?.description ?? ""} placeholder="e.g. 10% off your first order" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} /> Active</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_public" defaultChecked={editing?.is_public ?? false} /> Show to customers on &quot;Available coupons&quot;</label>
        <div className="flex gap-2">
          {editing && <button type="button" className="btn-outline flex-1" onClick={reset}>Cancel</button>}
          <button className="btn-primary flex-1" disabled={pending}>{pending ? "Saving…" : "Save coupon"}</button>
        </div>
      </form>
    </div>
  );
}
