---
description: How page caching and revalidation work on both targets (Vercel ISR with a URL-based webhook in production, Cloudflare Workers Cache with DatoCMS cache tags on the branch), what each route depends on, and the known gaps
---

# Caching and revalidation

Audited 2026-11-04 (work `upgrade-2026-11`, slice V1), updated 2026-11-05 for slice V2 (revalidation map fixes), and 2026-11-21 (V3) with the Cloudflare section. This file describes the caching as it is, not as it should be.

## Status

**Two targets, one codebase.** The target is chosen at build time (`DEPLOY_TARGET=cloudflare` selects `@astrojs/cloudflare`, otherwise `@astrojs/vercel`).

- **Vercel (production today)**: ISR, URL-based revalidation. A DatoCMS webhook calls `/api/revalidate`, which maps the changed record to a list of public URLs and refetches each one with the Vercel bypass header so the ISR copy is regenerated. Cache tags are not used. `## Configuration (Vercel)`, `## DatoCMS side`, the route table, the Gaps and the Verification procedure describe this path.
- **Cloudflare (branch `chore/cloudflare`, trial Worker, not yet switched)**: Workers Cache with DatoCMS cache tags, purged by `POST /api/invalidate-cache`. See `## Cloudflare Workers (branch chore/cloudflare)` below. On Vercel there is no cache provider (`context.cache.enabled` is false), so none of that code runs there.

The switch procedure is `docs/guidelines/cloudflare-switch.md`. Cache tags are the shape `docs/shapes/2026-03-05-cache-tags.md`.

## Configuration (Vercel)

- **ISR** (`astro.config.mjs`, `@astrojs/vercel`): `output: 'server'`, nothing is prerendered; every page is an ISR function.
  - `bypassToken: process.env.BYPASS_TOKEN` is read at **build time** from the process environment, so `BYPASS_TOKEN` must be exported when building locally (the build output differs without it).
  - `expiration: 5184000` (60 days) is only a safety net for a missed webhook. Short TTLs re-render about 670 URLs and burn Fast Origin Transfer on the Hobby plan (decision `2026-06-20-fot-reduction`).
  - `exclude: [/^\/api\//]`: API routes are never cached.
  - Since `@astrojs/vercel` 11, `allowQuery` is `x_astro_path` plus `x_astro_path_token`, and the ISR routes rewrite to `/_isr?x_astro_path=$1&x_astro_path_token=<per-build token>` (the token is a `crypto.randomUUID()` per build, never stored; the option names in `astro.config.mjs` are unchanged).
- **Dual cookies** (`src/lib/draftMode.ts`): entering draft mode sets two cookies for 30 days, `multimage_draft_mode` (name overridable with `DRAFT_MODE_COOKIE_NAME`; signed JWT, app-level: unlocks drafts, `/staff`, editor affordances) and `__prerender_bypass` (value `BYPASS_TOKEN`, infra-level: the Vercel CDN skips the ISR copy and renders fresh). `__prerender_bypass` is only set when `BYPASS_TOKEN` exists. Both are `SameSite=None; Secure; Partitioned`.
- **`POST /api/revalidate?token=<SECRET_API_TOKEN>`** (`src/pages/api/revalidate/index.ts`, helpers in `src/lib/datocms/`):
  - **Surgical mode** (default): `parseWebhookPayload` extracts `event_type`, the record `id` (used by `license`), the record `slug` and the model `api_key` (looked up through `entity.relationships.item_type` in `related_entities`); `getRevalidationUrls` maps `api_key` + `slug` to URLs. No `api_key`, or a model not in the map, is a 200 no-op (`noop: true`), so DatoCMS sees success.
  - **Book enrichment**: a `book` change runs one published-token query (`BookRevalidationContext`) to add the catalogue pages (`/libri`, `/libri/pagina/N`), the book's authors and its collection. On failure it falls back to `/libri` only. On unpublish/delete the book no longer resolves, so authors and collection are skipped.
  - **`?mode=full`**: revalidates every public URL (`getAllPublicUrls`, about 670). Manual maintenance only; **never run it against production by hand**.
  - Each URL is fetched with `x-prerender-revalidate: <BYPASS_TOKEN>` against `PUBLIC_SITE_URL`, in chunks of 20 with a 250 ms pause. Locally `PUBLIC_SITE_URL` is the production site.
  - **Site Search reindex**: after every non-no-op call, `reindexSiteSearch` triggers the build trigger `SITE_SEARCH_BUILD_TRIGGER_ID` through the CMA (needs `DATOCMS_CMA_TOKEN`; best-effort, errors swallowed). Locally it hits the production search index unless the trigger id is emptied.
  - **The `success` count lies**: `index.ts:55` counts every settled fetch as success, including 401 and 404 responses; only a rejected fetch is a failure. Judge by `x-vercel-cache` and `age` headers on the affected URLs, never by the JSON counts.
- `/archived-books.json` sets its own `Cache-Control: public, max-age=3600, immutable` (`src/pages/archived-books.json.ts:27`), independent of ISR.
- `recordToWebsiteRoute` in `recordInfo.ts` is the sibling map used by the Web Previews / SEO plugins; `revalidationUrls.ts` says to keep the two in sync. Since V2 both read the index paths from one export, `INDEX_PAGE_PATHS` (slug → path, `recordInfo.ts`, no imports), and the 7 phantom api_keys are gone from both. `recordInfo.ts` maps `index_page` by slug and `supplier` → `/distributori`; it maps no route for `license` or `app` (no page of their own).
- `getRevalidationUrls(input, query?)` takes an injectable `query`; the default is a lazy import of `executeQuery`, so the map loads under plain `tsx` (the endpoint passes none and behaves as before).

