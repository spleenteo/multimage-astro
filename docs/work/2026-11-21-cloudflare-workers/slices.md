---
shaping: true
---

# Cloudflare Workers + DatoCMS cache tags — Slices

Shape A (`shaping.md`): Astro route cache with `cacheCloudflare()`, DatoCMS native tags, a gateway entrypoint for the draft bypass, an invalidation endpoint. Every slice is verified on the deployed trial Worker `https://multimage-astro.matteo-59f.workers.dev` (account Multimage, `wrangler deploy` from the local checkout). No push, no DNS, no DatoCMS change.

Build and deploy: `npx dotenv -e <env file> -- npm run deploy:cf`, the env file holding the production values pulled from Vercel (never in the repo). The secrets already on the Worker stay; new ones go with `wrangler secret put` or `--secrets-file`.

## V1 — Cache in front of the Worker, editors bypass it

**In:**
- A1: `cache: { provider: cacheCloudflare() }` in `astro.config.mjs` only under `DEPLOY_TARGET=cloudflare`.
- A4: a custom Worker entry (`src/worker.ts` or similar, `main` in `wrangler.jsonc`): default entrypoint with caching off that forwards to a `Backend` entrypoint (caching on, wraps `handle` from `@astrojs/cloudflare/handler`); `cache: "no-store"` when the draft-mode cookie is present. `cache.enabled` and the per-entrypoint `exports` block in `wrangler.jsonc`; `CF_VERSION_METADATA` binding if the provider wants it.
- A3: the middleware sets the cache policy: public GET HTML 200 → `maxAge` 60 days and buffered body; internal paths, API, non-200, draft → `cache.set(false)` + `Cache-Control: private, no-store`.
- The Vercel build stays as it is (no provider, ISR).

**Out:** DatoCMS tags (V2); purge (V2). Pages carry only the provider's automatic path/version tags.

**Done:**
1. Two `curl -sI` on `/` and `/libri/<slug>` → `cf-cache-status: MISS` then `HIT`; on the HIT, `wrangler tail` shows no `Backend` render.
2. Same URL with the draft-mode cookie (activated through `/api/draft-mode/enable?token=…&url=/`) → drafts rendered, not a `HIT`; the next anonymous request is still the published copy.
3. `/staff`, `/api/draft-mode/disable`, a 404 → never `HIT` on the second request.
4. `npm run lint` green; the Vercel build (`astro build` without `DEPLOY_TARGET`) green and its output has no `Cache-Tag`/`Cloudflare-CDN-Cache-Control` logic active.

**Gotchas:**
- If `ctx.exports` or per-entrypoint `cache` does not work with the Astro build, stop and record what fails: this is the shape's only flagged part. Fallback to consider then: cache on, gateway via a second Worker with a service binding.
- Buffering must not touch the CSV export under `/staff` or API responses.
- The adapter turns `cache.enabled` on in the generated config when the provider is set: check the generated `dist/server/wrangler.json`, not only `wrangler.jsonc`.

## V2 — DatoCMS tags and the invalidation endpoint

**In:**
- A2-B: `executeQuery` uses `rawExecuteQuery` with `returnCacheTags` for published queries; tags go into the request's `cache` through an AsyncLocalStorage set in the middleware; draft queries call `cache.set(false)`. Same signature for the 28 callers. On Vercel (no provider) the tagging is a no-op.
- A5: `POST /api/invalidate-cache` (Bearer `CACHE_INVALIDATION_WEBHOOK_SECRET`, new optional server secret in the env schema), payload `entity.attributes.tags`, `cache.invalidate` in batches, 401/400/503/502 as the DatoCMS Astro reference says; then the existing Site Search reindex (shared with `/api/revalidate`, not duplicated).
- Measure the tag count on `/`, `/libri`, `/libri/pagina/2`, `/autori`, `/sitemap.xml`; handle a page over 1000 tags (coarse tag + shorter `maxAge`), with the numbers in the slice narrative.

**Out:** creating the DatoCMS webhook; removing `/api/revalidate` or the revalidation map.

**Done:**
1. `/` and a book page warm (`HIT`); a signed POST to `/api/invalidate-cache` with one tag the book page's query returned (read from the CDA with `X-Cache-Tags: true`) → that book page is `MISS` on the next request, an unrelated page (for example `/info/<slug>` that does not list it) stays `HIT`.
2. POST without or with a wrong bearer → 401; malformed body → 400; nothing purged.
3. The tag counts measured, and no page silently over the limit.
4. `npm run lint` and both builds green.

**Gotchas:**
- Tags must be collected from layout and nested-component queries too (`BaseLayout`'s site query runs on every page).
- `excludeInvalid`, `contentLink`, `environment` behaviour of `executeQuery` must not change.

## V3 — Switch runbook and docs

**In:**
- `docs/guidelines/caching.md` and `operations.md` describe both targets (Vercel today, Cloudflare on the branch); `docs/current-state.md`, `docs/list-helpers.md`, `docs/TODO.md`, the decisions (`docs/decisions-log/`), `docs/shapes/2026-03-05-cache-tags.md` and its index.
- A runbook for switch day: move the zone to the Multimage account, custom domain on the Worker, remove the two Vercel records, create the `cda_cache_tags` webhook with the bearer secret, set the Worker secrets, Free or Paid, what to remove from the Vercel path afterwards.
- End-to-end check on the trial Worker of what V1/V2 did not cover: draft mode enable/disable, `/api/seo-analysis` with `linkedom`, `/api/preview-links`.

**Out:** running the switch.

**Done:**
1. The runbook exists and each step names the command or the dashboard page.
2. `npm run docs:inventory` green (if it checks the new helper files).
3. Draft mode and `/api/seo-analysis` answer correctly on the trial Worker.
