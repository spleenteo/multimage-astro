# Slice packet — V3 (work cloudflare-workers)

Test level: essential (project). V3 is mostly documentation plus end-to-end checks on the deployed trial Worker.

## Slice section (from slices.md)
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

### Deviations found while planning V2

- The purge goes through the Backend's execution context (`locals.cfContext.cache.purge`, `@astrojs/cloudflare` `cf-helpers.js:42`), not `cache.purge` imported from `cloudflare:workers`: a literal import would break the Vercel build (Vite fails on the unresolved module) and `astro check` (no Workers types). The docs call the two equivalent; both return `{ success, errors }`.
- V2 Done 4's `hasLayoutTags: true` cannot hold for `/sitemap.xml` and `/archived-books.json` (endpoints, no BaseLayout): for them the check is `tagCount > 0`; `coarse: true` is accepted only with `reason: 'overflow'` logged (the sitemap may exceed the limit).
- The coarse `site` fallback covers more than overflow: zero tags, an invalid tag (comma, characters outside `0x21–0x7E`, over 1024 chars) and an HTML page with no layout tags; each would otherwise leave a page unpurgeable for 60 days.

## What V1 and V2 built
Read their narratives in slices.md (sections 'V1 — done on' and 'V2 — done on') and the decision docs/decisions-log/2026-11-21-cloudflare-workers-cache-gateway-and-tag-purge.md (already written: do not write another decision for it). Code: src/worker.ts, src/middleware.ts, src/lib/datocms/{executeQuery,cacheTags,cacheInvalidation,siteSearch}.ts, src/pages/api/invalidate-cache/index.ts, astro.config.mjs, wrangler.jsonc, package.json scripts (build:cf, deploy:cf, check:cache-tags).

## Switch-day facts (verified 2026-11-21, for the runbook)
- Zone `multimage.org`: active on Cloudflare, registrar Cloudflare, NS naomi/salvador.ns.cloudflare.com, in the PERSONAL account "Spleenteo@gmail.com's Account" (id 1ed0bcbfc2f1e696c278f37de34d8ef2), plan Free Website. The trial Worker is in the account "Multimage" (id 59fd5121a90b86d19e5a982e6fc41696, in wrangler.jsonc). A custom domain needs Worker and zone in the same account → the plan is to move the zone to Multimage (Cloudflare Registrar inter-account move: add the site in Multimage with a plan, start the move from Manage Domain › Configuration in the source account, accept in the target within 5 days; DNSSEC off, no zone hold; settings lost in the source, certificates reissued, 30-day transfer lock). Docs: https://developers.cloudflare.com/registrar/account-options/inter-account-transfer/ and https://developers.cloudflare.com/fundamentals/manage-domains/move-domain/.
- DNS records today (12): A multimage.org → 216.198.79.1 (Vercel, DNS only); CNAME www → 3c2d4db54eb82902.vercel-dns-017.com (Vercel, DNS only); CNAME admin → admin.datocms.com (proxied); CNAME mail → ghs.google.com (proxied); 6 MX Google; 2 TXT google-site-verification. Only the A apex and CNAME www change on switch day.
- Vercel today: project spleenteos-projects/multimage-astro, Pro plan activated 2026-11-20 ($20/month; the CPU was mostly used by another project, acacia-2026). Vercel env vars mirrored on the Worker except BYPASS_TOKEN (Vercel ISR only) and SITE_SEARCH_BUILD_TRIGGER_ID (Secret type, unreadable; id 37696 per decision 2026-05-30) and DATOCMS_CMA_TOKEN (not set on Vercel either).
- Workers plans: Free 100k requests/day, 10 ms CPU per request, 3 MiB gzip Worker; Paid $5/month per account: 10M requests + 30M CPU-ms included, 10 MiB Worker. Worker today ~2.3 MiB gzip. With the cache on, static asset requests are billed requests too. Measured Vercel traffic (21 Oct–20 Nov): 202,943 requests, ~140k page renders/ISR reads, 8,483 human page views.
- The DatoCMS webhook for cache tags is the `cda_cache_tags` / `invalidate` event, Authorization: Bearer <CACHE_INVALIDATION_WEBHOOK_SECRET> (the secret is on the Worker and in the scratchpad cf.env, never print it). The existing /api/revalidate webhook (Vercel) must be disabled at the switch, otherwise Site Search is reindexed twice per publish.

## lessons.md
- In Astro middleware, read any cookie-derived flag after `next()` when the response depends on it: `context.cookies.get()` returns the cookies the endpoint set or deleted during the request, so a value read before `next()` is stale on the endpoints that change it.
- Files under `public/` are served by Workers Assets before the Worker runs: the middleware's cache policy never applies to them, and they leave no `wrangler tail` event. Check them with `_headers`, not the middleware.
- Every Cloudflare build rewrites `.wrangler/deploy/config.json`: keep `.wrangler/` in `.prettierignore` so `npm run lint` stays green after `build:cf`.
- A Flow `h()` helper that greps `^(HTTP|cf-cache-status):` never shows the status line: curl prints `HTTP/2 200` with no colon. Use `-w '%{http_code}'` for the status.
- `wrangler tail` drops events under a burst (31 calls gave 28 endpoint log lines). Count rate-limit outcomes from the HTTP answers, and use the tail only for per-page fields.
- A scratch script that uses top-level await and runs under `node --import tsx` must be `.mts`: tsx compiles a `.ts` file outside the repo's ESM scope to CJS and fails.
- Commit an extraction (moving a helper to `src/lib`) separately from, and before, the feature that reuses it, even inside one plan task: a later split would need a rebase.

