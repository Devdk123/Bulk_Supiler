# Gayatri Store — Supabase Database Setup & Migration Guide

This document provides the step-by-step guide to applying migrations, verifying Row Level Security (RLS), setting up storage, and bootstrapping the first administrator for **Gayatri Store**.

---

## 1. Migration Execution Order

The files are versioned database changes. Inspect the project's migration history and apply pending migrations in order; on an existing project, do not rerun the base SQL or reapply changes already recorded as complete. Use Supabase CLI migration history when available. The SQL Editor does not automatically record files in CLI migration history.

### Recommended Sequence:

1. [`001_profiles_and_roles.sql`](./migrations/001_profiles_and_roles.sql): Profiles table linked to `auth.users`, role management (`admin`, `staff`, `customer`), triggers, and `bootstrap_admin()` procedure.
2. [`002_brands_and_categories.sql`](./migrations/002_brands_and_categories.sql): Brands, category hierarchies (`parent_id`), sort orders, and triggers.
3. [`003_products_and_variants.sql`](./migrations/003_products_and_variants.sql): Products, variants, product images, and tiered volume pricing tables.
4. [`004_bulk_enquiries.sql`](./migrations/004_bulk_enquiries.sql): Bulk enquiries with `customer_id` account linking, item snapshots, and `admin_audit_logs`.
5. [`005_business_settings.sql`](./migrations/005_business_settings.sql): Key-value business settings with public vs private flag and Gayatri Store Maya Bazar defaults.
6. [`006_rls_policies.sql`](./migrations/006_rls_policies.sql): Complete Row Level Security policies for Public, Authenticated Customers, Staff, and Administrators, plus table grants.
7. [`007_storage_policies.sql`](./migrations/007_storage_policies.sql): Storage bucket (`product-images`, 5MB limit) and read/write policies on `storage.objects`.
8. [`008_performance_indexes.sql`](./migrations/008_performance_indexes.sql): GIN full-text search indexes and composite browsing indexes.
9. [`20261015154037_wholesale_platform.sql`](./migrations/20261015154037_wholesale_platform.sql): Wholesale catalogue, variants, enquiries, public settings, import procedures, and related policies.
10. [`20261023180000_localized_catalogue_content.sql`](./migrations/20261023180000_localized_catalogue_content.sql): Optional Hindi product descriptions and category labels.
11. [`20261023193000_assistant_rate_limit.sql`](./migrations/20261023193000_assistant_rate_limit.sql): Private shared rate-limit storage and RPC for the server-side AI assistant.
12. [`seed.sql`](./seed.sql) *(Optional initial data)*: Starter brands and wholesale categories. Review before running; it is not the customer starter catalogue import.

For a linked project, use `npx supabase db push` to apply migrations not yet recorded in the project's migration history. Review the pending migration list before confirming the CLI prompt.

---

## 2. Applying via Supabase Dashboard (SQL Editor)

If using the Supabase Web Console:

1. Open the intended project from the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. For a new database, run the migration files in the sequence above. For an existing database, run only migrations that have not already been applied; do not rerun the bundled base script or a migration that has already changed the schema.
5. Run `seed.sql` only if you want its optional starter brand/category records. The product catalogue is imported separately through the existing admin import workflow.

---

## 3. How to Bootstrap the First Administrator

To prevent privilege escalation, users who register through the public website are automatically assigned the `'customer'` role. To promote an account to `'admin'`:

### Step 1: Create or Register Your Account
Sign up via the website at `/register` or `/login`, or create a user in **Supabase Dashboard -> Authentication -> Users -> Add User**.

### Step 2: Promote to Admin
In the Supabase SQL Editor, run:

```sql
select public.bootstrap_admin('your-admin-email@example.com');
```

This procedure safely:
1. Finds the user in `auth.users`.
2. Updates their `public.profiles` row with `role = 'admin'`.
3. Adds `{"role": "admin"}` to their `auth.users.raw_app_meta_data` for immediate JWT validation without exposing service keys.

Verify with:
```sql
select id, role, full_name, phone from public.profiles where role = 'admin';
```

---

## 4. Supabase Auth Configuration

In **Supabase Dashboard -> Authentication -> URL Configuration**:

- **Site URL:**
  ```text
  https://bulk-supiler.vercel.app
  ```
- **Redirect URLs:**
  ```text
  http://localhost:3000/auth/callback
  http://localhost:3000/account
  http://localhost:3000/reset-password
  https://bulk-supiler.vercel.app/auth/callback
  https://bulk-supiler.vercel.app/account
  https://bulk-supiler.vercel.app/reset-password
  ```

---

## 5. Storage Verification

Check that the bucket exists and is public:
```sql
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'product-images';
```

Expected result:
- `id`: `product-images`
- `public`: `true`
- `file_size_limit`: `5242880` (5 MB)
- `allowed_mime_types`: `{"image/jpeg","image/png","image/webp"}`

---

## 6. RLS Verification Queries

Test database permissions directly in SQL Editor:

### Test 1: Public catalogue query
```sql
set role anon;
select id, name, status, active from public.products;
-- Should only return rows with status = 'published' and active = true
```

### Test 2: Anonymous enquiry confidentiality
```sql
set role anon;
select count(*) from public.enquiries;
-- Expected output: 0 (anonymous visitors cannot read enquiries)
reset role;
```

### Test 3: Customer profile isolation
```sql
-- Authenticated users only see their own profile
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000000';
select * from public.profiles;
-- Only returns profile matching sub
reset role;
```

---

## 7. Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `permission denied for table ...` | Missing RLS policy or grant | Run `006_rls_policies.sql` to apply standard grants and RLS policies. |
| `User not found in auth.users` | Running `bootstrap_admin` before signing up | Register the user via `/register` or Supabase dashboard first, then run `bootstrap_admin`. |
| Upload fails with `Bucket not found` | Storage bucket not initialized | Run `007_storage_policies.sql` to register the `product-images` bucket. |
| Products show in admin but not storefront | Products are in `draft` state | Ensure the product is marked `published` and `active` in the Admin catalogue. |
| Customer cannot see submitted quotes | Guest enquiry submitted | If submitted before login, enquiry is linked to phone/email. When logged in, `customer_id` is automatically recorded. |
