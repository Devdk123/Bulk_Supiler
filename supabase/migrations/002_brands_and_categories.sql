-- ==============================================================================
-- 002_brands_and_categories.sql
-- Gayatri Store Wholesale Platform: Brands & Category Hierarchies
-- ==============================================================================

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  is_active boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backwards compatibility if brands was previously created with fewer columns
alter table public.brands
  add column if not exists description text,
  add column if not exists is_active boolean not null default true,
  add column if not exists sort_order integer not null default 0;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backwards compatibility if categories was previously created with fewer columns
alter table public.categories
  add column if not exists description text,
  add column if not exists image_url text,
  add column if not exists is_active boolean not null default true,
  add column if not exists sort_order integer not null default 0;

drop trigger if exists set_brands_updated_at on public.brands;
create trigger set_brands_updated_at
  before update on public.brands
  for each row execute function public.handle_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
  before update on public.categories
  for each row execute function public.handle_updated_at();

create index if not exists brands_status_idx on public.brands (status);
create index if not exists brands_sort_order_idx on public.brands (sort_order, name);
create index if not exists categories_parent_id_idx on public.categories (parent_id);
create index if not exists categories_status_idx on public.categories (status);
create index if not exists categories_sort_order_idx on public.categories (sort_order, name);