## Environment facts
- Trial Worker: https://multimage-astro.matteo-59f.workers.dev, account Multimage (account_id in wrangler.jsonc). Deploy: `npx dotenv -e /private/tmp/claude-501/-Users-spleenteo-Sites-multimage-multimage-astro/0eccf176-0273-426a-a385-88feef210e71/scratchpad/cf.env -- npm run deploy:cf` (the env file holds production secrets: never print it, never copy it into the repo). Builds need that env file too (`validateSecrets`): `npx dotenv -e <file> -- npm run build` and `... -- npm run build:cf`.
- Logs: `npx wrangler tail multimage-astro --format json` (fields `cpuTime`, `wallTime`, `entrypoint`, `event.request.url`).
- Draft mode on the trial Worker: GET `/api/draft-mode/enable?token=<SECRET_API_TOKEN>&url=/` sets the cookie (read SECRET_API_TOKEN from the env file into a shell variable, never echo it).
- Installed: astro 7.4.7, @astrojs/cloudflare 14.4.9 (`./cache` exports cacheCloudflare, `./handler` exports handle), wrangler 4.147.0, @datocms/cda-client 0.3.2.
- Cloudflare Workers Cache docs downloaded at /private/tmp/claude-501/-Users-spleenteo-Sites-multimage-multimage-astro/0eccf176-0273-426a-a385-88feef210e71/scratchpad/cfdocs/ (cache.md, cache_configuration.md, cache_purge.md, keys.md, lim.md).
- Shell quirk: `rm` is intercepted by a zsh hook; use `/bin/rm` (in subagent shells use Python os.remove).
- Never push, never run `vercel` deploy commands, never touch DNS or DatoCMS. Port 4321 may be the user's own dev server: don't touch it.

## Project doc rules (from CLAUDE.md)
- Keep /docs/list-*.md, /docs/TODO.md and /docs/current-state.md in sync with the codebase. After a feature: update affected docs/guidelines, list-*.md, current-state.md, TODO.md.
- TODO.md open format: `- [ ] [Area] [Impact: H|M|L] [Effort: H|M|L] [Owner: @handle] [Status: todo|wip|done] — description`; completed at the bottom: `- [YYYY-MM-DD] - [Area] **Feature name**: short description`. Areas: Refactoring · Security · Performance · Features · Documentation.
- Shapes: when a slice is complete, tick it in docs/shapes/<file> and add a completed entry in docs/TODO.md; keep docs/shapes/README.md index status current.
- Never edit schema.ts; never touch .env* files; never include GraphQL fields ending in _private.

## docs/development-guidelines.md
# Development guidelines

Read whole by `/flow:dev` in every plan, review, execution and close. Prose guidance per concern lives in `docs/guidelines/`.

## References

- Astro docs (docs.astro.build) for directives and APIs.
- DatoCMS skills, when in session: `datocms-cli` (CLI, migrations, environments, schema), `datocms-cda` (queries, cache tags, type generation), `datocms-frontend-integrations` (draft mode, Content Link, components), `datocms-structured-text`, `datocms-content-modeling`. Otherwise `datocms cma:docs` and datocms.com — never memory.
- Project conventions: `CLAUDE.md` and `docs/guidelines/`.

## Tests

Level: essential
Sensitive areas: `src/pages/api/` (revalidate, draft-mode, post-deploy), `src/middleware.ts`, draft mode and editor session, `src/lib/datocms/` (queries, fragments, revalidation map), `scripts/`

No test runner is configured: `npm test` runs format + lint + build, so it rewrites files. Verification is the gate below plus a working deploy.

## Gate

- `npm run lint` (prettier check)
- `npm run build` (runs `astro check` then `astro build`; needs the local `.env`)

## Guidelines

### docs/guidelines/caching.md
---
description: How page caching and revalidation work today (Vercel ISR, URL-based webhook), what each route depends on, and the known gaps
---

# Caching and revalidation

Audited 2026-11-04 (work `upgrade-2026-11`, slice V1), updated 2026-11-05 for slice V2 (revalidation map fixes). This file describes the caching as it is, not as it should be.

## Status

**Cache tags: not implemented, revalidation is URL-based.** DatoCMS cache tags (shape `docs/shapes/2026-03-05-cache-tags.md`) are a separate, future work. Today a DatoCMS webhook calls `/api/revalidate`, which maps the changed record to a list of public URLs and refetches each one with the Vercel bypass header so the ISR copy is regenerated.

## Configuration

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

## Gaps and fate

Fate `fixed in V2` / `closed in V2`: done in slice V2 (caching behaviour); `TODO` goes to `docs/TODO.md`.

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

### docs/guidelines/operations.md
---
description: Describe how Multimage is built, deployed, and configured across environments.
---

