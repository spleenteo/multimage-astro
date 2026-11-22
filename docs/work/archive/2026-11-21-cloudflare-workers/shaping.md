---
shaping: true
---

# Cloudflare Workers + DatoCMS cache tags — Shaping

Technical work: the visitors see the same site; what changes is where it runs and how it is cached. The facts below were checked on 2026-11-20/21 against the installed packages (`astro` 7.4.7, `@astrojs/cloudflare` 14.4.9, `@datocms/cda-client` 0.3.2, `wrangler` 4.147) and the Cloudflare docs (Workers Cache, purge, cache keys, limitations).

## Context

- The trial Worker `multimage-astro` (account **Multimage**, `https://multimage-astro.matteo-59f.workers.dev`) renders every request: median 26 ms CPU, `/autori` up to 100 ms. The Free plan allows 10 ms per request.
- Vercel today: ISR + `/api/revalidate`, which maps a changed record to URLs by hand (`revalidationUrls.ts`) and refetches them with the bypass token.
- The zone `multimage.org` lives in the personal Cloudflare account; `www` still points to Vercel. The domain move and the DNS switch are out of this work.

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| R0 | On Cloudflare, public pages are served from a cache in front of the Worker; the Worker renders only on a miss | Core goal |
| R1 | A publish on DatoCMS makes the affected pages fresh within seconds, without a hand-kept record → URL map | Must-have |
| R2 | An editor holding the draft-mode cookie always gets an uncached render with drafts, on the same URLs, Visual Editing included | Must-have |
| R3 | Internal routes (`/staff`, `/libri/schede`) and API routes are never stored in the cache | Must-have |
| R4 | Fits the Workers Free plan: cache hits use no CPU, requests stay well under 100k/day, purges under the Free purge rate limits | Must-have |
| R5 | A failed purge is an error DatoCMS retries; the Site Search reindex on publish is kept | Must-have |
| R6 | Nothing changes for production: no DNS change, no push, the Vercel build and its ISR keep working on this branch | Must-have |
| R7 | Everything is verifiable on `workers.dev`, before the domain switch | Must-have |

## Facts that constrain the shapes

- **Workers Cache** (`cache.enabled` in `wrangler.jsonc`) is the Worker's own cache: zoneless, works on `workers.dev`, purge by tag available on every plan (Free purge rate limits always apply). Cache hits are billed as requests but use no CPU; with the cache on, static asset requests become billed requests too.
- **The lookup happens before the Worker runs** and the cache key is path + query (+ Worker version, + entrypoint, + `ctx.props`). `Cookie` is not in the key. So a cached URL is served to an editor too, unless the request reaches a part of the Worker that runs before the cache.
- Responses with `Set-Cookie` are never stored. `Cache-Tag` is stripped before the client; max 1000 tags per response, tags of at most 1024 printable ASCII chars; invalid tags are dropped silently.
- **Astro 7 route cache**: `cache: { provider }` in the config, `Astro.cache.set({ maxAge, swr, tags })` (tags accumulate across calls in one request), `cache.set(false)` opts out, `context.cache.invalidate({ tags })`. `@astrojs/cloudflare/cache` exports `cacheCloudflare()`: it writes `Cloudflare-CDN-Cache-Control` + `Cache-Tag` (adds a path tag and, with `CF_VERSION_METADATA`, a version tag) and purges with `cache.purge({ tags })` from `cloudflare:workers`. With this provider the adapter turns `cache.enabled` on in the generated wrangler config.
- **DatoCMS**: `rawExecuteQuery` with `returnCacheTags: true` returns the query's tags in the `x-cache-tags` response header (space separated). The `cda_cache_tags` / `invalidate` webhook posts `entity.attributes.tags`.
- Astro streams HTML: a nested component's query can add tags after the headers are sent, so the middleware must buffer cache-tagged HTML responses.
- `@astrojs/cloudflare/handler` exports `handle(request, env, ctx)`, so a custom Worker entry can wrap it.

## A: Astro route cache + native DatoCMS tags + gateway entrypoint

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **Cache provider.** `cache: { provider: cacheCloudflare() }` only when `DEPLOY_TARGET=cloudflare`; the Vercel build keeps ISR and no provider | |
| **A2** | **Tag collection.** `executeQuery` calls `rawExecuteQuery` with `returnCacheTags` on published queries and adds the tags to the current request's `cache`; draft queries call `cache.set(false)`. The request's `cache` reaches `executeQuery` without changing its 28 call sites (see A2 alternatives) | |
| **A3** | **Cache policy in the middleware.** Public GET HTML responses with status 200 get `maxAge` (60 days, the current safety net) and are buffered so late tags land; internal paths, API routes, non-200 and draft requests get `cache.set(false)` + `Cache-Control: private, no-store` | |
| **A4** | **Draft bypass before the cache.** A custom Worker entry: the default entrypoint has caching off and only reads whether the draft-mode cookie is present; it forwards to a `Backend` entrypoint (caching on, wraps `handle`) with `ctx.exports.Backend.fetch(request)`, or with `cache: "no-store"` when the cookie is present | ⚠️ |
| **A5** | **Invalidation endpoint.** `POST /api/invalidate-cache` with `Authorization: Bearer <CACHE_INVALIDATION_WEBHOOK_SECRET>`, reads `entity.attributes.tags`, calls `cache.invalidate({ tags })` in batches, returns 5xx on failure so DatoCMS retries; then the Site Search reindex | |

