-- ==============================================================================
-- 003_products_and_variants.sql
-- Gayatri Store Wholesale Platform: Products, Variants, Images & Price Tiers
-- ==============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text,
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  short_description text,
  description text,
  image_url text,
  variant text,
  unit text,
  pack_size text,
  units_per_carton integer check (units_per_carton is null or units_per_carton > 0),
  moq_quantity numeric check (moq_quantity is null or moq_quantity > 0),
  order_increment numeric check (order_increment is null or order_increment > 0),
  price_amount numeric check (price_amount is null or price_amount > 0),
  price_currency text default 'INR',
  price_unit text,
  quote_only boolean not null default true,
  stock_status text not null default 'unknown'
    check (stock_status in ('unknown', 'in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  active boolean not null default true,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backwards compatibility alterations
alter table public.products
  add column if not exists short_description text,
  add column if not exists is_published boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Ensure is_published stays in sync with status = 'published' and active
create or replace function public.sync_product_published_flag()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.is_published := (new.status = 'published' and new.active = true);
  return new;
end;
$$;

drop trigger if exists sync_product_published on public.products;
create trigger sync_product_published
  before insert or update of status, active on public.products
  for each row execute function public.sync_product_published_flag();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

create unique index if not exists products_sku_unique_idx
  on public.products (lower(sku))
  where sku is not null and btrim(sku) <> '';

create index if not exists products_brand_id_idx on public.products (brand_id);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_status_active_idx on public.products (status, active);
create index if not exists products_sort_order_idx on public.products (sort_order, name);

-- Product Variants
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  unit text,
  pack_size text,
  units_per_carton integer check (units_per_carton is null or units_per_carton > 0),
  moq_quantity numeric check (moq_quantity is null or moq_quantity > 0),
  order_increment numeric check (order_increment is null or order_increment > 0),
  price_amount numeric check (price_amount is null or price_amount > 0),
  price_currency text default 'INR',
  price_unit text,
  stock_status text not null default 'unknown'
    check (stock_status in ('unknown', 'in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, product_id)
);

drop trigger if exists set_product_variants_updated_at on public.product_variants;
create trigger set_product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.handle_updated_at();

create unique index if not exists product_variants_sku_unique_idx
  on public.product_variants (lower(sku))
  where sku is not null and btrim(sku) <> '';

create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

-- Product Images
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_images
  add column if not exists is_primary boolean not null default false;

create index if not exists product_images_product_sort_idx on public.product_images (product_id, sort_order);

-- Product Price Tiers
create table if not exists public.product_price_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid,
  minimum_quantity numeric not null check (minimum_quantity > 0),
  unit_price numeric not null check (unit_price > 0),
  currency text not null default 'INR',
  price_unit text,
  created_at timestamptz not null default now(),
  foreign key (variant_id, product_id)
    references public.product_variants(id, product_id)
    on delete restrict,
  unique (product_id, variant_id, minimum_quantity)
);

create index if not exists product_price_tiers_product_id_idx on public.product_price_tiers (product_id);
