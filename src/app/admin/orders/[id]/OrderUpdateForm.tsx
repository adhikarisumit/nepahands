"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { updateOrder } from "../../actions";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export default function OrderUpdateForm({ id, status, tracking }: { id: string; status: OrderStatus; tracking: string }) {
  const [pending, start] = useTransition();
  return (
    <form
      className="card flex flex-wrap items-end gap-4 p-5"
      action={(fd) =>
        start(async () => {
          const res = await updateOrder(id, fd);
          if (res.error) toast.error(res.error);
          else toast.success("Order updated");
        })
      }
    >
      <div>
        <label className="label">Status</label>
        <select name="status" className="input w-44 capitalize" defaultValue={status}>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="min-w-56 flex-1">
        <label className="label">Tracking number</label>
        <input name="tracking_number" className="input" defaultValue={tracking} placeholder="e.g. 1Z999AA10123456784" />
      </div>
      <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Update order"}</button>
      <p className="w-full text-xs text-ink/50">
        Refunds must be issued from your Stripe or Paddle dashboard; the order is marked refunded automatically via webhook.
      </p>
    </form>
  );
}
