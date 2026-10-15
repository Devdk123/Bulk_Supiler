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
