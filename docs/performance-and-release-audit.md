# Performance and release audit — 22 October 2026

## Measured baseline

The supplied DevTools capture showed the Next.js RSC document request at 7.67 s and several category prefetch requests taking 347–577 ms. A separate live HTTP check of the deployed pages measured:

| Route | First request TTFB / total | Repeat request TTFB / total |
| --- | ---: | ---: |
| `/` | 1.659 s / 1.811 s | 1.220 s / 1.435 s |
| `/products` | 0.369 s / 0.429 s | 0.291 s / 0.355 s |
| `/login` | 0.948 s / 0.999 s | 0.401 s / 0.467 s |

These are server HTTP timings, not browser paint, Core Web Vitals, or Lighthouse scores. The product endpoint in the configured Supabase project returned zero product rows. The live site and that project could not be verified as the same deployment/database, so no production data was changed.

## Recheck — 23 October 2026

The product route and homepage featured grid now render their shell without waiting for a server-side catalogue query. They load product cards through the existing public `/api/catalogue` endpoint and show a loading skeleton while it responds.

Against a local `next start` process with outbound access enabled, warm HTTP checks returned:

| Route | Status | Time to first byte | Response |
| --- | ---: | ---: | ---: |
| `/` | 200 | 5 ms | 180,587 B |
| `/products` | 200 | 4 ms | 64,746 B |
| `/api/catalogue?limit=24&offset=0` | 200 | 1.54 s | 10,645 B; 19 products |
| `/products/haldi-powder` | 200 | 1.48 s | 74,460 B |
| `/order` | 200 | 71 ms | 73,844 B |
| `/manifest.webmanifest` | 200 | 28 ms | 640 B |

These are warm local server response measurements, not production browser paint or Core Web Vitals. The public catalogue query returned 19 published products; all had a brand, `quote_only = true`, no configured amount, `stock_status = unknown`, and null pack size, carton quantity, MOQ, and order increment. The query also found 7 brands and 6 categories. No live production-domain timing was available.

The configured Supabase project does not yet have `categories.name_hi`; the public catalogue fallback succeeded and returns null Hindi category labels, which means category names remain English in Hindi mode until migration [`20261023180000_localized_catalogue_content.sql`](../supabase/migrations/20261023180000_localized_catalogue_content.sql) is applied. The read-only check confirms the customer-facing catalogue API works against the configured project. Earlier sandbox-only build attempts timed out because that build process had no outbound access; an outbound-enabled local run returned the catalogue successfully in 1.54 seconds.

## Changes in this release

- Keep the root layout and public business settings out of the server database request path.
- Load catalogue listings in 24 item pages, fetch lightweight list fields, debounce search, and return cacheable results from `/api/catalogue`.
- Put featured products and the order form behind loading boundaries.
- Add Vercel Speed Insights to the root layout. Enable it in the Vercel project dashboard under **Speed Insights** to begin collecting real-user metrics.
- Change product actions to request a wholesale quote; this application currently submits enquiries and does not implement checkout or payment capture.
- Use a browser-side Supabase PKCE confirmation page so email confirmation codes are exchanged in the browser and the session is persisted.
- Replace invented seed prices, pack sizes, SKUs, inventory and mismatched images with idempotent quote-only records for product names provided in the brief.

## Release checks and external setup

- `npm run build` completes successfully.
- `npm run lint` completes with zero errors and 17 existing unused-variable warnings.
- The signup form can only complete when the deployed Vercel environment has the matching `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and Supabase Auth permits the deployed origin and `/auth/confirm?next=/account` redirect. The Supabase Auth service and Vercel environment were not modified by this repository change.
- Follow-up check on 22 October 2026 found the deployed JavaScript uses `kwwcwdodvpcljjhfhaxg.supabase.co`, which did not resolve. Workspace `.env` points to `qclojxiuynbuwtaaiozm.supabase.co`; its Auth settings endpoint responded with HTTP 200 and allowed `https://bulk-supiler.vercel.app` by CORS preflight. The deployed public key also does not match the workspace key. Vercel needs both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` updated together from the intended Supabase project, followed by a production redeploy.
- The SQL seed was not run against Supabase. Review and run it from the intended project only after confirming that project is the production database.
- No post-deployment browser trace is available yet. Compare the same routes with DevTools/Lighthouse after deployment; activate Speed Insights for ongoing real-user measurements.
