# Nepahands — Online Handmade Goods Store

> Store name, homepage text/images, footer and social links are hard-coded in `src/lib/branding.ts`.

Full-stack e-commerce store built with **Next.js 15 (App Router)**, **Supabase** (database, auth, storage), **Stripe** and **Paddle** payments, and **Tailwind CSS**.

## Features

**Storefront**
- Homepage with hero, categories, featured and new products
- Shop with search, category / price / in-stock filters, sorting, pagination
- Product pages: image gallery, stock status, artisan/material/origin details, reviews and ratings, related products
- Persistent cart, discount coupons, live server-side price quote (shipping, tax, discounts)
- Checkout for guests and signed-in users, with **Stripe Checkout** or the **Paddle overlay checkout**
- Customer accounts: sign up, sign in, password reset, profile, order history and details, wishlist

**Admin panel** (`/admin`)
- Dashboard: 30-day revenue chart, order and customer counts, low-stock alerts, recent orders
- Products: create, edit, delete, image upload to Supabase Storage, active and featured toggles
- Categories, coupons (percent or fixed, minimum order, usage limits, expiry), reviews moderation
- Orders: filter by status, search, update status and tracking number
- Customers: order count and total spent, promote to admin
- Settings: contact email, announcement bar, flat shipping rate, tax rate, payment methods

**Security**
- Row Level Security on every table; admin checks run in the database (`is_admin()`)
- Prices are always recalculated on the server from the database. Prices sent by the browser are never used.
- Orders are marked paid only by signature-verified webhooks (or a server-side check with the provider on the success page)
- Stock decrement and coupon usage are idempotent (the `mark_order_paid` SQL function)

---

## Setup

### 1. Install
```bash
npm install
cp .env.example .env.local
```

### 2. Supabase
1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste and run `supabase/schema.sql`. Optionally run `supabase/seed.sql` for demo products.
3. From *Project Settings → API Keys*, copy into `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Secret key** (`sb_secret_…`) → `SUPABASE_SECRET_KEY` (server only, never commit it)
4. Under *Authentication → URL Configuration*, set Site URL to your domain and add `http://localhost:3000/auth/callback` (and your production callback) to Redirect URLs.
5. **Make yourself admin**: sign up in the store, then run:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

### 3. Stripe
1. Copy the API keys (*Developers → API keys*) into `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Webhook: add an endpoint `https://YOUR_DOMAIN/api/webhooks/stripe` with these events:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`.
   Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
3. Local testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Test card: `4242 4242 4242 4242`, any future date and any CVC.

### 4. Paddle (Billing)
1. Use the sandbox at https://sandbox-vendors.paddle.com while testing.
2. *Developer tools → Authentication*: create an **API key** (`PADDLE_API_KEY`) and a **client-side token** (`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`).
3. *Checkout → Checkout settings*: set a **Default payment link** (for example `https://YOUR_DOMAIN/checkout`). Paddle won't create transactions without one. For production, approve your domain as well.
4. *Developer tools → Notifications*: add a destination `https://YOUR_DOMAIN/api/webhooks/paddle` with the events
   `transaction.paid`, `transaction.completed`, `transaction.canceled`, `adjustment.created`, `adjustment.updated`.
   Put its secret key in `PADDLE_WEBHOOK_SECRET`.
5. Set `NEXT_PUBLIC_PADDLE_ENV=production` and use your live keys when going live.

> Paddle acts as merchant of record and calculates sales tax itself, so Paddle orders are charged
> items − discount + shipping. The final tax and total are saved to the order from the webhook.
> The store's tax-rate setting applies only to Stripe orders.

### 5. Run
```bash
npm run dev
```
Open http://localhost:3000. The admin panel is at http://localhost:3000/admin.

### Deploy
### Deploy to Vercel

1. **Import the repo** at https://vercel.com/new → pick `nepahands`. Vercel detects Next.js automatically — keep the default
   build command (`next build`) and output settings.
2. **Environment variables** (Project → Settings → Environment Variables, for *Production* and *Preview*) — copy the values from your
   `.env.local`. See `.env.example` for the full list.
   - Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_CURRENCY`
   - Recommended: `NEXT_PUBLIC_SITE_URL` = your live domain (e.g. `https://www.nepahands.com`)
   - Payments: only add the Stripe / Paddle keys you actually use — leave the others unset.
   - `NEXT_PUBLIC_*` values are built into the site, so **redeploy after changing them**.
3. **Deploy.** Then, using your live URL:
   - **Supabase → Authentication → URL Configuration:** set *Site URL* to your domain and add `https://YOUR_DOMAIN/auth/callback`
     to *Redirect URLs* (sign-up confirmation and password reset links need this).
   - **Stripe:** add a webhook endpoint `https://YOUR_DOMAIN/api/webhooks/stripe` and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
   - **Paddle:** add a notification destination `https://YOUR_DOMAIN/api/webhooks/paddle`, put its secret in `PADDLE_WEBHOOK_SECRET`,
     and approve your domain in Paddle's checkout settings.
4. **Region (optional, for speed):** in Project → Settings → Functions, choose the region closest to your Supabase project
   (e.g. Sydney `syd1` if Supabase is in `ap-southeast-2`).

Notes: uploads that pass through the site (bank-transfer screenshots) are limited to 4 MB because Vercel caps request bodies at
4.5 MB; product and QR images upload straight to Supabase Storage.

## Project structure
```
supabase/schema.sql         Tables, RLS policies, triggers, storage bucket
supabase/seed.sql           Demo data
src/app/(store)/            Storefront pages
src/app/admin/              Admin panel (server actions in actions.ts)
src/app/api/checkout        Creates the order and a Stripe session or Paddle transaction
src/app/api/webhooks/       Stripe and Paddle webhook handlers
src/lib/pricing.ts          Server-side cart pricing (shipping, tax, coupons)
src/lib/orders.ts           Payment confirmation logic
src/store/cart.ts           Client cart (zustand, localStorage)
```
