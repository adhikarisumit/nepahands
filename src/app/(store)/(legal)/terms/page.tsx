import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  const L = LEGAL;
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="updated">Effective {L.effectiveDate}</p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of the {L.businessName} website at {L.website} (the &quot;Store&quot;) and any
        purchase you make from us. By using the Store or placing an order, you agree to these Terms. If you do not agree, please do not use the
        Store.
      </p>

      <h2>1. Who we are</h2>
      <p>
        The Store is operated by {L.businessName}, {L.address}. You can contact us at <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a> or{" "}
        <a href={L.phoneHref}>{L.phone}</a>.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <ul>
        <li>You must be at least 18 years old, or have the permission of a parent or guardian, to make a purchase.</li>
        <li>You need an account to add items to your cart and place an order. You are responsible for keeping your password confidential and for all activity under your account.</li>
        <li>Please give us accurate, current information and keep it up to date. We may suspend accounts that are used fraudulently or in breach of these Terms.</li>
      </ul>

      <h2>3. Handmade products</h2>
      <p>
        Our products are hand-felted from wool by artisans in Nepal. Colour, size, shape, texture and pattern can vary slightly from piece to piece
        and from the photos on the Store. These natural variations are part of the character of handmade goods and are not defects. We describe and
        photograph products as accurately as we can, but screen settings can affect how colours appear.
      </p>

      <h2>4. Prices and availability</h2>
      <ul>
        <li>Prices are shown in the currency displayed on the Store. Shipping, discounts and any applicable taxes are shown at checkout before you pay.</li>
        <li>Many items are one-of-a-kind or made in small batches, so stock is limited. Adding an item to your cart does not reserve it.</li>
        <li>We may change prices, products or availability at any time. Price changes do not affect orders already confirmed.</li>
        <li>If an item is listed at an obviously incorrect price due to an error, we may cancel the order and refund you in full.</li>
      </ul>

      <h2>5. Orders</h2>
      <p>
        When you place an order you are making an offer to buy. We accept your order when payment is confirmed and we send you an order
        confirmation. We may decline or cancel an order — for example if an item is out of stock, if we suspect fraud, or if we cannot deliver to
        your address — in which case we will refund any amount you paid.
      </p>

      <h2>6. Payment</h2>
      <ul>
        <li>
          <strong>Card payments</strong> are processed by Stripe. We never see or store your full card details.
        </li>
        <li>
          <strong>Paddle payments:</strong> for orders paid through Paddle, Paddle.com Market Limited is the Merchant of Record and reseller of the
          products. Paddle handles payment, sales tax and invoicing for those orders, and its{" "}
          <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer">buyer terms</a> also apply.
        </li>
        <li>
          <strong>Bank transfer / QR payments:</strong> you pay first, using the bank details or QR code shown at checkout, and then place your
          order with your transaction ID or a screenshot of the payment. Please add the payment code shown at checkout as the remark on your
          transfer. Your order stays &quot;pending&quot; until we have verified the payment in our account. If we can&apos;t match your payment, or a
          piece sells out before it is verified, we will contact you and refund anything you paid.
        </li>
        <li>Discount codes must be entered at checkout, cannot be exchanged for cash and may have conditions such as a minimum spend or expiry date.</li>
      </ul>

      <h2>7. Shipping, returns and refunds</h2>
      <p>
        Delivery is covered by our <Link href="/shipping-policy">Shipping Policy</Link>. Returns, cancellations and refunds are covered by our{" "}
        <Link href="/refund-policy">Refund &amp; Return Policy</Link>. Both form part of these Terms.
      </p>

      <h2>8. Reviews and content you submit</h2>
      <p>
        If you post a review or other content, you confirm it is honest and your own, and you give us a non-exclusive, royalty-free licence to
        display it on the Store. Do not post anything unlawful, abusive, misleading or that infringes someone else&apos;s rights. We may remove
        content at our discretion.
      </p>

      <h2>9. Intellectual property</h2>
      <p>
        The Store, including its design, text, photos and logos, belongs to {L.businessName} or the artisans and licensors we work with. You may not
        copy, reproduce or use it commercially without our written permission. Product designs remain the intellectual property of their makers.
      </p>

      <h2>10. Acceptable use</h2>
      <p>You agree not to misuse the Store, including by:</p>
      <ul>
        <li>attempting to access accounts, data or systems you are not authorised to access;</li>
        <li>interfering with the Store&apos;s security or operation, or using bots or scrapers without permission;</li>
        <li>placing fraudulent orders or using payment methods you are not authorised to use.</li>
      </ul>

      <h2>11. Disclaimers and limitation of liability</h2>
      <p>
        The Store is provided &quot;as is&quot;. To the fullest extent permitted by law, we are not liable for indirect or consequential losses, and
        our total liability for any claim relating to an order is limited to the amount you paid for that order. Nothing in these Terms limits any
        rights you have under consumer protection laws that cannot be excluded, or our liability for death or personal injury caused by negligence,
        or for fraud.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of {L.governingLaw}. Any dispute will be handled by the courts of {L.governingLaw}, unless the consumer
        laws of your country give you the right to bring a claim where you live.
      </p>

      <h2>13. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. The version in force when you place an order applies to that order. The effective date at the top
        shows when they were last changed.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these Terms? Email us at <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a> or call{" "}
        <a href={L.phoneHref}>{L.phone}</a>.
      </p>
    </>
  );
}
