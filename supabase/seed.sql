-- ==============================================================================
-- seed.sql
-- Gayatri Store: Realistic FMCG Wholesale Initial Seed Data
-- ==============================================================================

-- 1. Verified FMCG Brands
insert into public.brands (id, name, slug, status, sort_order)
values
  ('11111111-1111-4111-8111-111111111101', 'Jhaveri''s Mast!', 'jhaveris-mast', 'published', 1),
  ('11111111-1111-4111-8111-111111111102', 'Kisan', 'kisan', 'published', 2),
  ('11111111-1111-4111-8111-111111111103', 'Bharat Jyoti', 'bharat-jyoti', 'published', 3),
  ('11111111-1111-4111-8111-111111111104', 'Bhola', 'bhola', 'published', 4),
  ('11111111-1111-4111-8111-111111111105', 'GrahShanti', 'grahshanti', 'published', 5),
  ('11111111-1111-4111-8111-111111111106', 'Sukoon', 'sukoon', 'published', 6)
on conflict (slug) do update set
  name = excluded.name,
  status = 'published';

-- 2. Core Wholesale FMCG Categories
insert into public.categories (id, name, slug, status, sort_order)
values
  ('22222222-2222-4222-8222-222222222201', 'Masala & Spices', 'masala-and-spices', 'published', 1),
  ('22222222-2222-4222-8222-222222222202', 'Edible Oils', 'edible-oils', 'published', 2),
  ('22222222-2222-4222-8222-222222222203', 'Matchsticks', 'matchsticks', 'published', 3),
  ('22222222-2222-4222-8222-222222222204', 'Agarbatti', 'agarbatti', 'published', 4),
  ('22222222-2222-4222-8222-222222222205', 'Dhoop', 'dhoop', 'published', 5),
  ('22222222-2222-4222-8222-222222222206', 'Kapoor & Pooja Products', 'kapoor-and-pooja-products', 'published', 6)
on conflict (slug) do update set
  name = excluded.name,
  status = 'published';

-- 3. Initial FMCG Products
insert into public.products (
  id, name, slug, sku, brand_id, category_id,
  description, unit, pack_size, units_per_carton,
  moq_quantity, order_increment, price_amount, price_currency,
  price_unit, quote_only, stock_status, status, active, is_published, sort_order
)
values
  (
    '33333333-3333-4333-8333-333333333301',
    'Jhaveri''s Mast! Pure Turmeric Powder (Haldi)',
    'jhaveris-mast-pure-turmeric-powder-haldi',
    'JHM-HLD-500G',
    '11111111-1111-4111-8111-111111111101',
    '22222222-2222-4222-8222-222222222201',
    'Direct godown wholesale dispatch of premium high-curcumin pure turmeric powder. Cleaned, dried, and ground under hygienic standards for retail grocery stores.',
    'Packets',
    '500g pouch (Case of 24)',
    24,
    24,
    24,
    78.00,
    'INR',
    'pkt',
    false,
    'in_stock',
    'published',
    true,
    true,
    1
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    'Kisan Pure Mustard Oil (Kachi Ghani)',
    'kisan-pure-mustard-oil-kachi-ghani',
    'KSN-MST-1L',
    '11111111-1111-4111-8111-111111111102',
    '22222222-2222-4222-8222-222222222202',
    'Traditional cold-pressed mustard oil with pungent aroma and high smoke point. Standard retailer carton packaging.',
    'Bottles',
    '1 Litre Pet Bottle (Carton of 12)',
    12,
    12,
    12,
    138.00,
    'INR',
    'bottle',
    false,
    'in_stock',
    'published',
    true,
    true,
    2
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    'Bharat Jyoti Safety Matchboxes Master Carton',
    'bharat-jyoti-safety-matchboxes-master-carton',
    'BJ-MTCH-MSTR',
    '11111111-1111-4111-8111-111111111103',
    '22222222-2222-4222-8222-222222222203',
    'Damp-proof safety matchboxes packed in bundlers of 10s inside master commercial cartons for wholesale trade.',
    'Master Cartons',
    '600 Matchboxes / Master Carton',
    1,
    5,
    1,
    490.00,
    'INR',
    'carton',
    false,
    'in_stock',
    'published',
    true,
    true,
    3
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    'Sukoon Premium Flora Agarbatti (Champa & Sandal)',
    'sukoon-premium-flora-agarbatti-champa-sandal',
    'SKN-AGB-ZIP',
    '11111111-1111-4111-8111-111111111106',
    '22222222-2222-4222-8222-222222222204',
    'Long-lasting fragrant incense sticks made with natural essential extracts. High-turnover retail item for neighborhood Kirana stores.',
    'Zipper Pouches',
    '250g Zipper Pack (Outer box of 20)',
    20,
    20,
    20,
    65.00,
    'INR',
    'pouch',
    false,
    'in_stock',
    'published',
    true,
    true,
    4
  ),
  (
    '33333333-3333-4333-8333-333333333305',
    'Bhola Pure Refined Camphor (Bhimseni Kapoor Tablets)',
    'bhola-pure-refined-camphor-bhimseni-kapoor-tablets',
    'BHL-KPR-100G',
    '11111111-1111-4111-8111-111111111104',
    '22222222-2222-4222-8222-222222222206',
    '100% pure burning camphor tablets without black residue. Airtight jar packaging for retail counters.',
    'Jars',
    '100g Jar (Case of 24)',
    24,
    12,
    12,
    54.00,
    'INR',
    'jar',
    false,
    'in_stock',
    'published',
    true,
    true,
    5
  )
on conflict (slug) do update set
  name = excluded.name,
  status = 'published',
  active = true,
  is_published = true;
