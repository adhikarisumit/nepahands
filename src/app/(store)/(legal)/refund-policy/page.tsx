import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Refund & Return Policy" };

export default function RefundPolicyPage() {
  const L = LEGAL;
  return (
    <>
      <h1>Refund &amp; Return Policy</h1>
      <p className="updated">Effective {L.effectiveDate}</p>

      <p>
        We want you to love what you buy. If something isn&apos;t right, this policy explains how to cancel an order, return an item or get a refund.
      </p>

      <div className="callout">
        <strong>In short:</strong> you can return most items within <strong>{L.returnWindowDays} days</strong> of delivery. Damaged or incorrect items
        are refunded or replaced at no cost to you. Refunds go back to your original payment method within {L.refundProcessingDays} of approval.
      </div>

      <h2>1. Cancelling an order</h2>
      <p>
        You can cancel an order free of charge until it has been shipped. Email <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a> with your
        order number as soon as possible. Bank-transfer orders are paid before they are placed, so if you cancel one we refund your transfer to the
        account it came from.
      </p>

      <h2>2. Returns</h2>
      <p>You may return an item within {L.returnWindowDays} days of receiving it if:</p>
      <ul>
        <li>it is unused, undamaged and in its original condition and packaging;</li>
        <li>you contact us first to request a return (please don&apos;t send items back without a return confirmation);</li>
        <li>it is not one of the non-returnable items listed below.</li>
      </ul>

      <h3>Non-returnable items</h3>
      <ul>
        <li>Personalised, custom-made or made-to-order pieces (unless they arrive damaged or faulty).</li>
        <li>Items that have been used, washed or damaged after delivery.</li>
        <li>Gift cards and items marked &quot;final sale&quot;.</li>
      </ul>
      <p>
        Please remember that small variations in colour, size and texture are a natural part of handmade goods and are not considered defects — see our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>

      <h2>3. How to return an item</h2>
      <ul>
        <li>Email <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a> with your order number, the item(s) you want to return and the reason.</li>
        <li>We&apos;ll reply with return instructions and the return address.</li>
        <li>Pack the item carefully — handmade pieces are often fragile. Items damaged in return transit because of poor packaging may not be refunded in full.</li>
        <li>We recommend a tracked shipping service, as we can&apos;t be responsible for returns lost on the way back to us.</li>
      </ul>

      <h2>4. Return shipping costs</h2>
      <ul>
        <li><strong>Change of mind:</strong> you pay the return shipping cost. Original shipping charges are not refunded.</li>
        <li><strong>Damaged, faulty or wrong item:</strong> we cover return shipping, or may ask you to keep the item and send a photo instead.</li>
      </ul>

      <h2>5. Damaged or incorrect items</h2>
      <p>
        If your order arrives damaged, faulty or isn&apos;t what you ordered, please email us within <strong>7 days</strong> of delivery with your order
        number and photos of the item and packaging. We&apos;ll offer a replacement (where available) or a full refund, including shipping.
      </p>

      <h2>6. Refunds</h2>
      <ul>
        <li>Once we receive and inspect your return, we&apos;ll email you to confirm whether the refund is approved.</li>
        <li>Approved refunds are issued to your original payment method within {L.refundProcessingDays}. Your bank or card issuer may take a few extra days to show it.</li>
        <li><strong>Card (Stripe) orders</strong> are refunded to the same card.</li>
        <li><strong>Paddle orders</strong> are refunded through Paddle, our Merchant of Record for those orders, to the original payment method.</li>
        <li><strong>Bank transfer orders</strong> are refunded by bank transfer to an account in the payer&apos;s name. We&apos;ll ask you for the account details.</li>
        <li>If you used a discount code, the refund is for the amount you actually paid.</li>
      </ul>

      <h2>7. Exchanges</h2>
      <p>
        Because most pieces are one-of-a-kind, we can&apos;t always offer a like-for-like exchange. The quickest way to get a different item is to return
        the original for a refund and place a new order.
      </p>

      <h2>8. Your legal rights</h2>
      <p>
        This policy does not affect your statutory rights. If the consumer laws of your country give you a longer cancellation period or additional
        remedies, those rights apply.
      </p>

      <h2>9. Contact</h2>
      <p>
        For returns and refunds, email <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a> or call{" "}
        <a href={L.phoneHref}>{L.phone}</a>, and include your order number.
      </p>
    </>
  );
}
