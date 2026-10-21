-- ==============================================================================
-- 007_storage_policies.sql
-- Gayatri Store Wholesale Platform: Supabase Storage Configuration & Policies
-- ==============================================================================

-- 1. Create or ensure product-images bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 2. Storage Policies on storage.objects

-- A. Public read access for product images
drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

-- B. Authorized administrators and staff can upload product images
drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (public.is_staff() or auth.role() = 'service_role')
  );

-- C. Authorized administrators and staff can update/replace (upsert) images
drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and (public.is_staff() or auth.role() = 'service_role')
  )
  with check (
    bucket_id = 'product-images'
    and (public.is_staff() or auth.role() = 'service_role')
  );

-- D. Authorized administrators and staff can delete product images
drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (public.is_staff() or auth.role() = 'service_role')
  );