# Operations Runbook

## Deployments

- Vercel is the single supported target: link the repo, sync environment variables, and run `npm run build`. The site is one deployment running `output: 'server'` with ISR (`@astrojs/vercel`): every route is rendered per request and cached by the Vercel CDN, nothing is prerendered at build time. Draft Mode (the signed JWT cookie plus Vercel's `__prerender_bypass` cookie) bypasses the cache on the same deployment, so there is no separate static/preview split.
- Vercel builds on Node 24.x with the Vercel project Node setting kept on 24.x to match `engines.node` (`24.x`) in `package.json` and `.nvmrc` (local work). `.vercelignore` keeps `.env*` (plus `dist/`, `.astro/`, `.claude/`) out of CLI uploads (`vercel deploy`).
- `npm run dev` chains `npm run sync-datocms` before `astro dev`, ensuring `schema.ts` and `docs/DATOCMS.md` stay in sync when `DATOCMS_API_TOKEN` is available.
- `npm run prebuild` currently rebuilds the Site Search client before `npm run build` invokes `astro check` and the production build.
- Local checks use `astro dev` (`npm run dev`). `astro preview` does not work with `@astrojs/vercel`, so no preview script is provided. ISR caching is a Vercel CDN feature and is not active locally; see `docs/guidelines/caching.md` for the revalidation checks. Under an AI agent, Astro 7 `astro dev` starts in the background (stop it with `npx astro dev stop`), and `--ignore-lock` keeps a one-off foreground server.
- `tmp-sample/` is a read-only Astro starter kept in the repo for reference. It is excluded via `tsconfig.json` so `astro check`/`npm run build` ignore its missing React dependencies.

## Environment & Secrets

- Required env vars on Vercel: `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`, and `NODE_ENV=production`. CLI-specific `DATOCMS_API_TOKEN`/`DATOCMS_CMA_TOKEN` can remain local unless schema generation runs in CI.
- `datocms.json` enumerates the CDA/CMA tokens used during automation; keep it updated when tokens rotate so `vercel env pull` stays in sync.
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` ships to the browser; provision it from a role limited to **Perform Site Search API calls** to prevent privileged access. See `docs/guidelines/security.md` for scoping details.
- Runtime also reads standard flags (`NODE_ENV`, `CI`, `CONTINUOUS_INTEGRATION`, `VERCEL`). Only set what the deploy target actually needs to keep the surface minimal.
- `PUBLIC_SITE_URL` powers sitemap generation and absolute links; missing values break `/src/pages/sitemap.xml.ts`.

## Preview & Drafts

- `/api/preview` ora gestisce l’ingresso in Draft Mode firmando il cookie e reindirizzando alla rotta desiderata. `/api/draft-mode/enable|disable` vengono usate dal plugin DatoCMS Web Previews per generare i link “Draft/Published”.
- `executeQuery` accetta `{ includeDrafts: true }` e grazie a `resolveDraftMode(Astro)` (vedi `~/lib/draftPreview`) legge i cookie su ogni richiesta: il cookie di Draft Mode fa saltare la cache ISR sulla stessa deployment.
- `/api/post-deploy` è invocato automaticamente da Vercel (via `datocms.json`) e si occupa di installare/aggiornare plug-in ufficiali DatoCMS:
  - **Web Previews** → aggiunge due frontends (Production + Preview) che puntano a `/api/preview-links?token=...`.
  - **SEO/Readability Analysis** → punta `htmlGeneratorUrl` al `/api/seo-analysis` dell’ambiente corrente.
  Se il post-deploy fallisce (es. perché il plug-in è già installato con permessi diversi) puoi rilanciarlo manualmente con `curl -X POST <deploy-url>/api/post-deploy -H 'Content-Type: application/json' -d '{"datocmsApiToken":"<CMA>","frontendUrl":"<deploy-url>"}'` (usa un CMA token “Admin”).

## Monitoring & Logging

- Client monitoring uses Google Analytics (legacy UA), `@vercel/analytics`, and `@vercel/speed-insights`. There is no server-side logging or alerting yet.
- The `/llms-full.txt` export route was removed (2026-06-20); no exporter to maintain.

## Testing & Automation

- No CI workflow runs `astro check`, linting, or builds. Add GitHub Actions (or Vercel checks) to execute at least `npm run lint` and `npm run build` on pull requests.
- `npm run test` chains `npm run format` → `npm run lint` (Prettier `--check`) → `npm run build`. This covers formatting and build health but not unit coverage.
- Utilities like `src/pages/cerca/search-page.client.ts` and the staff CSV helpers have zero unit tests; start with Vitest for pure helpers and DOM tests for CSV/search scripts.
- GraphQL queries rely on build-time validation. Consider lightweight contract tests that mock `executeQuery` responses so schema drift is caught earlier.

### docs/guidelines/preview-mode.md
---
description: How to manage draft preview, Visual Editing, and on-demand cache invalidation for editors
---

# Preview, Draft Mode & Visual Editing

Multimage runs as a **single Astro project on Vercel** with `output: 'server'`
and ISR (Incremental Static Regeneration). Anonymous visitors get
CDN-cached responses (effectively static); editors with the draft cookie bypass
the CDN and see live draft content with click-to-edit overlays.

Le architetture precedenti (due progetti Vercel separati con `SERVER=static` e
`SERVER=preview`) sono state ritirate il 2026-05-17 con la shape
`2026-05-16-unify-projects-isr.md`.

## 1. Architecture overview

```
Anonymous visitor → Vercel CDN → cached response (no function invocation)

Editor (draft cookies) → Vercel CDN sees __prerender_bypass cookie
                       → bypass cache → function runs SSR
                       → executeQuery uses draft token + contentLink:'v1'
                       → page rendered with stega-encoded text
                       → ContentLink client enables click-to-edit overlay

DatoCMS publish → webhook → /api/revalidate
                          → parses payload (api_key + slug)
                          → maps to the affected URLs only (surgical)
                          → fetches each with x-prerender-revalidate header
                          → CDN regenerates + recaches
                          → buildTriggers.reindex → Site Search re-spidered
                            (no rebuild, no cache impact)
```

### Cookies that drive draft mode (dual-cookie pattern)

When `/api/draft-mode/enable` runs, the app sets **two cookies**:

| Cookie | Role | Value |
| --- | --- | --- |
| `multimage_draft_mode` (configurable via `DRAFT_MODE_COOKIE_NAME`) | App-level auth. The site reads this to know the editor is authenticated and to switch to the draft CDA token. | Signed JWT (`SIGNED_COOKIE_JWT_SECRET`) with payload `{ enabled: true }`. |
| `__prerender_bypass` | CDN-level cache bypass. Vercel recognizes this cookie name natively and forces the request to bypass the ISR cache. | Plain opaque token equal to `BYPASS_TOKEN`. |

Both cookies are required. The disable endpoint deletes both.

## 2. Required environment variables

Set every variable in this table both locally (`.env`) and on Vercel for every
environment (Production / Preview).

| Variable | Required | Notes |
| --- | --- | --- |
| `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` | yes | Published-only CDA token. |
| `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` | yes | Draft-only CDA token (must include "Access in Preview Mode"). |
| `DATOCMS_CMA_TOKEN` | yes (only if SEO Analysis plugin is enabled) | CMA token for `/api/seo-analysis`. |
| `SECRET_API_TOKEN` | yes | Shared secret for `/api/preview`, `/api/draft-mode/enable`, `/api/preview-links`, `/api/revalidate`. |
| `SIGNED_COOKIE_JWT_SECRET` | yes | Random string used to sign the draft JWT cookie (`openssl rand -hex 32`). |
| `DRAFT_MODE_COOKIE_NAME` | optional | Defaults to `multimage_draft_mode`. |
| `BYPASS_TOKEN` | yes on Vercel | Opaque token used both as the `__prerender_bypass` cookie value (Draft Mode) and as the `x-prerender-revalidate` header (on-demand ISR via `/api/revalidate`). Generate with `openssl rand -hex 32`. |
| `DATOCMS_BASE_EDITING_URL` | yes for Visual Editing | **Bare admin URL with no `/environments/...` suffix**: `https://multimage.admin.datocms.com`. Used by Content Link to construct edit-URLs. ⚠️ Appending `/environments/main` (even though `main` *is* the primary) makes the stega edit-URLs take the *sandbox* form, and the plugin then reports "Environment Mismatch Detected" — the sandbox URL shape doesn't match a primary-environment editing session. Only append `/environments/<name>` when targeting a genuine non-primary sandbox. |
| `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` | yes | Site Search token (ships to the browser — must be read-only Site Search scope). |
| `PUBLIC_SITE_URL` | yes | Site origin without trailing slash. |

The `SERVER` env var has been **removed**. Do not set it anywhere.

## 3. Draft mode flow

Editors enter preview through one of:

- The **DatoCMS Web Previews** plugin sidebar in DatoCMS — clicks "Draft version".
  The plugin hits `/api/preview-links?token=...` (no manual setup beyond
  installing the plugin via `/api/post-deploy`). Each preview link goes through
  `/api/draft-mode/enable?redirect=<recordUrl>&token=...` so both cookies are
  set, then redirects to the record page.
- A direct call to `/api/preview?secret=<SECRET_API_TOKEN>&redirect=/percorso`
  (useful for manual smoke tests).

Exiting preview is automatic when the plugin emits a "Published version" link
(it calls `/api/draft-mode/disable`). Manual exit:
`/api/draft-mode/disable?redirect=/percorso`.

## 4. Draft data flow

- `src/lib/datocms/executeQuery.ts` reads `includeDrafts` from the call site and
  automatically swaps the CDA token. In draft mode it also opts into Content
  Link (`contentLink: 'v1'` + `baseEditingUrl: DATOCMS_BASE_EDITING_URL`) so the
  CDA returns stega-encoded text the overlay can attach to.
- Pages call `resolveDraftMode(Astro)` (from `~/lib/draftPreview`) to know
  whether the current request is in draft mode and forward the flag to
  `executeQuery({ includeDrafts })`.
- `DraftModeQueryListener` (in `src/components/DraftModeQueryListener/`)
  subscribes to live updates: when DatoCMS emits an update for the same query,
  the listener reloads the data with stega encoding preserved. The component
  short-circuits (renders nothing) outside draft mode.

## 5. Visual Editing (Content Link)

Outside draft mode, Content Link is fully inert: the CDA response contains no
stega encoding, so the overlay never activates.

Inside draft mode:

- `src/components/ContentLink.astro` is mounted by `BaseLayout` and initializes
  `createController().enableClickToEdit()` on the client.
- Click on any block or text rendered from a structured-text field → DatoCMS
  opens the corresponding field (in a new tab when the site is loaded outside
  the plugin, in a side panel when loaded inside the **Visual** tab of the Web
  Previews plugin).
- 8 custom Structured Text block components carry the
  `data-datocms-content-link-boundary` attribute on their root element so the
  overlay can target each block as a unit.

The plugin's "Visual" tab loads the site inside an iframe. To make that work,
`src/middleware.ts` adds a `Content-Security-Policy: frame-ancestors ...` header
to draft-mode responses only.

⚠️ The Visual tab **nests** iframes — `admin.multimage.org` (the admin app)
frames `plugins-cdn.datocms.com` (the plugin), which frames the site. CSP
`frame-ancestors` validates the *whole* ancestor chain, so listing only
`plugins-cdn.datocms.com` is not enough: the browser shows "refused to connect".
The header therefore allows `'self' https://*.datocms.com
https://admin.multimage.org`. The custom admin domain (`admin.multimage.org`)
must be listed explicitly — the `*.datocms.com` wildcard does **not** match it.

## 6. On-demand cache invalidation (webhook)

DatoCMS publish → webhook → `POST /api/revalidate?token=<SECRET_API_TOKEN>`.

The endpoint does **surgical** revalidation (since 2026-06-20 — see
`docs/decisions-log/2026-06-20-fot-reduction.md`):

1. Validates the secret.
2. Parses the webhook payload (`src/lib/datocms/webhookPayload.ts`): the
   `event_type`, the record `slug` (`entity.attributes.slug`), and the model
   `api_key` (from `related_entities`, referenced by
   `entity.relationships.item_type`).
3. Maps `api_key + slug` to the small set of affected URLs via
   `getRevalidationUrls()` (`src/lib/datocms/revalidationUrls.ts`): the record's
   own detail URL + a bounded set of listings. A **book** change also revalidates
   the catalogue pages (`/libri` + `/libri/pagina/2..N`), the book sub-indexes,
   `/`, `/sitemap.xml`, and the detail pages of its authors and collection
   (resolved with one CDA query). Typically ~12–20 URLs for a book, fewer for
   other models. Unknown / unmapped models → **no-op** (logs and returns 200).
4. Fetches each URL with `x-prerender-revalidate: <BYPASS_TOKEN>` in chunks of
   20 in parallel, with a 250 ms pause between chunks (stays under the DatoCMS
   40 req/sec rate limit).
5. Triggers a **Site Search re-index** (`buildTriggers.reindex`) — re-spiders
   the search index with no rebuild and no ISR cache impact. Best-effort: a
   failure is logged but does not fail the revalidation. No-op unless both
   `DATOCMS_CMA_TOKEN` and `SITE_SEARCH_BUILD_TRIGGER_ID` (currently `37696`)
   are set.
6. Logs mode/total/success/failures, elapsed time, the revalidated `urls`, and
   the reindex result to `vercel logs`. The JSON response echoes the `urls`.

`POST /api/revalidate?mode=full` still runs the whole-surface sweep via
`getAllPublicUrls()` (manual maintenance / emergency). The old in-memory 5 s
debounce was removed: surgical calls are cheap and idempotent, and a debounce
would wrongly drop a second distinct record published within the window.

### Cache TTL (safety net)

`astro.config.mjs` sets `isr.expiration` to **60 days**. This is only a safety
net: content changes propagate on-demand through the webhook above, so the TTL
just covers the rare case of a missed/failed webhook. A short TTL was pure waste
— it re-rendered the whole surface roughly weekly for unchanged content, burning
Fast Origin Transfer. A manual Vercel build or `?mode=full` forces a full refresh
anytime.

### The DatoCMS webhook (configured)

A webhook named **"Revalidate site cache (ISR)"** (id `33942`) is configured on
the project:

- **URL**: `https://www.multimage.org/api/revalidate?token=<SECRET_API_TOKEN>`
- **Events**: `item` → `publish`, `unpublish`, `delete`. `update` is **not**
  triggered on purpose — saving a draft does not change what the public sees, so
  there is nothing to invalidate until the record is actually published.
- **auto_retry**: on (DatoCMS retries on transient failures).

Revalidation is surgical (since 2026-06-20): the endpoint maps the published
record to its own URL plus a bounded set of listings, instead of sweeping the
whole site (`?mode=full` is a manual fallback only). Cache tags are not
implemented; revalidation is URL-based. See `docs/guidelines/caching.md` for the
route-to-model audit and the verification procedure.

To recreate it via CLI: `npx datocms cma:call webhooks create --data='{...}'`
with the events above (see the shape doc for the full payload).

## 7. Local development

`npm run dev` runs `astro dev`. ISR caching is a Vercel CDN feature, not active
locally — every request is SSR'd. Draft mode works via the JWT cookie (visit
`/api/preview?secret=...&redirect=/`). Content Link works locally if
`DATOCMS_BASE_EDITING_URL` is set in `.env`.