## DatoCMS side

Read-only, through the `datocms` CLI (`cma:call webhooks find 33942`, `schema:inspect`).

**Webhook 33942**, "Revalidate site cache (ISR)": enabled; payload API version 3; `auto_retry` true; `nested_items_in_payload` false; no custom payload, no filter; one event rule, `entity_type: item`, `event_types: publish, unpublish, delete`; URL `https://www.multimage.org/api/revalidate?token=<redacted>`. There are **no upload (asset) events** and no `update` event: saving a draft does nothing, an asset replaced in place does not revalidate anything.

**Models** (`schema:inspect`, 36 total). Mapped in `getRevalidationUrls`: `book`, `author`, `collection`, `blog_post`, `page`, `home`, `index_page`, `supplier`, `license`, and `app` as a deliberate no-op. `index_page` is the real model behind every index page (one record per page, read by `slug`: `libri`, `archivio`, `highlights`, `ebooks`, `collane`, `autori`, `magazine`, `distributori`); the `libri` slug also adds `/libri/pagina/N` through a count query (on failure it falls back to `/libri`), and an unknown slug is a no-op. `supplier` revalidates `/distributori`. `license` has no slug: the payload's record id finds the books that link it (`allBooks(filter: { license: … })`), and only those books' `/libri/<slug>` pages are revalidated. `app` returns no URL on purpose: its only reader, `/libri/schede/[slug]`, is staff-gated, so a revalidation fetch would only re-cache the anonymous 404. The 7 api_keys V1 found mapped but absent from the project (`books_index`, `archive_index`, …) were removed in V2.

