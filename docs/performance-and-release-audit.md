# Performance and release audit — 22 October 2026

## Measured baseline

The supplied DevTools capture showed the Next.js RSC document request at 7.67 s and several category prefetch requests taking 347–577 ms. A separate live HTTP check of the deployed pages measured:

| Route | First request TTFB / total | Repeat request TTFB / total |
| --- | ---: | ---: |
| `/` | 1.659 s / 1.811 s | 1.220 s / 1.435 s |
| `/products` | 0.369 s / 0.429 s | 0.291 s / 0.355 s |
| `/login` | 0.948 s / 0.999 s | 0.401 s / 0.467 s |

These are server HTTP timings, not browser paint, Core Web Vitals, or Lighthouse scores. The product endpoint in the configured Supabase project returned zero product rows. The live site and that project could not be verified as the same deployment/database, so no production data was changed.

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
