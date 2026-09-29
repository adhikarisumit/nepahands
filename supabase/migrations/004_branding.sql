-- Editable branding (logo, colours, homepage copy, footer, social links) stored as one JSON document.
alter table public.store_settings add column if not exists branding jsonb not null default '{}'::jsonb;
