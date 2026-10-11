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

Copy `.env.example` to `.env.local` and fill in the values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
NEXT_PUBLIC_WHATSAPP_NUMBER=919839450586
META_GRAPH_API_VERSION=v25.0
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_NOTIFY_TO=919839450586
```

Keep `SUPABASE_SERVICE_ROLE_KEY` private. It is used only by server-side API routes.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/run-this-in-sql-editor.sql` in the Supabase SQL Editor.
4. Add the project URL and keys to `.env.local`.

Tables created:

- `products`
- `orders`

The public site uses local product data for fast placeholder catalog rendering. The `products` table is ready for future CMS/admin expansion.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Admin Panel

Visit:

```text
/admin
```

Enter the value from `ADMIN_PASSWORD`.

Admin features:

- View orders from Supabase
- Search orders
- Filter by status
- Update status
- Export CSV
- Empty state when no orders exist

## Order Flow

The order form validates user input, saves the order to Supabase, then opens a pre-filled WhatsApp message to:

```text
+91 9839450586
```

If `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` are configured, the API also sends an optional WhatsApp Cloud API text notification to `WHATSAPP_NOTIFY_TO`.

## Deploy on Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Add all environment variables in Vercel Project Settings.
4. Deploy.
5. Confirm `/order` can write to Supabase and `/admin` can read orders.

## Connect a Custom Domain

1. In Vercel, open Project Settings -> Domains.
2. Add your domain.
3. Update DNS records as Vercel instructs.
4. After DNS propagation, set the domain as production.
5. Update `metadataBase`, `sitemap.ts`, and `robots.ts` if the final domain differs from `thebulksupplier.in`.

## Production Notes

- Use Supabase Row Level Security.
- Never expose the service role key in browser code.
- Replace placeholder product images with owned product/godown images before launch.
- Consider adding rate limiting to `/api/orders` for public traffic.
