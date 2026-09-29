import Link from "next/link";
import { ChevronRight, Truck } from "lucide-react";
import type { Order } from "@/lib/types";
import { formatDate, formatPrice, PLACEHOLDER_IMG, statusColor } from "@/lib/utils";

export default function OrderCard({ order }: { order: Order }) {
  const items = order.order_items ?? [];
  const count = items.reduce((n, i) => n + i.quantity, 0);
  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="group card flex flex-wrap items-center gap-4 p-4 transition hover:border-clay-300 hover:shadow-sm sm:p-5"
    >
      <div className="flex -space-x-3">
        {items.slice(0, 3).map((i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i.id} src={i.image || PLACEHOLDER_IMG} alt="" className="h-14 w-14 rounded-xl border-2 border-white object-cover" />
        ))}
        {items.length > 3 && (
          <span className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white bg-clay-100 text-xs font-medium">
            +{items.length - 3}
          </span>
        )}
      </div>
      <div className="min-w-40 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Order #{order.order_number}</span>
          <span className={`badge ${statusColor[order.status]}`}>{order.status}</span>
        </div>
        <p className="mt-0.5 text-sm text-ink/50">
          {formatDate(order.created_at)} · {count} item{count === 1 ? "" : "s"}
        </p>
        {order.tracking_number && (
          <p className="mt-1 flex items-center gap-1 text-xs text-clay-700">
            <Truck size={12} /> {order.tracking_number}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{formatPrice(order.total, order.currency)}</span>
        <ChevronRight size={18} className="text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-clay-600" />
      </div>
    </Link>
  );
}
