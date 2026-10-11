create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  price text not null,
  moq text not null,
  quality text not null,
  packing text not null,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  whatsapp text not null,
  product_name text not null,
  quantity text not null,
  address text not null,
  city text not null,
  payment_method text not null check (payment_method in ('UPI', 'Cash', 'Bank Transfer')),
  message text,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Confirmed', 'Delivered', 'Cancelled')),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "Active products are publicly readable"
  on public.products
  for select
  using (active = true);

-- Orders are written and read by Next.js API routes with the service role key.
-- Do not expose the service role key in browser code.

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_city_idx on public.orders(city);

insert into public.products (name, slug, price, moq, quality, packing, image_url, active)
values
  ('Haldi Powder', 'haldi-powder', '₹120/kg', '20kg', 'Pure / Grade A', '5kg / 10kg bags', 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=1100&q=85', true),
  ('Mirchi Powder', 'mirchi-powder', '₹180/kg', '20kg', 'Deep color / Grade A', '5kg / 10kg bags', 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=1100&q=85', true),
  ('Dhania Powder', 'dhania-powder', '₹135/kg', '20kg', 'Fresh ground / Grade A', '5kg / 10kg bags', 'https://images.unsplash.com/photo-1599909533730-b255e0b88d7a?auto=format&fit=crop&w=1100&q=85', true),
  ('Chaat Masala', 'chaat-masala', '₹210/kg', '10kg', 'Premium blend', '1kg / 5kg packs', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1100&q=85', true),
  ('Kasturi Methi', 'kasturi-methi', '₹260/kg', '10kg', 'Aroma rich', '500g / 1kg packs', 'https://images.unsplash.com/photo-1567892737950-30c4db37cd89?auto=format&fit=crop&w=1100&q=85', true),
  ('Kali Mirch', 'kali-mirch', '₹620/kg', '10kg', 'Whole / bold size', '5kg / 10kg bags', 'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=1100&q=85', true),
  ('Agarbatti / Dhoop', 'agarbatti-dhoop', '₹28/box', '50 pieces', 'Long burning', 'Carton packing', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1100&q=85', true),
  ('Tea Patti', 'tea-patti', '₹190/kg', '25kg', 'Strong blend', '10kg / 25kg bags', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=1100&q=85', true),
  ('Machis', 'machis', '₹11/bundle', '100 bundles', 'Standard safety match', 'Bundle / carton', 'https://images.unsplash.com/photo-1528063905561-70463e97c095?auto=format&fit=crop&w=1100&q=85', true)
on conflict (slug) do update set
  name = excluded.name,
  price = excluded.price,
  moq = excluded.moq,
  quality = excluded.quality,
  packing = excluded.packing,
  image_url = excluded.image_url,
  active = excluded.active;
