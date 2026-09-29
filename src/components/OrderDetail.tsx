import { PROVIDER_LABEL, type Order } from "@/lib/types";
import { formatDate, formatPrice, PLACEHOLDER_IMG, statusColor } from "@/lib/utils";

export default function OrderDetail({ order }: { order: Order }) {
  const a = order.shipping_address;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Items</h2>
          <span className={`badge ${statusColor[order.status]}`}>{order.status}</span>
        </div>
        <ul className="divide-y divide-clay-100">
          {order.order_items?.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image || PLACEHOLDER_IMG} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-medium">{i.name}</p>
                <p className="text-sm text-ink/50">{formatPrice(i.price, order.currency)} × {i.quantity}</p>
              </div>
              <p className="font-medium">{formatPrice(i.price * i.quantity, order.currency)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-clay-100 pt-4 text-sm">
          <Row k="Subtotal" v={formatPrice(order.subtotal, order.currency)} />
          {Number(order.discount) > 0 && <Row k={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`} v={`−${formatPrice(order.discount, order.currency)}`} />}
          <Row k="Shipping" v={Number(order.shipping) === 0 ? "Free" : formatPrice(order.shipping, order.currency)} />
          {Number(order.tax) > 0 && <Row k="Tax" v={formatPrice(order.tax, order.currency)} />}
          <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(order.total, order.currency)}</dd></div>
        </dl>
      </div>
      <div className="space-y-4">
        <div className="card p-6 text-sm">
          <h3 className="mb-2 font-semibold">Details</h3>
          <p>Placed {formatDate(order.created_at)}</p>
          <p>Payment: {order.payment_provider ? PROVIDER_LABEL[order.payment_provider] : "—"}</p>
          {order.payment_reference && <p className="text-ink/60">Ref: <span className="font-mono">{order.payment_reference}</span></p>}
          {order.tracking_number && <p className="mt-2">Tracking: <span className="font-mono">{order.tracking_number}</span></p>}
        </div>
        <div className="card p-6 text-sm">
          <h3 className="mb-2 font-semibold">Shipping to</h3>
          <p>{a.full_name}</p>
          <p>{a.line1}</p>
          {a.line2 && <p>{a.line2}</p>}
          <p>{[a.city, a.state, a.postal_code].filter(Boolean).join(", ")}</p>
          <p>{a.country}</p>
          {a.phone && <p className="mt-1 text-ink/60">{a.phone}</p>}
        </div>
        {order.notes && (
          <div className="card p-6 text-sm">
            <h3 className="mb-2 font-semibold">Notes</h3>
            <p className="whitespace-pre-line text-ink/70">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink/60">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
