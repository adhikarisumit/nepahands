-- Lets admins choose which coupons appear on the customer "Available coupons" page.
alter table public.coupons add column if not exists is_public boolean not null default false;
alter table public.coupons add column if not exists description text;

-- Show the demo welcome coupon to customers.
update public.coupons set is_public = true, description = '10% off your first order' where code = 'WELCOME10';
