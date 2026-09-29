-- =====================================================================
-- Handicraft Store - Supabase schema
-- Run this whole file once in Supabase Dashboard -> SQL Editor.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Customers may edit their own profile but never their role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() and auth.uid() is not null then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  stock integer not null default 0 check (stock >= 0),
  sku text,
  category_id uuid references public.categories(id) on delete set null,
  images text[] not null default '{}',
  artisan text,
  material text,
  origin text,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_idx on public.products(active);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create table if not exists public.wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------------------------------------------------------------------
-- Commerce
-- ---------------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent', 'fixed')),
  value numeric(10,2) not null check (value > 0),
  min_order numeric(10,2) not null default 0,
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  is_public boolean not null default false, -- listed on the customer "Available coupons" page
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  payment_provider text check (payment_provider in ('stripe','paddle','bank_transfer')),
  payment_id text,
  payment_reference text,   -- transaction ID submitted by the customer (bank transfer)
  payment_proof_path text,  -- screenshot in the private payment-proofs bucket
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  currency text not null default 'AUD',
  coupon_code text,
  shipping_address jsonb not null default '{}'::jsonb,
  tracking_number text,
  notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  image text,
  price numeric(10,2) not null,
  quantity integer not null check (quantity > 0)
);

create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'Handicraft',
  shipping_flat numeric(10,2) not null default 8,
  free_shipping_threshold numeric(10,2) not null default 0, -- unused (free-shipping feature removed)
  tax_rate numeric(5,2) not null default 0,
  announcement text, -- optional message shown in a bar above the header
  contact_email text,
  stripe_enabled boolean not null default true,
  paddle_enabled boolean not null default true,
  bank_enabled boolean not null default false,
  bank_details jsonb not null default '{}'::jsonb,
  bank_qr_url text,
  branding jsonb not null default '{}'::jsonb, -- logo, colours, homepage copy, footer, social links
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Mark an order paid exactly once: decrements stock and bumps coupon usage.
-- Called from payment webhooks with the service role.
-- ---------------------------------------------------------------------
create or replace function public.mark_order_paid(p_order_id uuid, p_payment_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon text;
begin
  update public.orders
     set status = 'paid', payment_id = coalesce(p_payment_id, payment_id), paid_at = now()
   where id = p_order_id and status = 'pending'
   returning coupon_code into v_coupon;

  if not found then
    return false; -- already processed or unknown
  end if;

  update public.products p
     set stock = greatest(p.stock - oi.quantity, 0)
    from public.order_items oi
   where oi.order_id = p_order_id and oi.product_id = p.id;

  if v_coupon is not null then
    update public.coupons set used_count = used_count + 1 where code = v_coupon;
  end if;

  return true;
end;
$$;

revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;

-- profiles
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- categories
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);
drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- products
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select using (active or public.is_admin());
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- reviews
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (true);
-- Only customers with a delivered order containing the product may review it.
create or replace function public.has_received_product(p_product uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
     where oi.product_id = p_product
       and o.user_id = auth.uid()
       and o.status = 'delivered'
  );
$$;

drop policy if exists "reviews own insert" on public.reviews;
create policy "reviews own insert" on public.reviews
  for insert with check (user_id = auth.uid() and public.has_received_product(product_id));
drop policy if exists "reviews own or admin delete" on public.reviews;
create policy "reviews own or admin delete" on public.reviews
  for delete using (user_id = auth.uid() or public.is_admin());

-- wishlist
drop policy if exists "wishlist own" on public.wishlist;
create policy "wishlist own" on public.wishlist
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- coupons (validated server-side with the service role)
drop policy if exists "coupons admin" on public.coupons;
create policy "coupons admin" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- orders (created server-side with the service role)
drop policy if exists "orders own read" on public.orders;
create policy "orders own read" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "orders admin delete" on public.orders;
create policy "orders admin delete" on public.orders
  for delete using (public.is_admin());

-- order items
drop policy if exists "order items read" on public.order_items;
create policy "order items read" on public.order_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- settings
drop policy if exists "settings public read" on public.store_settings;
create policy "settings public read" on public.store_settings for select using (true);
drop policy if exists "settings admin update" on public.store_settings;
create policy "settings admin update" on public.store_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Storage bucket for product images
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Private bucket for bank-transfer payment screenshots (server key only)
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects
  for select using (bucket_id = 'product-images');
drop policy if exists "product images admin insert" on storage.objects;
create policy "product images admin insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product images admin update" on storage.objects;
create policy "product images admin update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product images admin delete" on storage.objects;
create policy "product images admin delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());