`/api/revalidate` works locally but the `fetch` calls hit `PUBLIC_SITE_URL`
(production). Never call it locally without overriding the environment; follow
procedure (b) in `docs/guidelines/caching.md`.

## 8. Troubleshooting

- **Editor sees published content despite cookies** → check both cookies are
  set in DevTools → Application → Cookies (the JWT cookie *and*
  `__prerender_bypass`). If only the JWT is set, `BYPASS_TOKEN` is probably
  missing from Vercel env, so `enableDraftMode` skipped setting the bypass
  cookie. The CDN serves the cached published response.
- **`/api/revalidate` returns 500 "BYPASS_TOKEN not configured"** → set
  `BYPASS_TOKEN` on Vercel (and re-deploy so the adapter picks it up).
- **Webhook fires but pages don't update** → check `vercel logs` for the
  `[revalidate]` lines. Most common cause is the `x-prerender-revalidate`
  header value not matching `bypassToken` configured in `astro.config.mjs`.
  Both must come from the same `BYPASS_TOKEN` env var.
- **Visual Editing overlay missing** → confirm `DATOCMS_BASE_EDITING_URL` is
  set. Without it `executeQuery` (and `DraftModeQueryListener`) skip Content
  Link entirely (`contentLink`/`baseEditingUrl` left `undefined`): drafts still
  render, just without the click-to-edit overlay. This is intentional — sending
  `contentLink: 'v1'` without a base URL makes the CDA 422
  (`INVALID_X_BASE_EDITING_URL_HEADER`), which used to break every draft page in
  local dev.
