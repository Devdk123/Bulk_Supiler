-- ==============================================================================
-- 006_rls_policies.sql
-- Gayatri Store Wholesale Platform: Row Level Security & Access Control
-- ==============================================================================

-- 1. Enable RLS on all public schema tables
alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_price_tiers enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_items enable row level security;
alter table public.business_settings enable row level security;
alter table public.admin_audit_logs enable row level security;

-- ==============================================================================
-- PROFILES POLICIES
-- ==============================================================================
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());

drop policy if exists "Users can update own profile fields" on public.profiles;
create policy "Users can update own profile fields"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    -- Normal users cannot change their own role
    (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()))
    or public.is_admin()
  );

-- ==============================================================================
-- BRANDS POLICIES
-- ==============================================================================
drop policy if exists "Published brands are publicly readable" on public.brands;
create policy "Published brands are publicly readable"
  on public.brands for select to anon, authenticated
  using (status = 'published' or public.is_staff());

drop policy if exists "Admins can manage brands" on public.brands;
create policy "Admins can manage brands"
  on public.brands for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- CATEGORIES POLICIES
-- ==============================================================================
drop policy if exists "Published categories are publicly readable" on public.categories;
create policy "Published categories are publicly readable"
  on public.categories for select to anon, authenticated
  using (status = 'published' or public.is_staff());

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- PRODUCTS POLICIES
-- ==============================================================================
drop policy if exists "Published products are publicly readable" on public.products;
create policy "Published products are publicly readable"
  on public.products for select to anon, authenticated
  using ((status = 'published' and active = true) or public.is_staff());

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- PRODUCT VARIANTS POLICIES
-- ==============================================================================
drop policy if exists "Active variants of published products are publicly readable" on public.product_variants;
create policy "Active variants of published products are publicly readable"
  on public.product_variants for select to anon, authenticated
  using (
    public.is_staff()
    or (
      active = true
      and exists (
        select 1 from public.products
        where products.id = product_variants.product_id
          and products.status = 'published'
          and products.active = true
      )
    )
  );

drop policy if exists "Admins can manage variants" on public.product_variants;
create policy "Admins can manage variants"
  on public.product_variants for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- PRODUCT IMAGES POLICIES
-- ==============================================================================
drop policy if exists "Images of published products are publicly readable" on public.product_images;
create policy "Images of published products are publicly readable"
  on public.product_images for select to anon, authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.products
      where products.id = product_images.product_id
        and products.status = 'published'
        and products.active = true
    )
  );

drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Admins can manage product images"
  on public.product_images for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- PRODUCT PRICE TIERS POLICIES
-- ==============================================================================
drop policy if exists "Price tiers of published products are publicly readable" on public.product_price_tiers;
create policy "Price tiers of published products are publicly readable"
  on public.product_price_tiers for select to anon, authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.products
      where products.id = product_price_tiers.product_id
        and products.status = 'published'
        and products.active = true
    )
  );

drop policy if exists "Admins can manage price tiers" on public.product_price_tiers;
create policy "Admins can manage price tiers"
  on public.product_price_tiers for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- ENQUIRIES POLICIES
-- ==============================================================================
drop policy if exists "Customers can view own enquiries" on public.enquiries;
create policy "Customers can view own enquiries"
  on public.enquiries for select to authenticated
  using (customer_id = auth.uid() or public.is_staff());

drop policy if exists "Staff and Admins can update enquiries" on public.enquiries;
create policy "Staff and Admins can update enquiries"
  on public.enquiries for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ==============================================================================
-- ENQUIRY ITEMS POLICIES
-- ==============================================================================
drop policy if exists "Customers can view own enquiry items" on public.enquiry_items;
create policy "Customers can view own enquiry items"
  on public.enquiry_items for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.enquiries
      where enquiries.id = enquiry_items.enquiry_id
        and enquiries.customer_id = auth.uid()
    )
  );

drop policy if exists "Staff and Admins can manage enquiry items" on public.enquiry_items;
create policy "Staff and Admins can manage enquiry items"
  on public.enquiry_items for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ==============================================================================
-- BUSINESS SETTINGS POLICIES
-- ==============================================================================
drop policy if exists "Public business settings are publicly readable" on public.business_settings;
create policy "Public business settings are publicly readable"
  on public.business_settings for select to anon, authenticated
  using (is_public = true or public.is_staff());

drop policy if exists "Admins can manage business settings" on public.business_settings;
create policy "Admins can manage business settings"
  on public.business_settings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- ADMIN AUDIT LOGS POLICIES
-- ==============================================================================
drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
create policy "Admins can read audit logs"
  on public.admin_audit_logs for select to authenticated
  using (public.is_admin());

drop policy if exists "Staff can insert audit logs" on public.admin_audit_logs;
create policy "Staff can insert audit logs"
  on public.admin_audit_logs for insert to authenticated
  with check (public.is_staff());

-- ==============================================================================
-- POSTGRES GRANTS
-- ==============================================================================
grant usage on schema public to anon, authenticated;

-- Public / Anon Grants
grant select on public.brands, public.categories, public.products,
  public.product_variants, public.product_images, public.product_price_tiers,
  public.business_settings to anon;

-- Authenticated Grants
grant select, update on public.profiles to authenticated;
grant select on public.brands, public.categories, public.products,
  public.product_variants, public.product_images, public.product_price_tiers,
  public.business_settings to authenticated;
grant select on public.enquiries, public.enquiry_items to authenticated;
grant update on public.enquiries to authenticated;
grant insert on public.admin_audit_logs to authenticated;

-- Service Role Full Grants
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;
