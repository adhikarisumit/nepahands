-- Optional demo data (Nepali felt crafts). Run after schema.sql.
-- Images point to /public/images; prices are placeholders in AUD — edit them in Admin → Products.
insert into public.categories (name, slug, description, image_url) values
  ('Felt Ball Rugs', 'felt-ball-rugs', 'Rugs and mats made from hundreds of hand-rolled wool felt balls', '/images/felt-ball-rug.jpg'),
  ('Coasters & Trivets', 'coasters-trivets', 'Felt ball coasters and trivets for the table', '/images/felt-coasters.jpg'),
  ('Pouches & Bags', 'pouches-bags', 'Hand-felted pouches, cases and bags', '/images/felt-mushroom-pouch.jpg')
on conflict (slug) do nothing;

insert into public.products (name, slug, description, price, compare_at_price, stock, category_id, images, material, origin, featured)
select v.name, v.slug, v.description, v.price, v.compare_at, v.stock, c.id, v.images, v.material, v.origin, v.featured
from (values
  ('Rainbow Felt Ball Rug', 'rainbow-felt-ball-rug',
   'A bright, cushioned square rug made from hundreds of hand-rolled wool felt balls in mixed colours, stitched together by hand. Lovely as a seat pad, bedside mat or wall piece.',
   89.00, null, 6, 'felt-ball-rugs', array['/images/felt-ball-rug.jpg'], 'Wool felt', 'Nepal', true),
  ('Natural Felt Ball Coasters (Set of 4)', 'natural-felt-ball-coasters',
   'Four round coasters in undyed natural wool tones — cream, grey, brown and charcoal. Absorbent, heat-resistant and soft on the table.',
   29.00, 35.00, 20, 'coasters-trivets', array['/images/felt-coasters.jpg'], 'Wool felt', 'Nepal', true),
  ('Mushroom Felt Pouch', 'mushroom-felt-pouch',
   'A hand-felted wool pouch decorated with red-and-white mushrooms and leaves. Fits a phone, glasses or small essentials.',
   24.00, null, 15, 'pouches-bags', array['/images/felt-mushroom-pouch.jpg'], 'Wool felt', 'Nepal', true)
) as v(name, slug, description, price, compare_at, stock, cat, images, material, origin, featured)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

insert into public.coupons (code, type, value, min_order) values ('WELCOME10', 'percent', 10, 0)
on conflict (code) do nothing;