- **Iframe in DatoCMS "Visual" tab won't load / "refused to connect"** → check
  response headers for `Content-Security-Policy: frame-ancestors ...`. Two
  causes: (a) the header is absent — `isDraftModeEnabled` is resolving to
  `false` (missing/invalid JWT cookie); (b) the header is present but does not
  list the custom admin domain — `frame-ancestors` must include
  `https://admin.multimage.org`, not just `https://plugins-cdn.datocms.com`,
  because the ancestor chain includes the admin app (see §5).
- **Plugin shows "Environment Mismatch Detected" (records belong to sandbox
  `main`)** → `DATOCMS_BASE_EDITING_URL` has a `/environments/...` suffix. Remove
  it: the value must be the bare `https://multimage.admin.datocms.com` when
  editing the primary environment (see §2).
- **DatoCMS rate limit errors during webhook** → unlikely with current
  chunking (20 parallel × 250 ms pause ≈ 80 req/sec inbound, but each URL
  triggers 1–3 GraphQL calls so the burst can briefly exceed 40 req/sec).
  Increase `CHUNK_PAUSE_MS` in `src/pages/api/revalidate/index.ts` if you see
  429 errors.
- **Need to revoke editor access** → rotate `SECRET_API_TOKEN`,
  `SIGNED_COOKIE_JWT_SECRET`, and `BYPASS_TOKEN`. Editors with old cookies
  immediately stop receiving drafts; the cookies are still set in their
  browser but no longer recognized.

