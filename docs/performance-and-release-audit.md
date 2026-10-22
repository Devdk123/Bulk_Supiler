# Performance and release audit — 22 October 2026

> Historical measurements below describe the deployment checks performed at the time. They do not verify deployment of later commits.

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

These are warm local server response measurements, not production browser paint or Core Web Vitals. The public catalogue query returned 19 published products; all had a brand, `quote_only = true`, no configured amount, `stock_status = unknown`, and null pack size, carton quantity, MOQ, and order increment. The query also found 7 brands and 6 categories.

### Live deployment check

The Vercel GitHub status for commit `2c1b277` reported **Deployment has completed**. Public GET checks on `https://bulk-supiler.vercel.app` all returned HTTP 200: `/` (2.18 s), `/products` (1.04 s), `/products/haldi-powder` (2.26 s), `/order` (1.20 s), `/login` (1.05 s), `/register` (0.90 s), and `/account` (1.29 s). The manifest and service worker also returned 200. The live catalogue API returned 19 products in 2.73 s on the first check and 0.65 s on a repeat check. The HTML contained the new catalogue loading state, confirming the latest page implementation is deployed. These are HTTP timings, not authenticated account tests or browser paint metrics.

The public key embedded in the production JavaScript matched the workspace `.env` key without exposing the key value. The configured project's Supabase Auth settings endpoint returned 200 and allowed the production origin in its CORS response. This verifies Auth endpoint reachability and origin configuration, but does not substitute for completing a real signup/login with a test account.

The live catalogue response contained 19 products; the first product's detail page returned 200, rendered its name, and included its request-for-quote link. The production manifest, service worker, offline page, product placeholder, 192px and 512px icons, and maskable icon all returned 200. These are public HTTP checks; no authenticated signup, actual install prompt, browser offline session, or responsive viewport screenshot was performed.

The configured Supabase project does not yet have `categories.name_hi`; the public catalogue fallback succeeded and returns null Hindi category labels, which means category names remain English in Hindi mode until migration [`20261023180000_localized_catalogue_content.sql`](../supabase/migrations/20261023180000_localized_catalogue_content.sql) is applied. No database migration was run. The read-only check confirms the customer-facing catalogue API works against the configured project. Earlier sandbox-only build attempts timed out because that build process had no outbound access; an outbound-enabled local run returned the catalogue successfully in 1.54 seconds.

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
- Latest verified lint run: zero errors and 2 existing unused-variable warnings (`src/app/api/admin/audit-logs/route.ts:56`, `src/app/not-found.tsx:2`).
- The signup form can only complete when the deployed Vercel environment has the matching `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and Supabase Auth permits the deployed origin and `/auth/confirm?next=/account` redirect. The Supabase Auth service and Vercel environment were not modified by this repository change.
- Follow-up check on 22 October 2026 found the deployed JavaScript uses `kwwcwdodvpcljjhfhaxg.supabase.co`, which did not resolve. Workspace `.env` points to `qclojxiuynbuwtaaiozm.supabase.co`; its Auth settings endpoint responded with HTTP 200 and allowed `https://bulk-supiler.vercel.app` by CORS preflight. The deployed public key also does not match the workspace key. Vercel needs both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` updated together from the intended Supabase project, followed by a production redeploy.
- The SQL seed was not run against Supabase. Review and run it from the intended project only after confirming that project is the production database.
- No post-deployment browser trace is available yet. Compare the same routes with DevTools/Lighthouse after deployment; activate Speed Insights for ongoing real-user measurements.

## Follow-up — 23 October 2026

Commits `2a367f7` and `231fe03` were pushed to `main`. They bound account enquiry-history loading to 10 seconds with English/Hindi retry messages, and restrict the assistant's language selector to the supported English and Hindi interface languages while preserving its English, Devanagari Hindi, and Hinglish/Roman Hindi response guidance. The acceptance suite passed 17 checks and `npx tsc --noEmit` passed after these changes. A production build passed after `2a367f7`; it was not rerun after the small language-list change. Lint completed with zero errors and the two warnings listed above.

GitHub's commit status API reports Vercel **success — Deployment has completed** for `231fe03` (updated 22 October 2026 20:53 UTC). The `gh` CLI is unavailable in the workspace. Follow-up direct requests from this workspace to the production host timed out, so the successful deployment status is verified, but current route response codes and browser behavior were not independently checked. The earlier route measurements above predate these two commits.

The local `.env` contains the public Supabase URL and key, but its `OPENAI_API_KEY` is unset. The assistant endpoint responds with its setup-required state when that key is absent; the interface localizes this state in Hindi. To enable the real LLM integration in production, set `OPENAI_API_KEY` as a server-only Vercel Production environment variable and optionally set `OPENAI_MODEL` (default `gpt-4o-mini`), then redeploy. Do not use a `NEXT_PUBLIC_` prefix for either variable. Vercel environment values were not inspectable from this workspace.

Still unverified: real account signup/login, live assistant provider interaction, responsive browser screenshots at 320–1440px, PWA installation, offline operation, and applying the category Hindi-content migration to the intended production Supabase project.
