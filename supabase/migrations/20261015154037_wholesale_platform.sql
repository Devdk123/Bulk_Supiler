create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  alter column price drop not null,
  alter column moq drop not null,
  alter column quality drop not null,
  alter column packing drop not null,
  add column if not exists description text,
  add column if not exists sku text,
  add column if not exists brand_id uuid references public.brands(id) on delete set null,
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists variant text,
  add column if not exists unit text,
  add column if not exists pack_size text,
  add column if not exists units_per_carton integer check (units_per_carton is null or units_per_carton > 0),
  add column if not exists moq_quantity numeric check (moq_quantity is null or moq_quantity > 0),
  add column if not exists order_increment numeric check (order_increment is null or order_increment > 0),
  add column if not exists price_amount numeric check (price_amount is null or price_amount > 0),
  add column if not exists price_currency text,
  add column if not exists price_unit text,
  add column if not exists quote_only boolean not null default true,
  add column if not exists stock_status text not null default 'unknown'
    check (stock_status in ('unknown', 'in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists products_sku_unique_idx
  on public.products (lower(sku))
  where sku is not null and btrim(sku) <> '';

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
  price_currency text,
  price_unit text,
  stock_status text not null default 'unknown'
    check (stock_status in ('unknown', 'in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, product_id)
);

create unique index if not exists product_variants_sku_unique_idx
  on public.product_variants (lower(sku))
  where sku is not null and btrim(sku) <> '';

create index if not exists products_brand_id_idx on public.products (brand_id);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_status_created_at_idx on public.products (status, created_at desc);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

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

create index if not exists product_images_product_sort_idx on public.product_images (product_id, sort_order);
create index if not exists product_price_tiers_product_id_idx on public.product_price_tiers (product_id);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default (
    'Q-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  ),
  client_request_id uuid not null unique,
  business_name text not null,
  contact_person text not null,
  phone text not null,
  email text,
  city text not null,
  state text not null,
  pin_code text not null,
  gstin text,
  delivery_requirements text,
  message text,
  status text not null default 'New'
    check (status in ('New', 'Under Review', 'Quotation Sent', 'Confirmed', 'Processing', 'Dispatched', 'Completed', 'Cancelled')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enquiry_items (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid,
  product_name text not null,
  variant_name text,
  packaging text,
  unit text,
  quantity numeric not null check (quantity > 0),
  created_at timestamptz not null default now(),
  foreign key (variant_id, product_id)
    references public.product_variants(id, product_id)
    on delete restrict
);

create table if not exists public.business_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists enquiries_status_created_at_idx on public.enquiries (status, created_at desc);
create index if not exists enquiry_items_enquiry_id_idx on public.enquiry_items (enquiry_id);
create index if not exists enquiry_items_product_id_idx on public.enquiry_items (product_id);

alter table public.products enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_price_tiers enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_items enable row level security;
alter table public.business_settings enable row level security;

drop policy if exists "Active products are publicly readable" on public.products;
drop policy if exists "Published products are publicly readable" on public.products;
create policy "Published products are publicly readable"
  on public.products for select to anon, authenticated
  using (status = 'published' and active);

create policy "Published brands are publicly readable"
  on public.brands for select to anon, authenticated
  using (status = 'published');

create policy "Published categories are publicly readable"
  on public.categories for select to anon, authenticated
  using (status = 'published');

create policy "Public business settings are publicly readable"
  on public.business_settings for select to anon, authenticated
  using (is_public);

create policy "Active variants of published products are publicly readable"
  on public.product_variants for select to anon, authenticated
  using (
    active
    and exists (
      select 1 from public.products
      where products.id = product_variants.product_id
        and products.status = 'published'
        and products.active
    )
  );

drop policy if exists "Images of published products are publicly readable" on public.product_images;
create policy "Images of published products are publicly readable"
  on public.product_images for select to anon, authenticated
  using (
    exists (
      select 1 from public.products
      where products.id = product_images.product_id
        and products.status = 'published'
        and products.active
    )
  );

drop policy if exists "Price tiers of published products are publicly readable" on public.product_price_tiers;
create policy "Price tiers of published products are publicly readable"
  on public.product_price_tiers for select to anon, authenticated
  using (
    exists (
      select 1 from public.products
      where products.id = product_price_tiers.product_id
        and products.status = 'published'
        and products.active
    )
  );

revoke all on public.products, public.brands, public.categories, public.product_variants,
  public.product_images, public.product_price_tiers, public.enquiries, public.enquiry_items, public.business_settings
  from anon, authenticated;

grant select on public.products, public.brands, public.categories, public.product_variants,
  public.product_images, public.product_price_tiers, public.business_settings
  to anon, authenticated;
revoke insert, update, delete on public.business_settings from anon, authenticated;
grant all on public.products, public.brands, public.categories, public.product_variants,
  public.product_images, public.product_price_tiers, public.enquiries, public.enquiry_items, public.business_settings
  to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

create or replace function public.create_enquiry_with_items(p_enquiry jsonb, p_items jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  saved_id uuid;
  saved_reference text;
  saved_status text;
  was_created boolean;
begin
  insert into public.enquiries (
    client_request_id,
    business_name,
    contact_person,
    phone,
    email,
    city,
    state,
    pin_code,
    gstin,
    delivery_requirements,
    message
  )
  values (
    (p_enquiry ->> 'client_request_id')::uuid,
    p_enquiry ->> 'business_name',
    p_enquiry ->> 'contact_person',
    p_enquiry ->> 'phone',
    nullif(p_enquiry ->> 'email', ''),
    p_enquiry ->> 'city',
    p_enquiry ->> 'state',
    p_enquiry ->> 'pin_code',
    nullif(p_enquiry ->> 'gstin', ''),
    nullif(p_enquiry ->> 'delivery_requirements', ''),
    nullif(p_enquiry ->> 'message', '')
  )
  on conflict (client_request_id) do nothing
  returning id, reference, status into saved_id, saved_reference, saved_status;

  was_created := saved_id is not null;

  if was_created then
    insert into public.enquiry_items (
      enquiry_id,
      product_id,
      variant_id,
      product_name,
      variant_name,
      packaging,
      unit,
      quantity
    )
    select
      saved_id,
      item.product_id::uuid,
      nullif(item.variant_id, '')::uuid,
      item.product_name,
      nullif(item.variant_name, ''),
      nullif(item.packaging, ''),
      nullif(item.unit, ''),
      item.quantity::numeric
    from jsonb_to_recordset(p_items) as item(
      product_id text,
      variant_id text,
      product_name text,
      variant_name text,
      packaging text,
      unit text,
      quantity text
    );
  else
    select id, reference, status
      into saved_id, saved_reference, saved_status
      from public.enquiries
      where client_request_id = (p_enquiry ->> 'client_request_id')::uuid;
  end if;

  return jsonb_build_object(
    'id', saved_id,
    'reference', saved_reference,
    'status', saved_status,
    'created', was_created
  );
end;
$$;

revoke all on function public.create_enquiry_with_items(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_enquiry_with_items(jsonb, jsonb) to service_role;

create or replace function public.save_product_with_details(
  p_product jsonb,
  p_variants jsonb,
  p_images jsonb,
  p_price_tiers jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  saved_product_id uuid;
  selected_brand_id uuid := nullif(p_product ->> 'brand_id', '')::uuid;
  selected_category_id uuid := nullif(p_product ->> 'category_id', '')::uuid;
  product_status text := p_product ->> 'status';
  variant_row jsonb;
  tier_row jsonb;
  image_row jsonb;
  selected_variant_id uuid;
begin
  if product_status = 'published' and selected_brand_id is not null
    and not exists (select 1 from public.brands where id = selected_brand_id and status = 'published') then
    raise exception 'A product brand must be published before the product can be published.';
  end if;

  if product_status = 'published' and selected_category_id is not null
    and not exists (select 1 from public.categories where id = selected_category_id and status = 'published') then
    raise exception 'A product category must be published before the product can be published.';
  end if;

  saved_product_id := nullif(p_product ->> 'id', '')::uuid;

  if saved_product_id is null then
    insert into public.products (
      name, slug, price, moq, quality, packing, image_url, active,
      sku, description, brand_id, category_id, variant, unit, pack_size,
      units_per_carton, moq_quantity, order_increment, price_amount,
      price_currency, price_unit, quote_only, stock_status, status
    )
    values (
      p_product ->> 'name',
      p_product ->> 'slug',
      null,
      null,
      null,
      null,
      nullif(p_product ->> 'image_url', ''),
      product_status = 'published',
      nullif(p_product ->> 'sku', ''),
      nullif(p_product ->> 'description', ''),
      selected_brand_id,
      selected_category_id,
      nullif(p_product ->> 'variant', ''),
      nullif(p_product ->> 'unit', ''),
      nullif(p_product ->> 'pack_size', ''),
      nullif(p_product ->> 'units_per_carton', '')::integer,
      nullif(p_product ->> 'moq_quantity', '')::numeric,
      nullif(p_product ->> 'order_increment', '')::numeric,
      nullif(p_product ->> 'price_amount', '')::numeric,
      coalesce(nullif(p_product ->> 'price_currency', ''), 'INR'),
      nullif(p_product ->> 'price_unit', ''),
      coalesce((p_product ->> 'quote_only')::boolean, true),
      coalesce(nullif(p_product ->> 'stock_status', ''), 'unknown'),
      product_status
    )
    returning id into saved_product_id;
  else
    update public.products
    set name = p_product ->> 'name',
        slug = p_product ->> 'slug',
        image_url = nullif(p_product ->> 'image_url', ''),
        active = product_status = 'published',
        sku = nullif(p_product ->> 'sku', ''),
        description = nullif(p_product ->> 'description', ''),
        brand_id = selected_brand_id,
        category_id = selected_category_id,
        variant = nullif(p_product ->> 'variant', ''),
        unit = nullif(p_product ->> 'unit', ''),
        pack_size = nullif(p_product ->> 'pack_size', ''),
        units_per_carton = nullif(p_product ->> 'units_per_carton', '')::integer,
        moq_quantity = nullif(p_product ->> 'moq_quantity', '')::numeric,
        order_increment = nullif(p_product ->> 'order_increment', '')::numeric,
        price_amount = nullif(p_product ->> 'price_amount', '')::numeric,
        price_currency = coalesce(nullif(p_product ->> 'price_currency', ''), 'INR'),
        price_unit = nullif(p_product ->> 'price_unit', ''),
        quote_only = coalesce((p_product ->> 'quote_only')::boolean, true),
        stock_status = coalesce(nullif(p_product ->> 'stock_status', ''), 'unknown'),
        status = product_status,
        updated_at = now()
    where id = saved_product_id
    returning id into saved_product_id;

    if saved_product_id is null then
      raise exception 'Product was not found.';
    end if;
  end if;

  delete from public.product_images where product_id = saved_product_id;
  for image_row in select value from pg_catalog.jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) as items(value) loop
    insert into public.product_images (product_id, image_url, alt_text, sort_order)
    values (
      saved_product_id,
      image_row ->> 'image_url',
      nullif(image_row ->> 'alt_text', ''),
      coalesce(nullif(image_row ->> 'sort_order', '')::integer, 0)
    );
  end loop;

  update public.product_variants set active = false where product_id = saved_product_id;
  for variant_row in select value from pg_catalog.jsonb_array_elements(coalesce(p_variants, '[]'::jsonb)) as items(value) loop
    selected_variant_id := nullif(variant_row ->> 'id', '')::uuid;

    if selected_variant_id is not null then
      update public.product_variants
      set name = variant_row ->> 'name',
          sku = nullif(variant_row ->> 'sku', ''),
          unit = nullif(variant_row ->> 'unit', ''),
          pack_size = nullif(variant_row ->> 'pack_size', ''),
          units_per_carton = nullif(variant_row ->> 'units_per_carton', '')::integer,
          moq_quantity = nullif(variant_row ->> 'moq_quantity', '')::numeric,
          order_increment = nullif(variant_row ->> 'order_increment', '')::numeric,
          price_amount = nullif(variant_row ->> 'price_amount', '')::numeric,
          price_currency = coalesce(nullif(variant_row ->> 'price_currency', ''), 'INR'),
          price_unit = nullif(variant_row ->> 'price_unit', ''),
          stock_status = coalesce(nullif(variant_row ->> 'stock_status', ''), 'unknown'),
          active = coalesce((variant_row ->> 'active')::boolean, false),
          updated_at = now()
      where id = selected_variant_id and product_id = saved_product_id;

      if not found then
        raise exception 'A product option does not belong to this product.';
      end if;
    else
      insert into public.product_variants (
        product_id, name, sku, unit, pack_size, units_per_carton,
        moq_quantity, order_increment, price_amount, price_currency,
        price_unit, stock_status, active
      )
      values (
        saved_product_id,
        variant_row ->> 'name',
        nullif(variant_row ->> 'sku', ''),
        nullif(variant_row ->> 'unit', ''),
        nullif(variant_row ->> 'pack_size', ''),
        nullif(variant_row ->> 'units_per_carton', '')::integer,
        nullif(variant_row ->> 'moq_quantity', '')::numeric,
        nullif(variant_row ->> 'order_increment', '')::numeric,
        nullif(variant_row ->> 'price_amount', '')::numeric,
        coalesce(nullif(variant_row ->> 'price_currency', ''), 'INR'),
        nullif(variant_row ->> 'price_unit', ''),
        coalesce(nullif(variant_row ->> 'stock_status', ''), 'unknown'),
        coalesce((variant_row ->> 'active')::boolean, false)
      );
    end if;
  end loop;

  delete from public.product_price_tiers where product_id = saved_product_id;
  for tier_row in select value from pg_catalog.jsonb_array_elements(coalesce(p_price_tiers, '[]'::jsonb)) as items(value) loop
    selected_variant_id := nullif(tier_row ->> 'variant_id', '')::uuid;
    if selected_variant_id is null and nullif(tier_row ->> 'variant_name', '') is not null then
      select id into selected_variant_id
      from public.product_variants
      where product_id = saved_product_id
        and name = tier_row ->> 'variant_name'
      limit 1;
      if selected_variant_id is null then
        raise exception 'A price tier refers to an unknown product option.';
      end if;
    end if;

    insert into public.product_price_tiers (
      product_id, variant_id, minimum_quantity, unit_price, currency, price_unit
    )
    values (
      saved_product_id,
      selected_variant_id,
      (tier_row ->> 'minimum_quantity')::numeric,
      (tier_row ->> 'unit_price')::numeric,
      coalesce(nullif(tier_row ->> 'currency', ''), 'INR'),
      nullif(tier_row ->> 'price_unit', '')
    );
  end loop;

  return saved_product_id;
end;
$$;

revoke all on function public.save_product_with_details(jsonb, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_product_with_details(jsonb, jsonb, jsonb, jsonb) to service_role;

create or replace function public.save_products_bulk(p_products jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  product_row jsonb;
  saved_product_id uuid;
  saved_ids jsonb := '[]'::jsonb;
begin
  for product_row in
    select value from pg_catalog.jsonb_array_elements(p_products) as rows(value)
  loop
    saved_product_id := public.save_product_with_details(
      product_row -> 'product',
      coalesce(product_row -> 'variants', '[]'::jsonb),
      coalesce(product_row -> 'images', '[]'::jsonb),
      coalesce(product_row -> 'price_tiers', '[]'::jsonb)
    );
    saved_ids := saved_ids || pg_catalog.to_jsonb(saved_product_id);
  end loop;

  return saved_ids;
end;
$$;

revoke all on function public.save_products_bulk(jsonb) from public, anon, authenticated;
grant execute on function public.save_products_bulk(jsonb) to service_role;