### docs/guidelines/cms-data-loading.md
---
description: GraphQL data loading conventions and patterns for Multimage.
---

# CMS Data Loading

## Core helper: `executeQuery`

All GraphQL calls go through `src/lib/datocms/executeQuery.ts`. It wraps `@datocms/cda-client` and selects the correct token automatically:

```ts
import { executeQuery } from '~/lib/datocms/executeQuery';

const result = await executeQuery<MyQueryType>(MY_QUERY, {
  variables: { slug: 'my-slug' },
  includeDrafts: false,     // default false; true in preview mode
  excludeInvalid: true,     // default true
  environment: 'sandbox',   // optional; omit for default environment
});
```

Token selection:
- `includeDrafts: false` → `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`
- `includeDrafts: true` → `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` (required in preview deployments)

## Query colocation

Every page or component that fetches data keeps a sibling `_graphql.ts` that exports the query string and TypeScript helpers:

```
src/pages/libri/[slug]/
├── index.astro        ← consumes the query
└── _graphql.ts        ← exports query string, fragments, and typed helpers
```

Shared fragments (e.g. `ResponsiveImageFragment`, `BANNER_SECTION_FRAGMENT`) are defined once and re-exported from the component's `index.ts` to keep import sites tidy.

## Draft mode integration

In `.astro` files that support preview, resolve draft mode before executing queries:

```ts
import { resolveDraftMode } from '~/lib/draftPreview';

const { isEnabled: includeDrafts } = resolveDraftMode(Astro);
const data = await executeQuery(QUERY, { includeDrafts });
```

Draft mode is active per request, when the signed draft-mode cookie is present (ISR deployment, cache bypassed). Without the cookie, requests use published content.

## Pagination

There is currently no paginated loader. Routes like `/libri`, `/autori`, and `/sitemap.xml` use `first: 500` as a workaround. This is a known gap tracked as **CD2** in `docs/TODO.md`.

