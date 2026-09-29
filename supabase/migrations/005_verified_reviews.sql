-- Only customers who have RECEIVED a product (a delivered order containing it) may review it.
-- Enforced in the database so it can't be bypassed by calling the API directly.

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
