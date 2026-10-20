# Gayatri Store — B2B Wholesale & FMCG Distribution

Premium wholesale supplier and FMCG distribution website for bulk products such as spices, edible oils, agarbatti, dhoop, matchsticks, and daily goods serving Maya Bazar and surrounding regional markets (~50+ km).

Tagline: *"Har Dukaan Tak, Bharosemand Supply."*

## Tech Stack & Architecture

- Next.js 16 App Router & Turbopack
- TypeScript
- Tailwind CSS 4 with inline theme tokens
- shadcn/ui design primitives
- Supabase PostgreSQL with Row Level Security (RLS)
- Next.js Server Actions & API Routes
- Multilingual Wholesale AI Assistant (22 Indian languages)
- Progressive Web App (PWA) Manifest & Schema.org JSON-LD Structured Data

## Visual Identity & Design System

The platform uses an elevated Indian FMCG wholesale aesthetic:

- **Warm Ivory (`#FFF9F0`):** Default page background canvas
- **Pure White Cards (`#FFFFFF`):** High-contrast cards and modals
- **Deep Forest Green (`#174735`):** Primary brand headings, trust badges, and accents
- **Fresh Green (`#347754`):** Secondary interactive accents, tags, and category highlights
- **Turmeric Yellow (`#F4C542`):** Primary quotation & bulk-order CTA actions
- **Vibrant Coral Accent (`#E66A50`):** Selective highlights and alerts
- **Warm Charcoal (`#252A24`):** High-contrast primary reading text
- **Secondary Text (`#666D64`):** Balanced supporting descriptions
- **Light Border (`#EAE3D7`):** Refined surface borders
- **Surface Dark Mode:** Obsidian and deep forest charcoal surfaces with high-contrast cream typography


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
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
META_GRAPH_API_VERSION=v25.0
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_NOTIFY_TO=918849263377
```

Set `ADMIN_SESSION_SECRET` to a cryptographically random value of at least 32 characters, and use a strong `ADMIN_PASSWORD`. Keep `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `WHATSAPP_ACCESS_TOKEN` private. They are used only by server-side routes.

The multilingual wholesale assistant needs `OPENAI_API_KEY` set in the local environment and in Vercel. `OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`. The assistant supports all 22 languages in India's Eighth Schedule; live product stock and prices are not sent to the AI.

## Supabase Setup

For a new Supabase project:

1. Create the project and wait until its database is ready.
2. In Supabase Project Settings -> API Keys, copy the Project URL, publishable key, and secret key. Legacy `anon` and `service_role` keys are also supported.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable or legacy `anon` key), and `SUPABASE_SERVICE_ROLE_KEY` (secret or legacy `service_role` key) in local `.env` and in Vercel Project Settings -> Environment Variables. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only; never use a `NEXT_PUBLIC_` prefix for it.
4. In the Supabase SQL Editor, run `supabase/run-this-in-sql-editor.sql`, then apply `supabase/migrations/20261015154037_wholesale_platform.sql`. The migration enables RLS and grants the roles required by this app's public and server-side access.
5. Set a strong `ADMIN_PASSWORD` and a random `ADMIN_SESSION_SECRET` of at least 32 characters in both environments.
6. Redeploy Vercel after setting its environment variables.

The storefront remains available in setup mode before Supabase is configured, but product, enquiry, and admin data features require valid project keys and the SQL setup above. The local `.env` is not used by Vercel.

A newly created project starts with no previous products, enquiries, orders, or business settings. The SQL setup creates the schema only; restore data from a Supabase backup if one is available, otherwise re-enter it in Admin after setup.

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
