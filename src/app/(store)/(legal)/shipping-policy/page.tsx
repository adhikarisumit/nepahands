import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Shipping Policy" };

export default async function ShippingPolicyPage() {
  const L = LEGAL;
  // Rates come from Admin → Settings so this page never disagrees with checkout.
  const settings = await getSettings();
  const flat = Number(settings.shipping_flat);

  return (
    <>
      <h1>Shipping Policy</h1>
      <p className="updated">Effective {L.effectiveDate}</p>

      <p>Every order is packed by hand with care. Here&apos;s what to expect once you&apos;ve placed your order.</p>

      <h2>1. Processing time</h2>
      <p>
        Orders are prepared and dispatched within <strong>{L.processingTime}</strong> after payment is confirmed. Bank-transfer orders are processed
        once we receive your payment. Made-to-order or custom pieces may take longer; we&apos;ll let you know by email if your order will be delayed.
      </p>

      <h2>2. Shipping rates</h2>
      <ul>
        <li>Standard shipping: <strong>{flat > 0 ? formatPrice(flat) : "free"}</strong> per order.</li>
        <li>The exact shipping cost is always shown at checkout before you pay.</li>
      </ul>

      <h2>3. Delivery times</h2>
      <ul>
        <li>Domestic orders: usually <strong>{L.domesticDelivery}</strong> after dispatch.</li>
        <li>International orders: usually <strong>{L.internationalDelivery}</strong> after dispatch.</li>
      </ul>
      <p>
        Delivery times are estimates, not guarantees. Carrier delays, holidays, weather and customs checks can occasionally make deliveries take
        longer.
      </p>

      <h2>4. Tracking</h2>
      <p>
        When your order ships we add a tracking number to it. You can see your order status and tracking number any time from{" "}
        <Link href="/account/orders">My orders</Link> in your account.
      </p>

      <h2>5. International orders, customs and duties</h2>
      <p>
        International orders may be subject to import duties, taxes and customs fees charged by the destination country. These are not included in our
        prices or shipping charges and are the responsibility of the recipient, unless your order was paid through Paddle and Paddle collected them at
        checkout. Refused parcels are returned to us, and refunds for them exclude the original and return shipping costs.
      </p>

      <h2>6. Address accuracy</h2>
      <p>
        Please double-check your shipping address at checkout. We aren&apos;t responsible for orders delayed or lost because of an incorrect or incomplete
        address. If you notice a mistake, email us straight away — we can update it only until the order ships.
      </p>

      <h2>7. Lost or damaged parcels</h2>
      <p>
        If your tracking hasn&apos;t updated for a long time or your order arrives damaged, contact us and we&apos;ll work with the carrier to resolve it.
        Damaged items are covered by our <Link href="/refund-policy">Refund &amp; Return Policy</Link>.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions about shipping? Email <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a> or call{" "}
        <a href={L.phoneHref}>{L.phone}</a> with your order number.
      </p>
    </>
  );
}
