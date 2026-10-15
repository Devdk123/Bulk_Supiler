# The Bulk Supplier

Premium full-stack wholesale supplier website for bulk products such as spices, agarbatti, dhoop, tea patti, machis and daily goods.

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- shadcn/ui-style local components
- Supabase PostgreSQL
- Next.js API routes
- Responsive SEO-ready pages

## Install

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
NEXT_PUBLIC_SITE_URL=https://bulksupiler.in
NEXT_PUBLIC_WHATSAPP_NUMBER=918849263377
META_GRAPH_API_VERSION=v25.0
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_NOTIFY_TO=918849263377
```

Set `ADMIN_SESSION_SECRET` to a cryptographically random value of at least 32 characters, and use a strong `ADMIN_PASSWORD`. Keep `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `WHATSAPP_ACCESS_TOKEN` private. They are used only by server-side routes.

## Supabase Setup

1. Create a Supabase project.
2. Run the existing base setup in `supabase/run-this-in-sql-editor.sql` if the project does not already have the `products` and `orders` tables.
3. Apply the versioned migration at `supabase/migrations/20261015154037_wholesale_platform.sql`. It preserves existing product/order rows, but sets pre-existing catalogue rows to draft by default; review and republish only verified entries in Admin.
4. Add the project URL and keys to `.env`.

The base schema creates:

- `products`
- `orders`

The versioned migration adds brands, categories, product variants/images/price tiers, enquiries and enquiry items, business settings, RLS policies, and the public product-image bucket. Never run schema setup or migrations against production without checking the current schema and taking a database backup.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Admin Panel

Visit:

```text
/about/admin
```

Enter the value from `ADMIN_PASSWORD`. Admin API calls use a signed, HTTP-only session cookie; the password is not sent with each API request.

Admin features include product, brand, category and public business-settings management; image uploads; quote-enquiry search/status updates; legacy-order history; and CSV/XLSX catalogue import/export.

## Order Flow

The quote form validates buyer details and selected published products, saves an idempotent multi-item enquiry, and offers a follow-up through the configured WhatsApp number:

```text
+91 884 926 3377
```

When `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` are configured, the API can also send a WhatsApp Cloud API notification to `WHATSAPP_NOTIFY_TO`. Existing order records are retained and available read-only in Admin; new requests use the quotation flow.

## Deploy on Vercel

1. Import the repository in Vercel.
2. Add the variables from `.env.example` in Vercel Project Settings -> Environment Variables. Vercel does not read this local `.env` file during deployment.
3. Set `NEXT_PUBLIC_SITE_URL` to `https://bulksupiler.in`; add that domain to the Vercel project and configure DNS as Vercel instructs.
4. Apply the Supabase base schema if needed, then the versioned migration. Do not deploy the updated app before the migration is applied.
5. Deploy and test an admin login, product publish, image upload, catalogue display, and saved enquiry.

## Connect a Custom Domain

1. In Vercel, open Project Settings -> Domains and add `bulksupiler.in`.
2. Update DNS records as Vercel instructs.
3. After DNS propagation, keep `NEXT_PUBLIC_SITE_URL=https://bulksupiler.in` for Production and redeploy.

## Production Notes

- The product catalogue starts empty: create accurate products in Admin; drafts are private until explicitly published.
- Public product access is RLS-limited to published records. Enquiries and admin data are only accessed by server routes using the service-role key.
- Product-image uploads are limited to JPEG, PNG, and WebP files up to 5 MB.
- Admin login and quote-submission attempts are throttled per server process. For reliable distributed rate limiting on Vercel, configure a persistent rate-limit service before high-traffic production use.
- Vercel does not read `.env`; copy the variable names from `.env.example` into the Vercel project's Environment Variables and set production secrets there. Never commit `.env`.
- The project uses an additive migration. Review it and back up the database before applying it; the migration has not been applied automatically.
- Confirm Vercel Domain ownership/DNS and Supabase project settings before calling the site production-ready.
