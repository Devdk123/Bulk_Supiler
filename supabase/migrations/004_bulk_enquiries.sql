-- ==============================================================================
-- 004_bulk_enquiries.sql
-- Gayatri Store Wholesale Platform: Bulk Enquiries, Item Snapshots, and Audit Logs
-- ==============================================================================

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default (
    'Q-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  ),
  client_request_id uuid not null unique,
  customer_id uuid references public.profiles(id) on delete set null,
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
  customer_notes text,
  internal_notes text,
  status text not null default 'New'
    check (status in ('New', 'Under Review', 'Quotation Sent', 'Confirmed', 'Processing', 'Dispatched', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backwards compatibility alterations
alter table public.enquiries
  add column if not exists customer_id uuid references public.profiles(id) on delete set null,
  add column if not exists customer_notes text,
  add column if not exists internal_notes text;

drop trigger if exists set_enquiries_updated_at on public.enquiries;
create trigger set_enquiries_updated_at
  before update on public.enquiries
  for each row execute function public.handle_updated_at();

create index if not exists enquiries_customer_id_idx on public.enquiries (customer_id);
create index if not exists enquiries_status_created_at_idx on public.enquiries (status, created_at desc);

-- Enquiry Items
create table if not exists public.enquiry_items (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid,
  product_name text not null,
  variant_name text,
  sku text,
  packaging text,
  unit text,
  quantity numeric not null check (quantity > 0),
  quoted_unit_price numeric check (quoted_unit_price is null or quoted_unit_price > 0),
  line_notes text,
  created_at timestamptz not null default now(),
  foreign key (variant_id, product_id)
    references public.product_variants(id, product_id)
    on delete restrict
);

alter table public.enquiry_items
  add column if not exists sku text,
  add column if not exists quoted_unit_price numeric check (quoted_unit_price is null or quoted_unit_price > 0),
  add column if not exists line_notes text;

create index if not exists enquiry_items_enquiry_id_idx on public.enquiry_items (enquiry_id);
create index if not exists enquiry_items_product_id_idx on public.enquiry_items (product_id);

-- Admin Audit Log Table
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_entity_idx on public.admin_audit_logs (entity_type, entity_id);

-- Atomic RPC function to create enquiry with items
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
  target_customer_id uuid;
begin
  target_customer_id := nullif(p_enquiry ->> 'customer_id', '')::uuid;

  insert into public.enquiries (
    client_request_id,
    customer_id,
    business_name,
    contact_person,
    phone,
    email,
    city,
    state,
    pin_code,
    gstin,
    delivery_requirements,
    message,
    customer_notes
  )
  values (
    (p_enquiry ->> 'client_request_id')::uuid,
    target_customer_id,
    p_enquiry ->> 'business_name',
    p_enquiry ->> 'contact_person',
    p_enquiry ->> 'phone',
    nullif(p_enquiry ->> 'email', ''),
    p_enquiry ->> 'city',
    p_enquiry ->> 'state',
    p_enquiry ->> 'pin_code',
    nullif(p_enquiry ->> 'gstin', ''),
    nullif(p_enquiry ->> 'delivery_requirements', ''),
    nullif(p_enquiry ->> 'message', ''),
    nullif(p_enquiry ->> 'customer_notes', '')
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
      sku,
      packaging,
      unit,
      quantity,
      line_notes
    )
    select
      saved_id,
      item.product_id::uuid,
      nullif(item.variant_id, '')::uuid,
      item.product_name,
      nullif(item.variant_name, ''),
      nullif(item.sku, ''),
      nullif(item.packaging, ''),
      nullif(item.unit, ''),
      item.quantity::numeric,
      nullif(item.line_notes, '')
    from jsonb_to_recordset(p_items) as item(
      product_id text,
      variant_id text,
      product_name text,
      variant_name text,
      sku text,
      packaging text,
      unit text,
      quantity text,
      line_notes text
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