| api_key           | Kind      | Read by                                                                                              | Mapped                               |
| ----------------- | --------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `home`            | singleton | `/`                                                                                                  | yes                                  |
| `book`            | record    | book pages, catalogue, home blocks, author/collection, sitemap, staff pages                          | yes                                  |
| `author`          | record    | author pages, book cards, structured-text links, book detail and staff pages                         | yes                                  |
| `collection`      | record    | collection pages, book detail, home featured book, staff pages                                       | yes                                  |
| `page`            | record    | `/info/[slug]`, header/footer menu on every page                                                     | yes                                  |
| `blog_post`       | record    | `/magazine`, `/magazine/[slug]`, book detail (`reviews`)                                             | yes                                  |
| `index_page`      | record    | every index page (by slug)                                                                           | yes                                  |
| `supplier`        | record    | `/distributori`                                                                                      | yes                                  |
| `license`         | record    | `/libri/[slug]` and `/libri/schede/[slug]` (rendered); the card fragments fetch it, no card shows it | yes (its books' pages, by record id) |
| `app`             | singleton | `/libri/schede/[slug]` (`pdfFooter`)                                                                 | no-op by design (staff-only reader)  |
| `cover_size`      | record    | `/libri/[slug]`, `/libri/schede/[slug]`, `/staff/archivio-catalogo` (`dimension`)                    | no                                   |
| `blog_category`   | record    | `/magazine`, `/magazine/[slug]`                                                                      | no                                   |
| `blog_author`     | record    | `/magazine`, `/magazine/[slug]` (post `author`), `/libri/[slug]` (review `author`)                   | no                                   |
| `keyword`         | record    | `/staff/archivio-catalogo` (`book.keywords`)                                                         | no                                   |
| `blog_tag`        | record    | no route query                                                                                       | no                                   |
| `blog_post_old`   | record    | no route query (legacy)                                                                              | no                                   |
| `project_comment` | record    | no route query (editor comments)                                                                     | no                                   |

Block models (`modular_block: true`, 19 of them: `reprint`, `image_block`, `video`, `banner`, `question`, `single_book`, `book_carousel`, `pills_block`, `menu_item`, `newsletter_subscription`, `menu_dropdown`, `single_info_block`, `button`, `faq_section`, `footer_menu_block`, `social_link`, `single_author`, `menu_external_item`, `cta_button_with_image`) have no webhook events of their own: they live inside a parent record, and publishing the parent fires the event for the parent's model. They are excluded from the route audit below.

## Route → models → revalidated?

Layout dependency for every HTML route: `BaseLayout.astro` `SITE_QUERY` reads `_site` (favicon tags) and `allPages` filtered by `menu` / `menuFooter` (header and footer menus). Only the `page` model feeds it, and a `page` publish revalidates just `/info/[slug]`, `/info` and the sitemap, so **the menus of every other page stay stale** until their ISR copy expires (60 days) or another event touches them. Cell "partial" says which event is missing.

| Route                       | Models read (besides layout `page`)                                                                                                                        | Revalidated?                                                                                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                         | `home`, `book` (carousel/single book), `author` (card names), `collection` (featured book), `license` (fetched by the card fragments, not rendered)        | partial: `home`, `book` yes; `author`, `collection` no; page menus no                                                                                                                       |
| `/libri`                    | `index_page`, `book`, `author` (card names), `license` (fetched by the card fragments, not rendered)                                                       | partial: `book`, `index_page` yes; `author` no; page menus no                                                                                                                               |
| `/libri/pagina/[page]`      | `index_page`, `book`, `author`, `license` (fetched by the card fragments, not rendered)                                                                    | partial: `book` yes while the page exists (count from published books), `index_page` yes; `author` no; page menus no                                                                        |
| `/libri/[slug]`             | `book`, `author`, `collection`, `license`, `cover_size`, `blog_post` (`reviews`), `blog_author` (review author); sibling books by authors/collection/title | partial: the book's own save and `license` (by record id) yes; `author`, `collection` rename, `cover_size`, `blog_post`, `blog_author`, sibling-book changes no; old slug no; page menus no |
| `/libri/ebooks`             | `index_page`, `book`, `license` (fetched by the card fragments, not rendered)                                                                              | partial: `book`, `index_page` yes; page menus no                                                                                                                                            |
| `/libri/highlights`         | `index_page`, `book`, `license` (fetched by the card fragments, not rendered)                                                                              | partial: `book`, `index_page` yes; page menus no                                                                                                                                            |
| `/libri/archivio`           | `index_page`, `book`, `license` (fetched by the card fragments, not rendered)                                                                              | partial: `book`, `index_page` yes; page menus no                                                                                                                                            |
| `/libri/schede/[slug]`      | `book`, `author`, `collection`, `license`, `cover_size`, `app` (internal, staff-gated, editor-only)                                                        | no: not in any list (editor cookie bypasses the cache); `app` is a no-op by design, `license` maps only the public book pages                                                               |
| `/autori`                   | `index_page`, `author`, `book`                                                                                                                             | partial: `author`, `index_page` yes; `book` no (book count on cards); page menus no                                                                                                         |
| `/autori/[slug]`            | `author`, `book` (author's books), `license` (fetched by the card fragments, not rendered)                                                                 | partial: `author` yes; `book` add yes on publish, removal from the old author no (enrichment reads current relations), unpublish/delete no; old slug no; page menus no                      |
| `/collane`                  | `index_page`, `collection`, `book`                                                                                                                         | partial: `collection`, `index_page` yes; `book` no; page menus no                                                                                                                           |
| `/collane/[slug]`           | `collection`, `book`, `license` (fetched by the card fragments, not rendered)                                                                              | partial: `collection` yes; `book` add yes on publish, removal from the old collection no (enrichment reads current relations), unpublish/delete no; old slug no; page menus no              |
| `/magazine`                 | `index_page`, `blog_post`, `blog_category`, `blog_author`                                                                                                  | partial: `blog_post`, `index_page` yes; the others no; page menus no                                                                                                                        |
| `/magazine/[slug]`          | `blog_post`, `blog_category`, `blog_author`, linked `author`/`page`/`book`, `license` (fetched by the card fragments, not rendered)                        | partial: `blog_post` yes; the others no; old slug no; page menus no                                                                                                                         |
| `/info`                     | no CMS data (static "coming soon" page)                                                                                                                    | yes (layout `page` menus, via `page` events)                                                                                                                                                |
| `/info/[slug]`              | `page`, linked `author`/`book`/`blog_post`, `license` (fetched by the card fragments of linked books, not rendered)                                        | partial: `page` yes; linked records no; old slug no; page menus no (other pages)                                                                                                            |
| `/distributori`             | `index_page`, `supplier`                                                                                                                                   | yes: `index_page`, `supplier`; page menus no                                                                                                                                                |
| `/cerca`                    | no CMS data (Site Search runs client-side); layout `page` menus only                                                                                       | no: layout `page` menus not revalidated                                                                                                                                                     |
| `/cerca/search-page.client` | not a page: client bundle source, no handler                                                                                                               | n/a                                                                                                                                                                                         |
| `/staff`                    | `book` (counts); internal, gated by middleware                                                                                                             | no: not in any list (editor cookie bypasses the cache)                                                                                                                                      |
| `/staff/archivio-catalogo`  | `book`, `author`, `collection`, `cover_size`, `keyword`; internal, gated by middleware                                                                     | no: not in any list (editor cookie bypasses the cache)                                                                                                                                      |
| `/archived-books.json`      | `book` (archived slugs)                                                                                                                                    | no: `book` events do not include it; the response itself is `Cache-Control: public, max-age=3600, immutable` (`archived-books.json.ts:27`)                                                  |
| `/sitemap.xml`              | `book`, `page`, `collection`, `author`, `blog_post` (slug, `updatedAt`)                                                                                    | yes for every mapped model (all add the sitemap); catalogue pages via `book` enrichment                                                                                                     |

## Cloudflare Workers (branch `chore/cloudflare`)

Described from the code (`src/worker.ts`, `src/middleware.ts`, `src/lib/datocms/{executeQuery,cacheTags,cacheInvalidation}.ts`, `src/pages/api/invalidate-cache/index.ts`, `wrangler.jsonc`). Decision and measurements: `docs/decisions-log/2026-11-21-cloudflare-workers-cache-gateway-and-tag-purge.md`. Switch-day steps: `docs/guidelines/cloudflare-switch.md`.

### Gateway and Backend

`wrangler.jsonc` turns Workers Cache on for the Worker and defines two entrypoints (`exports`):

- **Gateway** (`default`, `src/worker.ts`, cache off): runs on every request. If the draft cookie is present (name `DRAFT_MODE_COOKIE_NAME` trimmed, else `multimage_draft_mode`; the rule is copied from `src/lib/draftMode.ts`, keep them in sync) it forwards with `cache: 'no-store'`, so an editor never reads or fills the shared copy. Outside `/api` it sets `cf.cacheKey` to the path only, so `?utm_*`, `?fbclid` and other query strings share one entry. Every request, POST included, goes to `Backend`.
- **Backend** (cache on): wraps the Astro handler. Every render and every purge runs here, because a purge only reaches the cache of the entrypoint that calls it. A cache hit uses no CPU; each page view bills two requests (gateway plus Backend).

The middleware makes the one cache decision per request, after `next()` (queries never call `cache.set`). Anything not listed is private.

| Route                                                                                                           | Policy                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Public GET page, `text/html`, status 200, no draft                                                              | cached, `maxAge` 60 days, DatoCMS tags                                                                        |
| `/sitemap.xml`, `/archived-books.json` (GET 200, no draft)                                                      | cached, `maxAge` 60 days, tags (they run CDA queries, so a purge keeps them fresh)                            |
| Endpoints with no CDA query (none today: `robots.txt` is a static asset)                                        | `cache.set(false)`                                                                                            |
| Internal paths (`/staff`, `/libri/schede`), `/api/*`, non-GET, non-200, any draft request, any draft CDA query | `cache.set(false)` plus `Cache-Control: private, no-store` (draft requests answer `cf-cache-status: DYNAMIC`) |

The draft bypass is double (gateway `no-store`, middleware `set(false)`): draft HTML carries the draft CDA token, so a stored draft render would leak it. For cacheable rows the middleware buffers the body first, because the tags are collected while the page streams and a draft query during the stream turns the row private. Internal paths without a session answer a flat 404, private.

### Tags

- `executeQuery` runs published queries through `rawExecuteQuery` with `returnCacheTags` and pushes the response's `x-cache-tags` into a per-request AsyncLocalStorage store (`cacheTags.ts`), opened by the middleware only on Cloudflare GET requests outside `/api`. A draft query marks the store `disabled`. See `cms-data-loading.md`.
- `BaseLayout` marks its site query `cacheTagScope: 'layout'`; an HTML page with no layout tags is treated as unpurgeable (below). `/sitemap.xml` and `/archived-books.json` have no layout, so the check there is a tag count above 0.
- **Coarse fallback**: when there are no tags, more than 990 (`MAX_PAGE_TAGS`; Cloudflare keeps the first 1000 and appends its own path tag), an invalid tag (comma, characters outside `0x21-0x7E`, over 1024 chars), or an HTML page with no layout tags, the page is stored with the single tag `site` and a `maxAge` of 1 day (`COARSE_MAX_AGE`) instead of 60 days. Every purge adds `site`, so a coarse page is purged by any publish and expires in a day at most.
- Measured on the trial Worker (V2): 27 to 515 tags per page (`/` 66, `/libri` 156, `/autori` 515, `/sitemap.xml` 500, `/archived-books.json` 27), none coarse.
- The middleware logs one JSON line per cached page: `{"event":"cache-tags","path","tagCount","hasLayoutTags","coarse","reason"}` (`console.warn` when coarse).

### `POST /api/invalidate-cache`

DatoCMS `cda_cache_tags` / `invalidate` webhook receiver, `Authorization: Bearer <CACHE_INVALIDATION_WEBHOOK_SECRET>`. It purges through `locals.cfContext.cache.purge` (not `context.cache.invalidate`, which ignores the purge result, and not an import of `cloudflare:workers`, which breaks the Vercel build) and never calls `cache.set`. Order of answers:

| Status | When                                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 401    | secret unset or bearer mismatch (constant-time compare)                                                                           |
| 400    | body is not JSON, or has no valid `entity.attributes.tags` (array of non-empty strings)                                           |
| 503    | no cache provider or no `cfContext` (Vercel)                                                                                      |
| 200    | `{ purged: 0, batches: 0, noop: true }` for an empty tags array; otherwise `{ purged, batches, reindexed }` after a good purge     |
| 502    | a purge batch failed; the run stops at the first failure so DatoCMS retries                                                       |

Invalid tags are dropped and counted in the log; `site` is added to every non-empty purge. Tags go in batches of 100 (Free limit), in sequence. The Free plan allows 5 purge requests per minute with a burst of 25: 30 calls in a row gave 25 times 200 then 502 with Cloudflare code 1134 ("rate limit reached"), and the DatoCMS retry is the recovery. Logs carry counts only, never the bearer or the tags. After a good purge it triggers the Site Search reindex (`reindexSiteSearch`, needs `DATOCMS_CMA_TOKEN` and `SITE_SEARCH_BUILD_TRIGGER_ID`). The old `/api/revalidate` webhook must be disabled at the switch: on the Worker it answers 500 `BYPASS_TOKEN not configured` (before any reindex) and DatoCMS would retry every publish.

### Things that empty or skip the cache

- A deploy or `wrangler secret put` creates a new Worker version, and the cache is partitioned by version: it starts empty. There is no purge-everything endpoint, so a full purge is a redeploy (`npm run deploy:cf`).
- Files under `public/` (`robots.txt`, bundles in `public/generated/`) are served by Workers Assets before the Worker runs: the middleware policy never applies to them and they leave no `wrangler tail` event. Control them with a `_headers` file.
- Every deploy, purge, draft view and `/api` call is a render (a miss): this is why the Free plan's 10 ms CPU limit is the constraint, see the runbook.

### Checks

```bash
npm run check:cache-tags                       # pure checks of tag decisions and payload parsing, no network
curl -sI https://<host>/libri | grep -i cf-cache-status     # MISS, then HIT
npx wrangler tail multimage-astro --format json # the cache-tags lines, per page
```

`wrangler tail` drops events under a burst: for rate-limit checks count the HTTP answers, not the log lines. Check the status line with `-w '%{http_code}'` (curl prints `HTTP/2 200` with no colon).

## Gaps and fate

These gaps and the route table above are the Vercel URL map; on Cloudflare the tags replace the map (a publish purges every page that read the record, layout menus included). Fate `fixed in V2` / `closed in V2`: done in slice V2 (caching behaviour); `TODO` goes to `docs/TODO.md`.

| #   | Gap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Fate         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | 7 mapped api_keys did not exist (`books_index`, `archive_index`, `highlights_index`, `ebooks_index`, `collections_index`, `authors_index`, `magazine_index`) while `index_page` (by slug) was unmapped. Fixed in V2: `index_page` is mapped by slug in `revalidationUrls.ts` and `recordInfo.ts`, the phantom keys are removed                                                                                                                                                         | fixed in V2  |
| 2   | `supplier` was unmapped. Fixed in V2: it revalidates `/distributori`                                                                                                                                                                                                                                                                                                                                                                                                                   | fixed in V2  |
| 3   | `license` unmapped: every page that shows a book card or the featured book (`/`, `/libri*`, `/autori/[slug]`, `/collane/[slug]`, `/info/[slug]`, `/magazine/[slug]`) and the book sheets shows a stale license. Fixed in V2: the license is rendered only on `/libri/[slug]` (`buildEditionDetails`); the card fragments fetch it but no card shows it, so `license` revalidates only its books' pages                                                                                 | fixed in V2  |
| 4   | `app` (singleton; `pdfFooter` on the staff book sheet) is a no-op by design: its only reader `/libri/schede/[slug]` is staff-gated, so revalidating it would only re-cache the anonymous 404. Closed in V2                                                                                                                                                                                                                                                                             | closed in V2 |
| 5   | `page` menus: header/footer menus on every page are fed by `page` (`menu`, `menuFooter`, `label`, `position`) but a page event only revalidates `/info/[slug]`, `/info` and the sitemap                                                                                                                                                                                                                                                                                                | TODO         |
| 6   | Book unpublish/delete: the enrichment query returns no book, so author and collection pages (and the old catalogue count) are skipped; on a relation change the old author or collection page is never refreshed (enrichment reads current relations)                                                                                                                                                                                                                                  | TODO         |
| 7   | Slug change: the event carries only the new slug, the old URL stays cached                                                                                                                                                                                                                                                                                                                                                                                                             | TODO         |
| 8   | No upload events on the webhook: replacing or editing an asset revalidates nothing                                                                                                                                                                                                                                                                                                                                                                                                     | TODO         |
| 9   | Referenced records: `author` or `collection` rename does not refresh book cards, book detail, catalogue or home; a book change does not refresh sibling books (same author/collection/title)                                                                                                                                                                                                                                                                                           | TODO         |
| 10  | `cover_size`, `blog_category`, `blog_author`, `keyword` unmapped (read by book detail, book sheets, magazine pages and the staff catalogue)                                                                                                                                                                                                                                                                                                                                            | TODO         |
| 11  | `/archived-books.json` is not in the `book` URL list                                                                                                                                                                                                                                                                                                                                                                                                                                   | TODO         |
| 12  | Unmapped model or payload without `api_key` returns 200 `noop`, and `success` counts 401/404 as ok (`index.ts:55`): DatoCMS and the JSON never show a failed revalidation                                                                                                                                                                                                                                                                                                              | TODO         |
| 13  | `revalidationUrls.ts` and `recordInfo.ts` are two hand-synced maps with no check between them. Narrowed in V2: the index paths now live once (`INDEX_PAGE_PATHS`); the rest of the two maps is still synced by hand                                                                                                                                                                                                                                                                    | TODO         |
| 14  | `blog_post` or `blog_author` change does not refresh the books that link it as a review (`book.reviews`, shown on `/libri/[slug]`)                                                                                                                                                                                                                                                                                                                                                     | TODO         |
| 15  | `/staff` without session: the middleware 404 is cached by Vercel (`x-vercel-cache: HIT`, run (c)). Verify an editor session reaches `/staff` and `/libri/schede` on production despite the cached anonymous 404; depends on `__prerender_bypass`, i.e. `BYPASS_TOKEN` set in the Vercel production env. V4 preview (2026-11-05, Astro 7): anonymous `/staff` 404, then 200 with the draft session (`__prerender_bypass`), then 404 again in a clean session; production still to check | TODO         |

## Verification procedure

Three checks, from the cheapest to the most real. None of them may call the production endpoint: locally `PUBLIC_SITE_URL` is the production URL, so `/api/revalidate` would fetch production pages with `x-prerender-revalidate` and trigger the production Site Search reindex.

### (a) URL map, no network

```bash
npm run check:revalidation-map
```

It runs `parseWebhookPayload` and `getRevalidationUrls` on the sample payloads in `scripts/revalidation-map/payloads/` (one per model, plus `malformed`), with the query function replaced by a stub passed in directly. It then checks `recordToWebsiteRoute` on a table of routes. It opens no connection and needs no token.

- Any Node that supports `--import` (>= 20.6) runs it: no loader hooks, the repo runs on Node 24 (`.nvmrc`). A preload (`sentinel.mjs`) sets the failing exit code and blocks `fetch`.
- `tsx` is not a devDependency: the script uses the copy hoisted by the `datocms` CLI.
- Output, one line per payload: `file event api_key slug n STATUS`, where `n` is the number of URLs. Then one line per route: `route api_key slug result STATUS`. Then `N payloads, R routes, M mismatches, fetch calls: K`. Exit code 1 if `M` or `K` is above 0, or if an entry never ran (sentinel), or if a payload file is missing.
- `OK`: the result matches what the script expects. `GAP`: the model is known to be under-served (see "Gaps and fate"). After V2 only `page` (gap 5, menus) and `book-unpublish` (gap 6) print `GAP`. A `GAP` is not a failure: it is the recorded state of the code. `MISMATCH` is a failure: the code changed and the expectation did not.
- The expectations describe the code **after V2**. When a later slice closes gap 5 or 6, the `GAP` lines must turn `OK` and the expectations in `scripts/revalidation-map/check.ts` change with them.

### (b) Local `astro dev`, with overrides

Pick a free port at run time. Never use 4321 (the user's own `astro dev`, which has the production `PUBLIC_SITE_URL`) or 4329 (another project).

```bash
export PORT=4331
lsof -nP -iTCP:$PORT -sTCP:LISTEN   # must print nothing; otherwise pick another port
```

Overrides, for the shell session only (process env wins over `.env`):

- `PUBLIC_SITE_URL=http://localhost:$PORT`: the same port the server listens on, otherwise the endpoint fetches production URLs or the wrong server.
- `SITE_SEARCH_BUILD_TRIGGER_ID=` (empty): otherwise the endpoint triggers the production Site Search reindex.
- `BYPASS_TOKEN`: a throwaway value, because the ISR config reads it from the environment.
- `--ignore-lock` (on the command below): Astro 7 `astro dev` takes a project lock in `.astro/`; `--ignore-lock` runs a one-off foreground server that neither takes nor checks it, so it does not interfere with the user's own server on 4321.

```bash
PUBLIC_SITE_URL=http://localhost:$PORT SITE_SEARCH_BUILD_TRIGGER_ID= \
  BYPASS_TOKEN="$(openssl rand -hex 16)" npx astro dev --ignore-lock --port $PORT
```

Then POST the sample payloads, one request each: `book-publish`, `index_page-libri-publish`, `supplier-publish`, `app-publish` (a no-op), `license-publish` (with `entity.id` set to a real license id) and one with a wrong token.

```bash
curl -s -X POST "http://localhost:$PORT/api/revalidate?token=<SECRET_API_TOKEN>" \
  -H "content-type: application/json" \
  --data @scripts/revalidation-map/payloads/book-publish.json
```

Shell form, so the real token is never echoed or stored in history: wrap the call in single quotes and let `dotenv` expand the variable inside the child shell, for example `npx dotenv -e .env -- sh -c 'curl -s -X POST "http://localhost:'"$PORT"'/api/revalidate?token=$SECRET_API_TOKEN" -H "content-type: application/json" --data @scripts/revalidation-map/payloads/<file>.json'`. For the wrong-token case use `?token=wrong` and `-o /dev/null -w '%{http_code}'`.

Rules:

- **Never `?mode=full`**, locally or anywhere: it revalidates every route and reindexes.
- **Judge by `urls`, `mode`, `reindexed` and the dev log** (one `[status] /path` line per URL), **not by `success`**: the count includes 401 and 404 as fulfilled (`index.ts:55`). A log line containing `enrichment failed` means a count or license query fell back.
- Expected after V2: `book-publish` returns `"mode":"surgical"` and `"reindexed":false`; `index_page-libri-publish` returns `/libri` plus `/libri/pagina/2..N`; `supplier-publish` returns `["/distributori"]`; `app-publish` returns `"noop":true`; `license-publish` returns only `/libri/<slug>` URLs; the wrong token returns `401`. With the fixture slug, `book-publish` gives no status line for `/libri/libro-pubblicato` (the page throws), yet the endpoint counts it ok.
- Afterwards: stop the server (`lsof -nP -iTCP:$PORT -sTCP:LISTEN`, then kill the PID) and restore the schema that `sync-datocms` may have rewritten: `git diff --quiet -- schema.ts || git checkout -- schema.ts`.
- `astro preview` does not work with `@astrojs/vercel`: use `astro dev`.

### (c) Deployed, passive only

After a real editorial publish, read what DatoCMS sent and what the CDN holds. No POST to the endpoint, no resend of a webhook call, no `?mode=full`.

```bash
npx dotenv -e .env -- npx --no-install datocms cma:call webhookCalls list \
  --params '{filter:{fields:{webhook_id:{eq:"33942"},status:{eq:"success"}}},order_by:"last_sent_at_desc",page:{limit:5}}' \
  2>/dev/null | node -e 'const s=require("fs").readFileSync(0,"utf8"); for (const a of JSON.parse(s.slice(s.search(/^[\[{]/m)))) { let p={}; try{p=JSON.parse(a.response_payload)}catch(e){} console.log(a.last_sent_at,a.event_type,a.status,a.response_status,p.mode,p.total,JSON.stringify(p.urls)) }'
```

Do not add `--json`: it prints nothing here. Each call's `request_url` carries `?token=` and the headers hold secrets: the raw output goes straight into the filter and never reaches the terminal or the disk. Never print it, `head` included.

Print only `last_sent_at`, `event_type`, `status`, `response_status`, and from `response_payload` the `mode`, `total` and `urls` (never the request URL, which carries the token). Then, on 3 to 5 of those URLs plus `/` and `/distributori`:

```bash
curl -sI https://www.multimage.org<path> | grep -iE '^(x-vercel-cache|age|date):'
```

Read: `x-vercel-cache: HIT` with `age` smaller than the seconds since `last_sent_at` is consistent with a refresh by that publish. It shows the publish caused it only if a URL outside the list (e.g. `/distributori`) has a larger `age`, or no deploy came between the publish and the check. `MISS` right after a deploy is normal: a fresh deployment starts with an empty ISR cache. Webhook calls expire, so an old publish may no longer be listed.

### Runs — 2026-11-05 (V2)

Run on 2026-11-05, Node v24.18.0.

#### (a) `npm run check:revalidation-map`

```text
app-publish publish app null 0 OK
author-publish publish author autore-uno 3 OK
blog_post-publish publish blog_post articolo-uno 3 OK
book-publish publish book libro-pubblicato 12 OK
book-unpublish unpublish book libro-non-pubblicato 9 GAP
books_index-publish publish books_index null 0 OK
collection-publish publish collection collana-uno 3 OK
home-publish publish home null 2 OK
index_page-libri-publish publish index_page libri 3 OK
index_page-publish publish index_page autori 1 OK
index_page-unknown-publish publish index_page sconosciuta 0 OK
license-publish publish license null 2 OK
malformed publish null senza-modello skipped OK
page-publish publish page chi-siamo 3 GAP
supplier-publish publish supplier null 1 OK
route index_page libri /libri OK
route index_page ebooks /libri/ebooks OK
route index_page highlights /libri/highlights OK
route index_page archivio /libri/archivio OK
route index_page collane /collane OK
route index_page autori /autori OK
route index_page magazine /magazine OK
route index_page distributori /distributori OK
route index_page sconosciuta null OK
route supplier - /distributori OK
route books_index - null OK
15 payloads, 11 routes, 0 mismatches, fetch calls: 0
```

Exit 0. The two `GAP` lines match the open gaps: `book-unpublish` (6) and `page` (5). `app`, `index_page`, `license` and `supplier` are `OK`; `books_index` now yields no URL because the phantom key is gone.

After the final review the route table gained an `index_page` `constructor` row (inherited-property slug must yield no URL); re-run, same Node: `15 payloads, 12 routes, 0 mismatches, fetch calls: 0`.

#### (b) Local `astro dev`

`astro` v6.3.3 on `localhost:4331` (port free before; 4321 and 4329 untouched), with the overrides above. Requests went through the `dotenv` form, so the token was never echoed. License ids came from one read-only `cma:call items list` filtered to id and code: 7 licenses (`c`, `by`, `by-sa`, `by-nd`, `by-nc`, `by-nc-sa`, `by-nc-nd`); `by-nc-nd` and `by-nd` were used. Each payload was rewritten and piped into `curl --data @-`, with no file.

1. `index_page-libri-publish`: HTTP 200, `"mode":"surgical"`, `"total":9`, `"failures":0`, `"reindexed":false`, 1084 ms. URLs: `/libri`, `/libri/pagina/2` to `/libri/pagina/9` (real count, N = 9).
2. `supplier-publish`: `"total":1`, `"reindexed":false`, `urls` = `["/distributori"]`, 348 ms. Gap 2 is closed.
3. `app-publish`: `{"mode":"surgical","eventType":"publish","apiKey":"app","revalidated":0,"urls":[],"noop":true}`. This is the intended no-op: `app` is mapped to no URL.
4. `license-publish`, `by-nc-nd`: `"total":42`, `"failures":0`, `"reindexed":false`, 2962 ms. All 42 URLs are `/libri/<slug>` (for example `/libri/un-giorno-solo`, `/libri/sedna`, `/libri/sedna-ebook`); no `/`, no listing.
5. `license-publish`, `by-nd`: `"total":2`, `urls` = `["/libri/volti-dal-futuro","/libri/se-vuoi-la-pace-prepara-la-pace"]`, 505 ms.
6. `POST /api/preview-links` with a published `index_page` `libri` item: 1 link, label `Published version`, url `http://localhost:4331/api/draft-mode/disable?url=/libri` (published, so no token in the link). The Web Previews route for an index page resolves.

Dev log: 4 `[revalidate] Done (surgical). ... (search reindex: false)` lines (9, 1, 42 and 2 URLs, 0 failed); 0 lines with `enrichment failed`; 0 `ERROR` lines; no 4xx or 5xx status lines. So the lazy default `executeQuery`, the catalogue count query and the license filter work against the real CDA.

`book-publish` and the wrong-token case were not repeated in this run (covered by the 2026-11-04 run).

After the stop: port 4331 free, `schema.ts` unchanged (`git status --porcelain schema.ts` empty), the user's 4321 server still running. Every page fetch went to localhost; the only outbound calls were CDA reads (plus the one CLI read). Still open: the Done item "a real publish of an index page shows the index URL revalidated" goes through (c) after the production deploy.

### Runs — 2026-11-04

Run on 2026-11-05, Node v24.18.0.

#### (a) `npm run check:revalidation-map`

```text
app-publish publish app null 0 GAP
author-publish publish author autore-uno 3 OK
blog_post-publish publish blog_post articolo-uno 3 OK
book-publish publish book libro-pubblicato 12 OK
book-unpublish unpublish book libro-non-pubblicato 9 GAP
books_index-publish publish books_index null 2 OK
collection-publish publish collection collana-uno 3 OK
home-publish publish home null 2 OK
index_page-publish publish index_page autori 0 GAP
license-publish publish license null 0 GAP
malformed publish null senza-modello skipped OK
page-publish publish page chi-siamo 3 GAP
supplier-publish publish supplier null 0 GAP
13 payloads, 0 mismatches, fetch calls: 0
```

Exit 0. The six `GAP` lines match the recorded gaps: `app` (4), `book-unpublish` (6), `index_page` (1), `license` (3), `page` (5), `supplier` (2). `books_index` still yields URLs because the stale api_key is mapped (gap 1).

#### (b) Local `astro dev`

`astro` v6.3.3 on `localhost:4321`, with the three overrides above (port 4321 free before). Three requests, one each.

1. `book-publish`: HTTP 200, `"mode":"surgical"`, `"total":15`, `"failures":0`, `"reindexed":false`, `"elapsedMs":3309`.

   ```text
   /libri/libro-pubblicato /libri/ebooks /libri/highlights /libri/archivio
   / /sitemap.xml /libri /libri/pagina/2 ... /libri/pagina/9
   ```

   Dev log: a `[200]` line for 14 of the 15 URLs (88 to 602 ms); `/libri/libro-pubblicato` logged two `[ERROR] Book not found` lines and no status line (see below). Then `[revalidate] Done (surgical). 15 ok, 0 failed, total 15 URLs in 3309ms (search reindex: false)`.
   - 15 URLs, not the 12 of (a): the real CDA catalogue gives `/libri/pagina/2` to `/libri/pagina/9`, while the (a) stub (81 books) gives pages 2 and 3.
   - No `/autori/*` or `/collane/*`: the fixture slug is unknown to the CDA, so there are no related authors or collection.
   - `/libri/libro-pubblicato` has no `[200]` line: the page logged `Book not found for slug: libro-pubblicato`, yet the endpoint counted it among the 15 ok. This is the `success` gap (`index.ts:55`) seen live: any HTTP response counts as ok, 4xx/5xx included; here the status code was not logged.
   - The search reindex was skipped (empty `SITE_SEARCH_BUILD_TRIGGER_ID`).

2. `supplier-publish`: `{"mode":"surgical","eventType":"publish","apiKey":"supplier","revalidated":0,"urls":[],"noop":true}`. Log: `Model "supplier" is not mapped to any URL; nothing to do.` This confirms gap 2.
3. `?token=wrong`: HTTP `401`.

After the stop: port 4321 free, `schema.ts` unchanged (`astro dev` was used, not `npm run dev`). No token value in the log. Every page fetch went to localhost; the only outbound calls were CDA reads.

#### (c) Production, passive

Run on 2026-11-04 at 23:15 UTC (00:15 CET on 2026-11-05). Read-only: one `webhookCalls list` through the CLI (output filtered to the fields below, never the request URL or headers) and `curl -I` on `https://www.multimage.org`. No POST, no resend, no `?mode=full`.

The CLI printed nothing with `--json` (only the update warning), so the call ran without it and the JSON was parsed from a file under `$TMPDIR`.

Webhook 33942, last 5 successful calls (all `publish`, `status` success, `response_status` 200, `mode` surgical):

| `last_sent_at` (UTC)                              | `total` | URLs                                                                                                                                                                                                            |
| ------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-03 14:30:18                               | 17      | book `/libri/dal-militare-al-sociale-invece-di-armarci-potremmo`, `/libri/ebooks`, `/libri/highlights`, `/libri/archivio`, `/`, `/sitemap.xml`, `/libri`, `/libri/pagina/2` to `/9`, one author, one collection |
| 2026-11-03 14:29:53, 14:28:42, 14:27:59, 14:27:40 | none    | event on a `keyword` record: no URL (unmapped model, noop)                                                                                                                                                      |

Headers for the latest call with URLs (now is 117930 s after 14:30:18):

| Path                                                        | `x-vercel-cache` | `age` (s) | `date` (response generation) |
| ----------------------------------------------------------- | ---------------- | --------- | ---------------------------- |
| `/libri/dal-militare-al-sociale-invece-di-armarci-potremmo` | HIT              | 117300    | 2026-11-03 14:40:48          |
| `/libri/ebooks`                                             | HIT              | 117298    | 2026-11-03 14:40:50          |
| `/libri`                                                    | HIT              | 117304    | 2026-11-03 14:40:44          |
| `/libri/pagina/2`                                           | HIT              | 117281    | 2026-11-03 14:41:07          |
| `/autori/centro-nuovo-modello-di-sviluppo`                  | HIT              | 117294    | 2026-11-03 14:40:55          |
| `/`                                                         | HIT              | 117253    | 2026-11-03 14:41:35          |
| `/distributori` (not in the list)                           | HIT              | 117306    | 2026-11-03 14:40:43          |

- Every URL of the list: HIT, and `age` (about 117300) is smaller than the 117930 s since `last_sent_at`, so each page was regenerated after that publish. The cached copy dates from 14:40 (10 to 11 minutes after the call), not from the 14:30 call; whether that call refreshed it before a later reset cannot be told from headers.
- `/distributori` is not in the list yet has the same age (117306, generated 14:40:43): its regeneration is not caused by this publish. Either a production deploy at about 14:40 reset the ISR cache for all routes (a deploy resets `age`), or something else refreshed it. So this run cannot tell "refreshed by the publish" from "refreshed by a deploy"; for that, run (c) right after a publish with no deploy in between.
- `/staff` without session: HTTP 404, `x-vercel-cache: HIT`, `cache-control: public, max-age=0, must-revalidate`, `age` 52780 (the 404 was cached at 2026-11-04 08:36 UTC). Vercel does cache the middleware 404 for `/staff`. Whether a request with a valid session cookie is served from that cache was not tested (headers only, no cookie).
