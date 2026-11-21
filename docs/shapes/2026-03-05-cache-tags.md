# Shape: Cache Tags & Selective Revalidation

**Status**: in-progress
**Date**: 2026-03-05 (rewritten 2026-11-21 for Cloudflare Workers)
**Appetite**: medium (3 slices)
**Work**: `docs/work/2026-11-21-cloudflare-workers/` (shaping in `shaping.md`, slices in `slices.md`), branch `chore/cloudflare`

## Problem

The site is moving from Vercel to Cloudflare Workers. Vercel's ISR kept pages cached and `/api/revalidate` refreshed them through a hand-kept record → URL map (`src/lib/datocms/revalidationUrls.ts`). Workers have no ISR: without a cache every request renders (median 26 ms CPU, up to 100 ms on `/autori`, against the 10 ms per request of the Free plan) and every request queries DatoCMS. The URL map is also code to keep in sync with every new route.

## Solution sketch

- **Workers Cache** in front of the Worker, driven by Astro 7's route cache with the adapter's `cacheCloudflare()` provider (only under `DEPLOY_TARGET=cloudflare`; Vercel keeps ISR until the switch).
- **Native DatoCMS cache tags**: `executeQuery` asks the CDA for the query's tags (`returnCacheTags`) and adds them to the request's cache through an AsyncLocalStorage set in the middleware, so no call site changes.
- **Middleware cache policy**: public GET HTML 200 cached for 60 days (safety net) and buffered so late tags land; internal routes, API, errors and drafts never cached.
- **Draft bypass before the cache**: the Workers Cache is looked up before the Worker and ignores cookies, so a gateway entrypoint (cache off) forwards to a cached `Backend` entrypoint, with `cache: "no-store"` when the draft-mode cookie is present.
- **`POST /api/invalidate-cache`**: the DatoCMS `cda_cache_tags` webhook (Bearer secret) purges the tags; failures return 5xx so DatoCMS retries; the Site Search reindex follows.
- Fallback if tag sets prove unreliable: one site-wide tag purged on every publish.

## Rabbit holes

- Tag count: at most 1000 tags per response, extra ones dropped silently. `/libri` and `/sitemap.xml` must be measured.
- Every deploy starts from an empty cache (the Worker version is in the key). Accepted.
- Purge rate limits are always the Free tier ones for Workers Cache.

## No-gos

- No DNS change, no domain move, no custom domain in this shape (switch-day runbook in V3).
- No DatoCMS webhook created here; no removal of the Vercel path before the switch.

## Slices

- [x] V1: Cache in front of the Worker, editors bypass it
- [ ] V2: DatoCMS tags and the invalidation endpoint
- [ ] V3: Switch runbook and docs
