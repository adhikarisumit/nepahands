import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Cookie Policy" };

export default function CookiePolicyPage() {
  const L = LEGAL;
  return (
    <>
      <h1>Cookie Policy</h1>
      <p className="updated">Effective {L.effectiveDate}</p>

      <p>
        This policy explains how {L.businessName} uses cookies and similar browser storage on {L.website}. We keep this to a minimum: we use only what
        the Store needs to work, and <strong>we do not use advertising or tracking cookies</strong>.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files a website stores in your browser. &quot;Local storage&quot; is a similar technology that lets a site remember
        information on your device.
      </p>

      <h2>2. What we use</h2>
      <div className="overflow-x-auto">
        <table className="mt-4 w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-clay-100 text-ink">
              <th className="py-2 pr-4 font-semibold">Name</th>
              <th className="py-2 pr-4 font-semibold">Type</th>
              <th className="py-2 pr-4 font-semibold">Purpose</th>
              <th className="py-2 font-semibold">Duration</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr className="border-b border-clay-50">
              <td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token</td>
              <td className="py-2 pr-4">Essential cookie</td>
              <td className="py-2 pr-4">Keeps you signed in to your account securely.</td>
              <td className="py-2">Until you sign out</td>
            </tr>
            <tr className="border-b border-clay-50">
              <td className="py-2 pr-4 font-mono text-xs">handicraft-cart</td>
              <td className="py-2 pr-4">Local storage</td>
              <td className="py-2 pr-4">Remembers the items in your cart and any discount code you applied.</td>
              <td className="py-2">Until you check out or clear your browser data</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        These are strictly necessary for the Store to work (signing in, keeping your cart), so they don&apos;t require consent under most cookie laws.
      </p>

      <h2>3. Payment providers</h2>
      <p>
        When you pay by card or through Paddle, the payment page is provided by Stripe or Paddle. They may set their own cookies to process your
        payment securely and prevent fraud. Those cookies are governed by their policies:{" "}
        <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener noreferrer">Stripe cookie policy</a> and{" "}
        <a href="https://www.paddle.com/legal/cookie-policy" target="_blank" rel="noopener noreferrer">Paddle cookie policy</a>.
      </p>

      <h2>4. Managing cookies</h2>
      <p>
        You can delete or block cookies in your browser settings. If you block essential cookies you won&apos;t be able to sign in, and clearing local
        storage will empty your cart.
      </p>

      <h2>5. Changes</h2>
      <p>
        If we ever add analytics or other non-essential cookies, we&apos;ll update this policy and ask for your consent first where the law requires it.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a>, or read our <Link href="/privacy-policy">Privacy Policy</Link>.
      </p>
    </>
  );
}
