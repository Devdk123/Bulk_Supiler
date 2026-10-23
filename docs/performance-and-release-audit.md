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

The PWA install help was then made browser-specific for iOS Safari, Samsung Internet, Android Chrome/Edge, Android Firefox, desktop Chrome/Edge, and an unknown-browser fallback, with English and Hindi text. The expanded acceptance suite passes 18 checks; TypeScript and the production build pass. Lint has zero errors and the same two warnings above. During build prerender, the optional Supabase business-settings and product queries hit their existing 2.5-second and 3-second limits; generation completed with its documented fallback content. Real install prompts and offline behavior still need device/browser verification.

## Live HTTP recheck — 23 October 2026

GitHub reports Vercel deployment success for commit `ffc6cc5`. Using `curl.exe` from the workspace, all sampled public routes returned HTTP 200: `/` (1.29 s), `/products` (1.53 s), `/products/haldi-powder` (2.20 s), `/order` (1.41 s), `/login` (1.09 s), `/register` (1.39 s), `/account` (1.28 s), `/manifest.webmanifest` (1.65 s), and `/sw.js` (0.75 s). These are HTTP total times, not first paint or browser layout measurements.

The public `/api/catalogue?limit=24&offset=0` request returned all 19 products in 2.00 s. The sampled record remained quote-only with a null price and `stockStatus: unknown`; the category `name_hi` was null. A separate small-page request timed out once at 20 seconds but returned HTTP 200 in 1.86 s on immediate retry, indicating intermittent request latency. The direct route checks confirm deployment availability but do not verify authenticated account behavior, real browser responsiveness, assistant provider configuration, installability prompts, or offline behavior.

## Follow-up — shared client bundle and mobile viewport

The root auth provider now loads the Supabase browser client through a dynamic import. In a local production build, the chunk containing Supabase Auth client markers was 226,109 bytes before compression and was not referenced by the prerendered homepage HTML. The first page shell can hydrate without downloading and parsing that chunk; the auth provider loads it after hydration to restore the customer session. The auth session timeout remains five seconds, and profile data remains separate from the account shell.

The root layout explicitly exports the mobile viewport (`width=device-width`, `initial-scale=1`, and `viewport-fit=cover`) and app theme color. The built homepage HTML includes those values. Narrow-screen CSS constrains the homepage hero, floating assistant, and bottom quote dock.

Validation after these changes: the acceptance suite passed 20 checks, `npx tsc --noEmit` passed, and `npm run build` completed. Static bundle inspection confirmed the Supabase Auth chunk is absent from the homepage's initial HTML. These checks do not establish a browser paint improvement or verify a live Vercel deployment. Current outbound access from the workspace could not reach GitHub's API or the Vercel host, so deployment status and responsive device screenshots remain unverified. Build prerender still recorded an optional 3-second products-query timeout and used its fallback path.

The catalogue and product-detail Supabase reads now use `.abortSignal(AbortSignal.timeout(...))` at their existing 2.5–3.5 second limits. Catalogue facet reads, including the legacy-schema fallback query, are also aborted at 2.5 seconds. A production build completed with the products request reporting `TimeoutError: The operation was aborted` before taking the existing empty-catalogue fallback. The acceptance suite now checks these cancellation signals. This prevents a timed-out request from continuing to consume a connection after the caller has returned; the current public project still exhibits slow reads and needs upstream database latency investigation.

Local `next start` smoke sample after cancellation change: `/` and `/api/catalogue?limit=24&offset=0` both exceeded a 12-second client deadline; `/products/haldi-powder` returned HTTP 200 in 7.2 seconds. Server logs confirmed that the catalogue and detail data requests themselves were aborted at their 3.5-second and 3-second deadlines. Because the HTML requests were inconsistent under this workspace's slow local runtime, these numbers are diagnostic only and are not a release performance claim.

The account page now localizes profile-save outcomes (including Supabase failures), password validation/update feedback, and admin/sign-out actions in both supported languages. The acceptance suite covers those keys and rendered references; 22 checks pass. TypeScript passes. Targeted ESLint on the account page and acceptance script reports no errors or warnings; two unused catch bindings were removed. The full repository lint scan did not finish in a reasonable time, so it was stopped. This improves English/Hindi coverage for account feedback but does not establish complete localization of all admin screens or all backend-provided error detail.

The catalogue, its category filter options, product-card labels, and mobile quick-category chips now use the existing Hindi category titles for seven known category names if the database Hindi label is null. A supplied `name_hi` value takes priority; unknown category names retain their original display name. The acceptance suite verifies each mapping against Devanagari Hindi copy, as well as the unknown-category fallback. After this change 23 acceptance checks pass, TypeScript and targeted ESLint pass, and the production build completes. Build prerender still reaches the existing aborted product-query fallback; no live database migration was applied.

