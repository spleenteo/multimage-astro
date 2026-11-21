---
shaping: true
---

# Cloudflare Workers + DatoCMS cache tags — Slices

Shape A (`shaping.md`): Astro route cache with `cacheCloudflare()`, DatoCMS native tags, a gateway entrypoint for the draft bypass, an invalidation endpoint. Every slice is verified on the deployed trial Worker `https://multimage-astro.matteo-59f.workers.dev` (account Multimage, `wrangler deploy` from the local checkout). No push, no DNS, no DatoCMS change.

Build and deploy: `npx dotenv -e <env file> -- npm run deploy:cf`, the env file holding the production values pulled from Vercel (never in the repo; today `/private/tmp/claude-501/-Users-spleenteo-Sites-multimage-multimage-astro/0eccf176-0273-426a-a385-88feef210e71/scratchpad/cf.env`). The secrets already on the Worker stay; new ones go with `wrangler secret put` or `--secrets-file`.

## Cross-slice rules (from impact)

- **Cloudflare only.** Every new behaviour (tag collection, the middleware cache policy, buffering, the invalidation endpoint's purge) runs only when `context.cache.enabled` is true. On Vercel there is no provider: `cache.enabled` is false, and the middleware and `executeQuery` behave exactly as today. Never call `cache.set`/`cache.invalidate` when it is false (`DisabledAstroCache` warns on `set` and throws on `invalidate`).
- **One final cache decision, in the middleware.** `AstroCache.set()` re-enables caching after `set(false)` and the provider always emits `public` even without `maxAge` (Cloudflare then caches a 200 for 2h by default). So nothing but the middleware calls `cache.set`: queries only push tags into the request's AsyncLocalStorage store; after `next()` and buffering, the middleware calls once either `cache.set(false)` (+ `Cache-Control: private, no-store`) or `cache.set({ maxAge, tags })`.
- **Route → policy table** (the middleware's single source of truth; anything not listed is `set(false)`):

  | Route | Policy |
  |---|---|
  | public GET page, `text/html`, status 200, no draft | cached, `maxAge` 60 days, tags (V2) |
  | `/sitemap.xml`, `/archived-books.json` (GET 200, no draft) | cached, `maxAge` 60 days, tags (V2) — they run CDA queries, so a purge keeps them fresh |
  | `/robots.txt`, `/llms*.txt` and other endpoints with no CDA query | `set(false)` |
  | internal paths (`/staff`, `/libri/schede`), `/api/*`, non-GET, non-200, any draft request (any content type) | `set(false)` + `Cache-Control: private, no-store` |

- **Draft cookie name** in the gateway: `env.DRAFT_MODE_COOKIE_NAME?.trim() || 'multimage_draft_mode'`, the same rule as `src/lib/draftMode.ts:9`. Draft HTML carries the draft CDA token (`DraftModeQueryListener`): a stored draft render would leak it, so the bypass is double (gateway `no-store` + middleware `set(false)`).
- **Purges run in `Backend`**: purges only reach the cache of the entrypoint that calls them, so the gateway forwards every request (POST included) to `Backend`.

## V1 — Cache in front of the Worker, editors bypass it

**In:**
- A1: `cache: { provider: cacheCloudflare() }` in `astro.config.mjs` only under `DEPLOY_TARGET=cloudflare`.
- A4: a custom Worker entry (for example `src/worker.ts`, `main` in `wrangler.jsonc`): default entrypoint with caching off, forwarding every request to a `Backend` entrypoint (caching on, wraps `handle` from `@astrojs/cloudflare/handler`) with `ctx.exports.Backend.fetch(request, …)`; `cache: "no-store"` when the draft-mode cookie is present (name rule above); for paths outside `/api`, `cf.cacheKey` = path only, so `?utm_*`, `?fbclid` and other query strings share one entry (no page reads `searchParams`; verify with grep before relying on it). `cache.enabled` and the per-entrypoint `exports` block in `wrangler.jsonc`, checked in the generated `dist/server/wrangler.json` too. No `CF_VERSION_METADATA` (the version is already in the cache key).
- Types: `src/worker.ts` uses `cloudflare:workers`, `ExportedHandler`, `ExecutionContext`, `Env`; `npm run build` runs `astro check` over every `.ts`, so the worker file must type-check on the Vercel build too (generated `wrangler types` file, `@cloudflare/workers-types` dev dependency with a note in `docs/guidelines/dependencies.md`, or exclude the file from the check — the planner picks and says why).
- A3: the middleware applies the route → policy table above (with `maxAge` but no DatoCMS tags yet), buffering the body only for the cached rows. Gated on `context.cache.enabled`.
- The Vercel build stays as it is (no provider, ISR, same middleware output).

**Out:** DatoCMS tags and purge (V2). Between V1 and V2 the trial Worker serves 60-day copies with no purge; a deploy clears them (the version is in the key). Accepted, it is the trial Worker.

**Done:**
1. Two `curl -sI` on `/` and `/libri/<slug>` → `cf-cache-status: MISS` then `HIT`; on the HIT, `wrangler tail` shows only the gateway invocation, no `Backend` one.
2. `/?utm_source=x` after a warm `/` → `HIT`.
3. Same URL with the draft-mode cookie (activated through `/api/draft-mode/enable?token=…&url=/`) → drafts rendered, not a `HIT`; the next anonymous request is still the published copy.
4. `/staff` (anonymous 404), `/api/draft-mode/disable`, `/libri/pagina/999` (a real 404), `/robots.txt` → never `HIT` on the second request.
5. `npm run lint` green; `npm run build` (Vercel, runs `astro check`) green and its middleware adds no header it did not add before; `npm run build:cf` green.

**Gotchas:**
- If `ctx.exports` or per-entrypoint `cache` does not work with the Astro build, stop and record what fails: this is the shape's only flagged part. Fallback to consider then: a second Worker as gateway with a service binding.
- An unknown slug on the `[slug]` pages throws and returns 500 (not 404): use `/libri/pagina/999` for the 404 check.
- The host is not part of the cache key: output must stay host-independent (it builds URLs from `PUBLIC_SITE_URL`). Any `noindex` for `workers.dev` would go in the gateway only, never in `Backend`; none is added in this work.

### V1 — done on 2026-11-21

V1 put Workers Cache in front of the trial Worker. A custom entry `src/worker.ts` runs a cache-off default gateway that forwards every request to a cache-on `Backend` entrypoint through `ctx.exports.Backend.fetch`: path-only `cf.cacheKey` outside `/api`, `cache: 'no-store'` when the draft cookie is present. The middleware applies the route → policy table behind `context.cache.enabled` (60-day `maxAge`, body buffered only on cached rows, `private, no-store` elsewhere), and `cacheCloudflare()` is wired only under `DEPLOY_TARGET=cloudflare`. The flagged part held: `ctx.exports` and per-entrypoint cache worked on the first deploy, with no `enable_ctx_exports` flag and no fallback Worker. On the trial Worker, `/` and a book page went MISS then HIT, HITs never reached `Backend` (confirmed by wrangler tail), `?utm_source` shared the entry, the draft request was DYNAMIC and private while the anonymous copy stayed a HIT, and `/staff`, `/api/draft-mode/disable` and `/libri/pagina/999` were BYPASS every time. The T2 review caught a Vercel regression: reading the draft flag once, before `next()`, flipped the CSP on the draft-mode endpoints, because Astro's cookies return the values set during the request. It is now read again after `next()`. `/robots.txt` is a static asset served by Workers Assets and was a HIT both times, outside the middleware's reach, as the plan expected. The lint gate went red on the git-ignored `.wrangler/deploy/config.json`; `.wrangler/` is now prettier-ignored. Rulings: the packet went to the agents as a file path, not pasted inline.

## V2 — DatoCMS tags and the invalidation endpoint

**In:**
- A2-B: `executeQuery` uses `rawExecuteQuery` with `returnCacheTags` for published queries (only when the request store exists, i.e. Cloudflare) and pushes the `x-cache-tags` tags into the AsyncLocalStorage store the middleware opens around `next()` and the buffering; draft queries mark the store `disabled`. It never calls `cache.set`. Same signature for the 28 callers; `excludeInvalid`, `contentLink`, `environment` unchanged. On Vercel (no store) nothing changes.
- The middleware's final call passes the collected tags. Over ~990 tags (Cloudflare keeps the first 1000 and the provider appends its path tag last), replace them with a coarse `site` tag plus a shorter `maxAge` (the planner proposes the value), and log it.
- A log line per cached page `{path, tagCount, hasLayoutTags}` (readable with `wrangler tail`; `Cache-Tag` is stripped before the client, so curl cannot see it).
- A5: `POST /api/invalidate-cache` (Bearer `CACHE_INVALIDATION_WEBHOOK_SECRET`, new optional server secret in the env schema, documented in `docs/guidelines/security.md`'s env matrix). Payload `entity.attributes.tags`, plus the coarse `site` tag when any record changes. Purge with `cache.purge({ tags })` from `cloudflare:workers` directly (not `context.cache.invalidate`, whose provider ignores the result), in batches of at most 100 tags, checking `result.success`: false → 5xx so DatoCMS retries (Free purge limits: 5 requests/minute, burst 25, 100 tags per request). 401 on a missing or wrong bearer, 400 on a malformed body, 503 when `cache.enabled` is false.
- Site Search reindex: move `reindexSiteSearch` from `src/pages/api/revalidate/index.ts` to `src/lib/` and call it from both endpoints; `docs/list-helpers.md` updated in this slice for every new `src/lib` file (`npm run docs:inventory` stays green).
- Before the V2 tests, remove `SITE_SEARCH_BUILD_TRIGGER_ID` and `DATOCMS_CMA_TOKEN` from the trial Worker (they are not there today: check, and keep them out), so a test POST never re-spiders the production index.

**Out:** creating the DatoCMS webhook; removing `/api/revalidate` or the revalidation map.

**Done:**
1. `/` and a book page warm (`HIT`); a signed POST to `/api/invalidate-cache` with one tag the book page's query returned (read from the CDA with `X-Cache-Tags: true`) → that book page is `MISS` on the next request, an unrelated page that does not depend on it stays `HIT`.
2. POST without or with a wrong bearer → 401; malformed body → 400; nothing purged.
3. A purge failure (forced, for example by sending more than the burst in a loop, or by a stubbed `success: false` in a unit check) → 5xx.
4. `wrangler tail` shows the tag counts of `/`, `/libri`, `/libri/pagina/2`, `/autori`, `/sitemap.xml`, `/archived-books.json`, each with `hasLayoutTags: true`; no page silently over the limit. The numbers go in the slice narrative.
5. `npm run lint`, `npm run build`, `npm run build:cf`, `npm run docs:inventory` green.

**Gotchas:**
- `BaseLayout`'s site query runs while the page streams: the store must survive it (the `hasLayoutTags` check proves it).

## V3 — Switch runbook and docs

**In:**
- `docs/guidelines/caching.md`, `operations.md`, `preview-mode.md` (`__prerender_bypass` and the CDN flow are Vercel-only), `cms-data-loading.md` ("cache tags not implemented"), `security.md` (new secret): both targets described, Vercel today, Cloudflare on the branch. `docs/current-state.md`, `docs/TODO.md`, the decisions (`docs/decisions-log/`), `docs/shapes/2026-03-05-cache-tags.md` and its index.
- A runbook for switch day: move the zone to the Multimage account, custom domain on the Worker, remove the two Vercel records, create the `cda_cache_tags` webhook with the bearer secret, set the Worker secrets (`SITE_SEARCH_BUILD_TRIGGER_ID`, `DATOCMS_CMA_TOKEN` back on), Free or Paid, what to remove from the Vercel path afterwards.
- End-to-end check on the trial Worker of what V1/V2 did not cover: draft mode enable/disable, `/api/seo-analysis` with `linkedom` (it fetches its own host: Cloudflare may refuse a Worker fetching its own hostname; test it, and any internal call to `Backend` passes `cache: "no-store"`), `/api/preview-links`.

**Out:** running the switch.

**Done:**
1. The runbook exists and each step names the command or the dashboard page.
2. `npm run docs:inventory` green.
3. Draft mode and `/api/seo-analysis` answer correctly on the trial Worker, or the gap is written in the runbook with its fix.

## Deviations found while planning

### Deviations found while planning V1

- `/robots.txt` is `public/robots.txt`, a static asset served before the Worker code, and no `/llms*.txt` route exists: the "endpoints with no CDA query" row has no route today. It stays in the middleware for future endpoints; V1 Done 4 on `/robots.txt` is an observation, not a stop.