Until a paginated helper ships: keep `first: 500` and annotate it with `// TODO CD2`.

## Fragment conventions

- Name fragments after their owning component: `BookCardFragment`, `AuthorCardFragment`
- Place fragments in the component's `_graphql.ts` or `index.ts`
- Compose fragments at the page-level `_graphql.ts`
- Never duplicate field selections — always reference the fragment
- Never include fields ending in `_private`

## Error handling

`executeQuery` propagates errors from `@datocms/cda-client`. Failures fail the request during the per-request render (desired — fail fast), surfacing as Astro error pages. Nothing is rendered at build time (ISR).

## Type generation

Types come from `schema.ts`, managed by `npm run generate-schema`. Import CMS types from `~/lib/datocms/types`. Never write CMS types by hand.

## Cache tags (not implemented)

Not implemented: revalidation is URL-based, see `docs/guidelines/caching.md`.

Original plan:

Cache tag propagation is not yet implemented. Tracked as **CD3** in `docs/TODO.md`.

### docs/guidelines/security.md
---
description: Track security risks, mitigations, and review checkpoints for Multimage.
---

# Security Overview

## Critical Findings

- **Rich-text XSS (CWE-79)** — `toRichTextHtml` returns raw CMS HTML and multiple templates bind the result with `set:html`, so any editor-provided `<script>` executes for visitors. Harden `src/lib/text.ts:65-95`, audit `src/pages/index.astro:345-355`, `src/components/SupplierCard/index.astro:71-139`, and `src/pages/autori/[slug]/index.astro:138-158` to use Structured Text renderers or sanitize output.
- **Catalog data exposure (CWE-200)** — _Resolved 2026-05-31 (S1)._ Internal routes (`/staff`, `/staff/archivio-catalogo`, `/libri/schede/*`) are gated centrally in `src/middleware.ts`: a request without the editor session (the signed draft-mode JWT cookie) gets a flat `404` before any render, so the public never learns the paths exist nor receives inventory/CSV data. Enforcement is single-point — pages no longer guard themselves. The bearer-token model fits the sensitivity (stock/circulation business data, not PII); see `docs/decisions-log/2026-05-31-editor-session-gating.md`.

## High-Priority Gaps

- **Preview tokens rotation** — `/api/preview` and `/api/draft-mode/*` now enforce `SECRET_API_TOKEN` and drop signed cookies before toggling Draft Mode. Keep the CDA draft token and secrets rotated across Vercel environments so a leaked URL cannot grant long-term preview access.
- **Unbounded CSV export** — The staff CSV button currently serializes the full catalogue on the client (`src/pages/staff/archivio-catalogo/index.astro:200-317`). Even after the page is secured, validate user roles and strip fields that should never leave the CMS.

## Additional Observations

- **Third-party scripts** — Google Analytics, Iubenda, and Vercel analytics are injected inline in `src/layouts/BaseLayout.astro:132-210` with no integrity hints. Load them with `async`/`defer`, monitor outages, and keep the snippet list minimal.
- **LLM export** — the `/llms-full.txt` route was removed (2026-06-20), closing **S4**: the full catalogue + long-form bios/emails are no longer published in plaintext to anonymous visitors.
- **DatoCMS client errors (S5 still open)** — since V5 the CMA `authorization` header is redacted in a CMA `ApiError` and a CDA error's options no longer serialize, but `handleUnexpectedError` (`src/pages/api/utils.ts`) still returns a CMA error's `request.body` to the caller, so a `/api/post-deploy` 500 can carry `SECRET_API_TOKEN` (in `previewWebhook`/`htmlGeneratorUrl`).
- **Environment documentation** — `.env.example` only mentions the published CDA token; document draft/CMA tokens separately so engineers do not reuse privileged keys accidentally.
- **Search token scoping** — Ensure `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` is created with a Site Search–only role. Admin/CMA tokens must never be exposed because the value ships to the browser (`src/pages/cerca/index.astro:6-78`).

---

## Environment Variables Audit (2026-05-16)

### Matrix

| Variable | Astro context | Astro access | Optional? | Ships to client? | Used in | Vercel must have |
|---|---|---|---|---|---|---|
| `SERVER` | server | public | yes | no | `src/lib/draftPreview.ts`, `src/lib/prerender.ts` (build-time selector "static"/"preview") | yes — set per env |
| `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` | server | secret | no | no | `src/lib/datocms/executeQuery.ts` | yes |
| `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` | server | secret | no | no | `executeQuery.ts`, `DraftModeQueryListener` | yes (preview env) |
| `DATOCMS_CMA_TOKEN` | server | secret | yes | no | `src/pages/api/seo-analysis/index.ts` (runtime), `src/lib/datocms/siteSearch.ts` (via `/api/revalidate` and `/api/invalidate-cache`) | only if seo-analysis enabled |
| `SECRET_API_TOKEN` | server | secret | no | no | `post-deploy`, `preview`, `preview-links`, `seo-analysis`, `draft-mode/enable` | yes |
| `SIGNED_COOKIE_JWT_SECRET` | server | secret | no | no | `src/lib/draftMode.ts` | yes |
| `DRAFT_MODE_COOKIE_NAME` | server | secret | yes | no | `src/lib/draftMode.ts` | optional |
| `CACHE_INVALIDATION_WEBHOOK_SECRET` | server | secret | yes | no | `src/pages/api/invalidate-cache/index.ts` (Bearer) | no (Cloudflare Worker secret) |
| `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` | client | public | no | **YES** | `src/pages/cerca/index.astro` (via `import.meta.env`), search bundle | yes |
| `PUBLIC_SITE_URL` | client | public | no | **YES** | BaseLayout canonical, sitemap, `post-deploy` | yes |
| `DATOCMS_API_TOKEN` | — (not declared) | — | — | no | only `scripts/sync-datocms.mjs` (local dev) | **NO — dead weight on Vercel** |

