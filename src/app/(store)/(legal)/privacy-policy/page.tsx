import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const L = LEGAL;
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="updated">Effective {L.effectiveDate}</p>

      <p>
        This Privacy Policy explains what personal information {L.businessName} (&quot;we&quot;, &quot;us&quot;) collects when you use {L.website},
        how we use it, who we share it with, and the choices you have. We only collect what we need to run the Store and fulfil your orders.
      </p>

      <h2>1. Information we collect</h2>
      <h3>Information you give us</h3>
      <ul>
        <li><strong>Account details:</strong> name, email address, phone number and password (stored securely as a hash — we cannot see it).</li>
        <li><strong>Order details:</strong> shipping address, phone number, the items you buy, order notes and gift messages.</li>
        <li><strong>Bank transfer proof:</strong> if you pay by bank transfer, the transaction ID and any payment screenshot you upload.</li>
        <li><strong>Reviews</strong> you post and messages you send us.</li>
      </ul>
      <h3>Payment information</h3>
      <p>
        Card and wallet payments are handled directly by our payment providers, Stripe and Paddle. We never receive or store your full card number.
        We receive only a payment reference and confirmation of whether the payment succeeded.
      </p>
      <h3>Information collected automatically</h3>
      <ul>
        <li>Technical data such as IP address, browser type and device, used for security and to keep the Store working.</li>
        <li>Your cart and sign-in session, stored in your browser. See our <Link href="/cookie-policy">Cookie Policy</Link>.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To process, ship and support your orders, including sending order confirmations and delivery updates.</li>
        <li>To create and manage your account, wishlist and order history.</li>
        <li>To verify payments, prevent fraud and keep the Store secure.</li>
        <li>To respond to your questions, returns and refund requests.</li>
        <li>To meet our legal obligations, such as tax and accounting record-keeping.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use it for third-party advertising.</p>

      <h2>3. Legal bases (where applicable)</h2>
      <p>
        Where data-protection laws such as the GDPR apply, we process your information to perform our contract with you (fulfilling orders), to
        comply with legal obligations, for our legitimate interests (running and securing the Store), or with your consent, which you can withdraw at
        any time.
      </p>

      <h2>4. Who we share information with</h2>
      <p>We share information only with service providers who help us run the Store, and only as needed:</p>
      <ul>
        <li><strong>Supabase</strong> — hosting of our database, user accounts and file storage.</li>
        <li><strong>Stripe</strong> and <strong>Paddle</strong> — payment processing. For Paddle orders, Paddle acts as Merchant of Record and processes your data under its own privacy policy.</li>
        <li><strong>Shipping carriers</strong> — your name, address and phone number, to deliver your order.</li>
        <li><strong>Authorities</strong> — when required by law or to protect our rights and prevent fraud.</li>
      </ul>
      <p>Some of these providers may process data outside your country. Where required, they use appropriate safeguards for international transfers.</p>

      <h2>5. How long we keep information</h2>
      <p>
        We keep order records for as long as needed for accounting and tax purposes (typically up to 7 years). Account information is kept while your
        account is active. Payment screenshots are kept only as long as needed to verify the payment and handle any dispute. You can ask us to delete
        your account at any time.
      </p>

      <h2>6. Your rights</h2>
      <p>Depending on where you live, you may have the right to:</p>
      <ul>
        <li>access the personal information we hold about you and receive a copy;</li>
        <li>correct inaccurate information (you can update your profile from your account page);</li>
        <li>ask us to delete your information, subject to records we must keep by law;</li>
        <li>object to or restrict certain processing, and withdraw consent;</li>
        <li>complain to your local data-protection authority.</li>
      </ul>
      <p>
        To make a request, email <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a>. We will respond within 30 days.
      </p>

      <h2>7. Security</h2>
      <p>
        We use encryption in transit (HTTPS), access controls and database security rules so that customers can only see their own orders. No system is
        completely secure, but we work to protect your information and will notify you of a breach where the law requires.
      </p>

      <h2>8. Children</h2>
      <p>The Store is not directed at children under 16, and we do not knowingly collect their personal information.</p>

      <h2>9. Changes to this policy</h2>
      <p>We may update this policy from time to time. The effective date at the top shows when it was last changed.</p>

      <h2>10. Contact</h2>
      <p>
        {L.businessName}, {L.address}
        <br />
        Email: <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a>
      </p>
    </>
  );
}