**A2 alternatives** (how `executeQuery` reaches the request's `cache`):

| Req | Requirement | Status | A2-A pass `Astro` to every call | A2-B AsyncLocalStorage set in the middleware |
|-----|-------------|--------|---|---|
| R0 | On Cloudflare, public pages are served from a cache in front of the Worker; the Worker renders only on a miss | Core goal | ✅ | ✅ |
| R1 | A publish on DatoCMS makes the affected pages fresh within seconds, without a hand-kept record → URL map | Must-have | ✅ | ✅ |
| R6 | Nothing changes for production: no DNS change, no push, the Vercel build and its ISR keep working on this branch | Must-have | ✅ | ✅ |

Both pass; **A2-B is picked** because A2-A touches 24 files and every future query must remember to pass the context (a missed one serves a page with an incomplete tag set, which goes stale silently). `node:async_hooks` runs on workerd with `nodejs_compat`.

**A4 alternatives** (draft bypass):

| Req | Requirement | Status | A4-A gateway entrypoint | A4-B `Vary: Cookie` | A4-C no bypass |
|-----|-------------|--------|---|---|---|
| R0 | On Cloudflare, public pages are served from a cache in front of the Worker; the Worker renders only on a miss | Core goal | ✅ | ❌ | ✅ |
| R2 | An editor holding the draft-mode cookie always gets an uncached render with drafts, on the same URLs, Visual Editing included | Must-have | ✅ | ✅ | ❌ |
| R4 | Fits the Workers Free plan: cache hits use no CPU, requests stay well under 100k/day, purges under the Free purge rate limits | Must-have | ✅ | ❌ | ✅ |

- A4-B fails R0/R4: every distinct `Cookie` header (consent banner, analytics) becomes its own variant, so the hit rate collapses.
- A4-C fails R2: editors would see the published copy of any cached page.
- A4-A costs one extra (cheap, cache-off) invocation per request: two billed requests per page view, still far under the Free limit (about 5k page views/day today).

## B: Hand-rolled headers and purge, no Astro cache API

`Cache-Tag` and `Cloudflare-CDN-Cache-Control` written by our middleware from a request-scoped collector (the DatoCMS reference's `cache-tag-adapters.md` path), purge with `ctx.cache.purge`. Same draft bypass as A4.

## C: One site-wide tag, purge everything on any publish

No tag collection: every cached page carries one `site` tag; the webhook (any record) purges it.

## Fit check

| Req | Requirement | Status | A | B | C |
|-----|-------------|--------|---|---|---|
| R0 | On Cloudflare, public pages are served from a cache in front of the Worker; the Worker renders only on a miss | Core goal | ✅ | ✅ | ✅ |
| R1 | A publish on DatoCMS makes the affected pages fresh within seconds, without a hand-kept record → URL map | Must-have | ✅ | ✅ | ✅ |
| R2 | An editor holding the draft-mode cookie always gets an uncached render with drafts, on the same URLs, Visual Editing included | Must-have | ❌ | ❌ | ❌ |
| R3 | Internal routes (`/staff`, `/libri/schede`) and API routes are never stored in the cache | Must-have | ✅ | ✅ | ✅ |
| R4 | Fits the Workers Free plan: cache hits use no CPU, requests stay well under 100k/day, purges under the Free purge rate limits | Must-have | ✅ | ✅ | ✅ |
| R5 | A failed purge is an error DatoCMS retries; the Site Search reindex on publish is kept | Must-have | ✅ | ✅ | ✅ |
| R6 | Nothing changes for production: no DNS change, no push, the Vercel build and its ISR keep working on this branch | Must-have | ✅ | ✅ | ✅ |
| R7 | Everything is verifiable on `workers.dev`, before the domain switch | Must-have | ✅ | ✅ | ✅ |

**Notes:**
- All three fail R2 for now: A4 (the gateway) is flagged ⚠️ — `ctx.exports`, per-entrypoint `cache.enabled` and wrapping Astro's `handle` in a `WorkerEntrypoint` are documented but not yet run here. V1 resolves it on the deployed Worker.
- C passes R1 by purging everything: about 670 pages re-render on each publish (~20 s of CPU in total), fine for the plan, but it throws away the precision DatoCMS gives for free. It stays the **fallback** if tag sets turn out unreliable (see rabbit holes).
- B works but rebuilds what A1 and A5 get from Astro and the adapter.

## Selected: A = A1 + A2-B + A3 + A4-A + A5

Pending the V1 proof of A4-A.

## Rabbit holes

- **Tag count per response.** `/libri` lists ~340 books and `/sitemap.xml` every record: their tag sets may exceed 1000 tags, and extra tags are dropped silently (the page would then not be purged for some records). Measure on the heaviest pages; when over the limit, the page falls back to a shorter `maxAge` plus a coarse tag, and the decision is recorded.
- **Streaming.** Buffering only applies to public GET HTML; API routes, the CSV export and assets are untouched.
- **Deploys reset the cache** (the Worker version is part of the key). Accepted: a deploy is also when templates change. `cross_version_cache` stays off.
- **The cookie name** is `DRAFT_MODE_COOKIE_NAME` (default `multimage_draft_mode`); the gateway only checks presence. A forged cookie gets an uncached render (CPU, no data: the JWT is still verified by the page). Accepted.

## No-gos

- No DNS change, no domain move between accounts, no custom domain on the Worker.
- No DatoCMS webhook created or edited (the webhook is configured on switch day; here it is simulated with a signed POST).
- No removal of the Vercel adapter, ISR, `BYPASS_TOKEN` or `/api/revalidate`: they keep serving production until the switch.
- No push, no Vercel deploy.
