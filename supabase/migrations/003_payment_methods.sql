-- Switchable payment methods + manual bank transfer with QR code.

-- 1. Settings: per-method toggles and bank details
alter table public.store_settings add column if not exists stripe_enabled boolean not null default true;
alter table public.store_settings add column if not exists paddle_enabled boolean not null default true;
alter table public.store_settings add column if not exists bank_enabled boolean not null default false;
alter table public.store_settings add column if not exists bank_details jsonb not null default '{}'::jsonb;
alter table public.store_settings add column if not exists bank_qr_url text;

-- 2. Orders: allow bank transfer and store the customer's payment proof
alter table public.orders drop constraint if exists orders_payment_provider_check;
alter table public.orders add constraint orders_payment_provider_check
  check (payment_provider in ('stripe', 'paddle', 'bank_transfer'));
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists payment_proof_path text;

-- 3. Private bucket for payment screenshots (written and read only by the server key)
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;
