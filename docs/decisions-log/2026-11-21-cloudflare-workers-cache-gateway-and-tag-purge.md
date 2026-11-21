---
kind: decision
status: active
superseded_by: null
work: cloudflare-workers
area: caching
touches: [src/worker.ts, src/middleware.ts, src/lib/datocms/executeQuery.ts, src/lib/datocms/cacheTags.ts, src/lib/datocms/cacheInvalidation.ts, src/pages/api/invalidate-cache/index.ts, astro.config.mjs, wrangler.jsonc]
description: "On Cloudflare, Workers Cache behind a cache-off gateway entrypoint, with DatoCMS cache tags purged by webhook; no Vary: Cookie, no site-wide purge."
---

# Cloudflare Workers is cached by Workers Cache behind a draft-aware gateway, purged by DatoCMS cache tags

**Date**: 2026-11-21

## The decision

On Cloudflare Workers the site is cached by Workers Cache, driven by Astro 7's route cache with the `cacheCloudflare()` provider of @astrojs/cloudflare (only under `DEPLOY_TARGET=cloudflare`). A custom Worker entry (`src/worker.ts`) has a cache-off default entrypoint (gateway) that forwards every request to a cache-on Backend entrypoint through `ctx.exports.Backend.fetch`: path-only `cf.cacheKey` outside `/api`, `cache: "no-store"` when the draft-mode cookie is present. Pages carry the native DatoCMS cache tags (`x-cache-tags`, collected per request through an AsyncLocalStorage store fed by `executeQuery`; one final `cache.set` in the middleware after buffering). `POST /api/invalidate-cache` (Bearer `CACHE_INVALIDATION_WEBHOOK_SECRET`, DatoCMS `cda_cache_tags` webhook) purges through the Backend's execution context (`locals.cfContext.cache.purge`), 100 tags per call, 5xx when success is false so DatoCMS retries; every purge also purges a coarse site tag, used with a 1-day maxAge for pages whose tags cannot be trusted.

## Context

Moving off Vercel ISR (Hobby CPU limits). Without a cache every Worker request renders (median 26 ms CPU, up to 100 ms on /autori, against the Free plan's 10 ms per request) and queries DatoCMS. Workers Cache is looked up before the Worker runs and ignores cookies, so editors with the draft cookie would be served the cached published copy unless something runs before the cache. Purges only reach the cache of the entrypoint that calls them.

## Alternatives discarded

- **Vary: Cookie on cached responses**: every distinct Cookie header (consent banner, analytics) becomes its own variant, the hit rate collapses.
- **No draft bypass**: editors would see the published copy of any cached page, and a stored draft render would leak the draft CDA token embedded by DraftModeQueryListener.
- **A separate gateway Worker with a service binding**: works, but a second Worker to deploy and keep in sync; the same-Worker entrypoint worked on the first deploy with Astro 7 / @astrojs/cloudflare 14.
- **Purge with context.cache.invalidate**: the adapter's provider ignores the purge result, so a rate-limited purge (Free burst 25, 5/min) would return 200 and DatoCMS would never retry.
- **Purge with cache.purge imported from cloudflare:workers**: breaks the Vercel bundle (unresolved module) and astro check (no Workers types).
- **One site-wide tag purged on every publish**: simpler, but about 670 pages re-render per publish and the precision DatoCMS gives for free is lost; kept only as the fallback tag.
- **Keep the hand-kept record-to-URL revalidation map (revalidationUrls.ts)**: code to keep in sync with every route; it stays only for Vercel until the switch.

## Consequences

Two billed requests per page view (gateway + Backend; cache hits use no CPU). Every deploy starts from an empty cache (the Worker version is in the key). The gateway duplicates the cookie-name rule of src/lib/draftMode.ts:9 (keep in sync). Purge rate limits are always the Free ones (5/min, burst 25, 100 tags per request): a bulk publish relies on DatoCMS retries. Static assets in public/ (robots.txt) bypass the middleware entirely. Measured tag counts: 27-515 per page, under the 1000 limit.

## Reopen when

Cloudflare lifts the Free purge limits for Workers Cache, @astrojs/cloudflare's provider starts returning purge failures, the adapter supports a draft bypass natively, or a page exceeds ~990 tags.

## References

- docs/work/2026-11-21-cloudflare-workers/shaping.md
- docs/work/2026-11-21-cloudflare-workers/slices.md (V1, V2 narratives)
- docs/shapes/2026-03-05-cache-tags.md
- docs/guidelines/cloudflare-switch.md (switch-day runbook)

## Status log

- 2026-11-21 — recorded
