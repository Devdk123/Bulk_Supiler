-- ==============================================================================
-- 001_profiles_and_roles.sql
-- Gayatri Store Wholesale Platform: Profiles, User Roles, and Admin Bootstrap
-- ==============================================================================

create extension if not exists "pgcrypto";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('admin', 'staff', 'customer')),
  full_name text,
  phone text,
  business_name text,
  city text,
  state text,
  pincode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- 2. Automatically create profile row when an auth.user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    role,
    full_name,
    phone,
    business_name,
    city,
    state,
    pincode
  )
  values (
    new.id,
    'customer',
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'business_name', ''),
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    coalesce(new.raw_user_meta_data ->> 'state', ''),
    coalesce(new.raw_user_meta_data ->> 'pincode', '')
  )
  on conflict (id) do update set
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
    business_name = coalesce(nullif(excluded.business_name, ''), public.profiles.business_name),
    city = coalesce(nullif(excluded.city, ''), public.profiles.city),
    state = coalesce(nullif(excluded.state, ''), public.profiles.state),
    pincode = coalesce(nullif(excluded.pincode, ''), public.profiles.pincode),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Secure Authorization Helpers
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'customer'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (
    public.current_user_role() = 'admin'
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (
    public.current_user_role() in ('admin', 'staff')
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'staff')
  );
$$;

-- 4. Bootstrap First Admin Function
create or replace function public.bootstrap_admin(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  current_admin_count integer;
begin
  -- Count existing admins in profiles
  select count(*) into current_admin_count from public.profiles where role = 'admin';

  -- Find the user by email in auth.users
  select id into target_user_id from auth.users where lower(email) = lower(p_email);

  if target_user_id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'User with email ' || p_email || ' not found in auth.users. Please sign up or register first.'
    );
  end if;

  -- Ensure profile exists
  insert into public.profiles (id, role, full_name)
  values (target_user_id, 'admin', 'Store Administrator')
  on conflict (id) do update set role = 'admin', updated_at = now();

  -- Also update auth.users app_metadata for fast JWT claim checks
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
  where id = target_user_id;

  return jsonb_build_object(
    'success', true,
    'message', 'User ' || p_email || ' (' || target_user_id || ') has been successfully promoted to administrator.'
  );
end;
$$;

revoke all on function public.bootstrap_admin(text) from public, anon, authenticated;
grant execute on function public.bootstrap_admin(text) to service_role;
