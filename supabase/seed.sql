-- Quote-only starter catalogue. Product names below come from the supplied brief.
-- No prices, pack sizes, SKUs, inventory, MOQ, or product imagery are asserted.
-- Safe to rerun: existing rows and later admin edits are left unchanged.
begin;

insert into public.categories (name, slug, status, is_active)
values
  ('Masala & Spices', 'masala-spices', 'published', true),
  ('Matchsticks', 'matchsticks', 'published', true),
  ('Dhoop', 'dhoop', 'published', true)
on conflict (slug) do nothing;

insert into public.brands (name, slug, status, is_active)
values
  ('Jhaveri''s Mast!', 'jhaveris-mast', 'published', true),
  ('Kisan', 'kisan', 'published', true),
  ('GrahShanti', 'grahshanti', 'published', true)
on conflict (slug) do nothing;

with entries(name, slug, brand_slug, category_slug, description) as (
  values
    ('Jhaveri''s Mast! Haldi Powder', 'jhaveris-mast-haldi-powder', 'jhaveris-mast', 'masala-spices', 'Turmeric powder. Wholesale price and current packaging available on request.'),
    ('Jhaveri''s Mast! Red Chilli Powder', 'jhaveris-mast-red-chilli-powder', 'jhaveris-mast', 'masala-spices', 'Red chilli powder. Wholesale price and current packaging available on request.'),
    ('Jhaveri''s Mast! Coriander Powder', 'jhaveris-mast-coriander-powder', 'jhaveris-mast', 'masala-spices', 'Coriander powder. Wholesale price and current packaging available on request.'),
    ('Jhaveri''s Mast! Cumin Powder', 'jhaveris-mast-cumin-powder', 'jhaveris-mast', 'masala-spices', 'Cumin powder. Wholesale price and current packaging available on request.'),
    ('Jhaveri''s Mast! Garam Masala', 'jhaveris-mast-garam-masala', 'jhaveris-mast', 'masala-spices', 'Garam masala. Wholesale price and current packaging available on request.'),
    ('Jhaveri''s Mast! Chaat Masala', 'jhaveris-mast-chaat-masala', 'jhaveris-mast', 'masala-spices', 'Chaat masala. Wholesale price and current packaging available on request.'),
    ('Jhaveri''s Mast! Kitchen King Masala', 'jhaveris-mast-kitchen-king-masala', 'jhaveris-mast', 'masala-spices', 'Kitchen King masala. Wholesale price and current packaging available on request.'),
    ('Jhaveri''s Mast! Sabzi Masala', 'jhaveris-mast-sabzi-masala', 'jhaveris-mast', 'masala-spices', 'Sabzi masala. Wholesale price and current packaging available on request.'),
    ('Jhaveri''s Mast! Chhole Masala', 'jhaveris-mast-chhole-masala', 'jhaveris-mast', 'masala-spices', 'Chhole masala. Wholesale price and current packaging available on request.'),
    ('Jhaveri''s Mast! Pav Bhaji Masala', 'jhaveris-mast-pav-bhaji-masala', 'jhaveris-mast', 'masala-spices', 'Pav Bhaji masala. Wholesale price and current packaging available on request.'),
    ('Jhaveri''s Mast! Biryani/Pulao Masala', 'jhaveris-mast-biryani-pulao-masala', 'jhaveris-mast', 'masala-spices', 'Biryani/Pulao masala. Wholesale price and current packaging available on request.'),
    ('Kisan Safety Matchsticks', 'kisan-safety-matchsticks', 'kisan', 'matchsticks', 'Safety matchsticks. Wholesale price and current packaging available on request.'),
    ('GrahShanti 3-in-One Dhoop', 'grahshanti-3-in-one-dhoop', 'grahshanti', 'dhoop', '3-in-One Dhoop. Wholesale price and current packaging available on request.')
), resolved as (
  select e.*, b.id as brand_id, c.id as category_id
  from entries e
  join public.brands b on b.slug = e.brand_slug
  join public.categories c on c.slug = e.category_slug
)
insert into public.products (
  name, slug, description, brand_id, category_id, price, sku, moq,
  quality, packing, image_url, active, status, quote_only, stock_status
)
select name, slug, description, brand_id, category_id, null, null, null,
       null, null, null, true, 'published', true, 'unknown'
from resolved
on conflict (slug) do nothing;

commit;