### Findings

1. **`DATOCMS_API_TOKEN` su Vercel non viene letto a runtime.** Lo script `sync-datocms.mjs` gira solo da `npm run dev`/`start` (locale), non da `npm run build`. Tenerlo su Vercel è solo superficie d'attacco senza utilità. → **Action**: rimuovere da tutti gli env Vercel.
2. **6 secret su Vercel sono "Needs Attention"** (non cifrati at-rest nel dashboard team): `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `DATOCMS_API_TOKEN` (verrà eliminato), `DATOCMS_CMA_TOKEN` (se presente). → **Action**: migrare a tipo *Sensitive*.
3. **`PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` scope da verificare.** Il token finisce nel bundle JS del browser (`src/pages/cerca/index.astro:11` via `import.meta.env`) ed è quindi leggibile da chiunque. Deve essere un token DatoCMS con **solo il ruolo "Site Search"** (read-only sull'endpoint `/search-results`). Se ha permessi più ampi (CDA published, CDA draft, CMA) è una **leak severa**.
4. **`PUBLIC_SITE_URL` è safe** — è solo `https://www.multimage.org`, nessun problema a esporlo al browser.

### Vercel: migrazione a "Sensitive"

Per ogni secret marcato "Needs Attention", da fare via dashboard (richiede manual action — non automatizzabile via API senza CLI auth):

1. Apri Project Settings → Environment Variables
2. Clicca la variabile → "Edit"
3. Cambia il tipo da "Plain text" a **"Sensitive"** (encrypted at-rest)
4. Salva — il valore resta lo stesso, non serve rotazione
5. Conferma che il badge "Needs Attention" sparisce

**Ordine consigliato** (più sensibili prima):
1. `SIGNED_COOKIE_JWT_SECRET` (controlla draft mode auth)
2. `SECRET_API_TOKEN` (gatekeeper API routes)
3. `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` (legge contenuti draft)
4. `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` (legge contenuti pubblicati)
5. `DATOCMS_CMA_TOKEN` (se presente — accesso CMA full)
6. **Elimina** `DATOCMS_API_TOKEN` da Vercel (non serve)

**Rotazione**: non necessaria salvo sospetto compromissione. Migrare a Sensitive **conserva lo stesso valore** — la cifratura at-rest è la sola differenza.

### Verifica `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`

Da fare su DatoCMS:

1. Vai su Project settings → API tokens
2. Trova il token usato come `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`
3. Verifica:
   - Role: **"Site Search"** (built-in role)
   - Permissions: solo `Use the Site Search API`
   - NON deve avere accesso a CDA, CMA, o altri endpoint
4. Se il token ha permessi più ampi → creare un nuovo token "Site Search" only, sostituire su Vercel, eliminare quello vecchio

### Public env vars: review

Le sole variabili che finiscono nel bundle browser (per dichiarazione `context: 'client'` o uso via `import.meta.env`):

- `PUBLIC_SITE_URL` — safe (URL pubblico)
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` — safe **solo se scope verificato come Site Search-only** (vedi sopra)

Nessun secret è accidentalmente prefissato `PUBLIC_*` in `astro.config.mjs`. ✅

## Project lenses
none

## Preset rules
## Preset rules — astro
1. Pages are static by default; opt a route out with `export const prerender = false` only when its data is per request (session, query string, preview), because static output is the cheapest and most cacheable.
2. Set `output` once in `astro.config.*` and keep it; do not mix per-route overrides in both directions.
5. Content comes through typed queries, never untyped `fetch` in a page.
6. Declare environment variables with `astro:env` (`envField`, context `server`, access `secret`); `import.meta.env` is replaced at build, so it cannot supply runtime secrets on SSR routes. Only `PUBLIC_` variables may reach client code.
11. Unknown paths hit a real 404 page, because a silent empty page returns 200.
12. Take adapters and hosting limits (bundle size, build time, route count) into account, because the host fails the deploy, not the build.
(Rules 3, 4, 7, 8, 9, 10 concern islands, images, locales, client scripts, sitemap: see flow:stack-astro.)

## Preset rules — datocms
6. Pass the environment to every client explicitly, from a variable the app reads, and keep production reads on the primary.
7. Keep the CMA token and the draft read token server-side and out of git.
9. Query types come from the schema and are checked in CI.
10. Treat optional and localized fields as nullable in the code.
(Rules on CLI, migrations and naming do not apply: this work changes no schema.)