## Local production browser audit — 23 October 2026

Built with `npm run build` and opened with `next start` in headless Chrome. I captured and reviewed the homepage at 320×900, 390×900, 768×900, and 1440×900. The 320px and 390px views show the mobile menu, wrapped hero copy, full-width actions, floating assistant, and bottom enquiry dock without document-width overflow. At desktop width, the document had a one-pixel overflow at the scrollbar edge; `html { overflow-x: clip; }` removes the visible horizontal scrollbar. The production build passes after this CSS change.

The same browser registered an active service worker for `/`, controlled the page, and populated `gayatri-static-v3`; both `/offline.html` and the offline page's SVG logo were present in Cache Storage. With Chrome's network emulation set offline, navigating to `/products` rendered the cached “You’re offline” page, which correctly states no enquiry was submitted. This verifies the local production build's service-worker fallback in Chrome, not installation on a physical device or behavior on every browser. The screenshot files and temporary browser profile were removed after review.

With Hindi selected in browser storage, Chrome rendered the Hindi home hero, navigation controls, and mobile enquiry dock at 390×844; the root element reported `lang="hi"` and `data-language="hi"`. The mobile menu button opened. A real product-backed submission was not exercised in this visual check.

Targeted TypeScript and acceptance checks pass (24 acceptance checks). ESLint passes for the changed TypeScript component; ESLint does not process the CSS file. Build prerender still logs the optional 2.5-second business-settings timeout and aborts the public product query at its configured deadline, then completes with its fallback. The slow catalogue query remains an upstream performance issue to investigate. Live Vercel, real signup/login, installed-device behavior, and actual AI-provider responses remain unverified from this workspace.

## Follow-up — bilingual public copy

Removed unsupported homepage claims about a 50+ km service radius, verified suppliers/inventory, fresh godown lots, pack formats, fast-moving demand and retail margins. Reworded category and brand descriptions to describe catalogue listings and invite enquiries for current product details. The login and registration copy no longer promises downloadable quotations or dispatch updates that the account flow does not provide. The login Suspense fallback now uses the active language. The acceptance suite includes a regression check against those unsupported public claims; 25 checks pass, as do TypeScript, targeted ESLint and the production build. Build prerender still reaches the bounded Supabase settings and catalogue fallbacks described above.

The homepage brand cards now use the brand facets returned with the existing public catalogue response, and their links filter by the exact database brand name. This removes six static brand names that had no corresponding seed/source records, without adding another request. Added an acceptance regression check for the data source and filter links. After the change, all 26 acceptance checks pass, `npx tsc --noEmit`, targeted ESLint, and `npm run build` pass. Build prerender still reaches the bounded Supabase settings and catalogue fallbacks described above.

## Follow-up — bounded Auth requests

Configured the existing Supabase browser client with a custom fetch that aborts Auth HTTP requests after eight seconds while leaving Data API requests on their existing query-specific deadlines. The profile lookup now aborts at its four-second wait limit as well. Dynamic Auth client loading now has an eight-second deadline, so a stalled SDK chunk cannot keep the account route in its loading state indefinitely. Login and registration show localized timeout and network error messages in English and Hindi. The Supabase Auth health endpoint and read-only checks of the new commit status and production login/register routes could not be reached from this workspace, so live credentials, deployment, Auth availability, signup, and login remain unverified; the implementation cannot repair an unreachable or misconfigured deployed Supabase project by itself. The acceptance suite verifies cancellation and localization, TypeScript and targeted ESLint pass, and the production build completes with the existing prerender fallbacks.

The quote form now aborts a stalled enquiry POST after 15 seconds and displays a localized timeout state. It retains the same client request ID after a timeout, matching the enquiry RPC's unique idempotency key so a repeated submission resolves to the saved enquiry instead of creating a duplicate. All 27 acceptance checks, TypeScript, targeted ESLint, and the production build pass after this change. Build prerender still logs the configured 2.5-second business-settings and 3-second product-list fallbacks.

The product detail image strip is now an interactive gallery: selecting a thumbnail changes the main image, selected state is exposed with `aria-pressed`, keyboard focus is visible, and the group/action names use English and Hindi translations. All 28 acceptance checks, TypeScript, targeted ESLint, and the production build pass. The configured product query timed out during prerender, so this environment could not exercise the gallery against a live product record or verify actual uploaded image assets.
