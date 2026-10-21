-- ==============================================================================
-- 008_performance_indexes.sql
-- Gayatri Store Wholesale Platform: Performance Indexes & Full-Text Search
-- ==============================================================================

-- 1. Full-Text Search GIN index for high-performance catalogue search
create index if not exists products_fulltext_search_idx
  on public.products
  using gin (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(sku, '') || ' ' ||
      coalesce(pack_size, '')
    )
  );

-- 2. Composite performance indexes for storefront catalogue browsing
create index if not exists products_catalogue_composite_idx
  on public.products (status, active, category_id, brand_id);

create index if not exists products_published_created_idx
  on public.products (status, active, created_at desc);

create index if not exists products_published_sort_idx
  on public.products (status, active, sort_order, name);

-- 3. Variants & Price Tiers fast lookup
create index if not exists product_variants_active_composite_idx
  on public.product_variants (product_id, active, sort_order)
  where active = true;

create index if not exists product_price_tiers_variant_minqty_idx
  on public.product_price_tiers (product_id, variant_id, minimum_quantity);

-- 4. Customer Enquiry tracking indexes
create index if not exists enquiries_customer_status_idx
  on public.enquiries (customer_id, status, created_at desc);

create index if not exists enquiries_client_request_idx
  on public.enquiries (client_request_id);

create index if not exists enquiry_items_composite_idx
  on public.enquiry_items (enquiry_id, product_id, variant_id);

-- 5. Profiles & Roles fast lookup
create index if not exists profiles_role_idx
  on public.profiles (role);

create index if not exists profiles_phone_idx
  on public.profiles (phone);
