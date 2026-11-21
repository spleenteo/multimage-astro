---
description: How to manage draft preview, Visual Editing, and on-demand cache invalidation for editors
---

# Preview, Draft Mode & Visual Editing

Multimage runs as a **single Astro project** with `output: 'server'`, on two
targets: **Vercel** with ISR (Incremental Static Regeneration) today, and
**Cloudflare Workers** with Workers Cache on branch `chore/cloudflare` (switch
procedure: `docs/guidelines/cloudflare-switch.md`). On both, anonymous visitors
get cached responses (effectively static); editors with the draft cookie bypass
the cache and see live draft content with click-to-edit overlays. Sections
marked **Vercel** or **Cloudflare** apply to one target only.

Le architetture precedenti (due progetti Vercel separati con `SERVER=static` e
`SERVER=preview`) sono state ritirate il 2026-05-17 con la shape
`2026-05-16-unify-projects-isr.md`.

## 1. Architecture overview

### Vercel (production today)

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

### Cloudflare (branch `chore/cloudflare`)

```
Anonymous visitor → gateway (src/worker.ts, cache off)
                  → Backend (cache on): Workers Cache HIT → cached page
                                        MISS → Astro render, tagged, stored

Editor (draft cookie) → gateway sees the cookie (name rule below)
                      → forwards with cache: 'no-store'
                      → middleware also calls cache.set(false)
                      → Cache-Control: private, no-store (never stored)
                      → executeQuery uses draft token + contentLink:'v1'

DatoCMS publish → cda_cache_tags webhook (event `invalidate`, Bearer
                  CACHE_INVALIDATION_WEBHOOK_SECRET)
                → POST /api/invalidate-cache
                → purge by tag in Backend (cache.purge)
                → Site Search reindex (DATOCMS_CMA_TOKEN +
                  SITE_SEARCH_BUILD_TRIGGER_ID)
```

Draft HTML carries the draft CDA token (`DraftModeQueryListener`), so a stored
draft render would leak it: the bypass is double, gateway `no-store` plus the
middleware's `cache.set(false)`. The gateway reads the cookie name with the same
rule as `src/lib/draftMode.ts` (`env.DRAFT_MODE_COOKIE_NAME?.trim() ||
'multimage_draft_mode'`, `src/worker.ts`). Details and the route policy:
`docs/guidelines/caching.md`.

### Cookies that drive draft mode (dual-cookie pattern on Vercel)

When `/api/draft-mode/enable` runs, the app sets the app-level cookie, plus on
Vercel a second one:

| Cookie | Role | Value |
| --- | --- | --- |
| `multimage_draft_mode` (configurable via `DRAFT_MODE_COOKIE_NAME`) | App-level auth. The site reads this to know the editor is authenticated and to switch to the draft CDA token. | Signed JWT (`SIGNED_COOKIE_JWT_SECRET`) with payload `{ enabled: true }`. |
| `__prerender_bypass` (**Vercel only**) | CDN-level cache bypass. Vercel recognizes this cookie name natively and forces the request to bypass the ISR cache. Only set when `BYPASS_TOKEN` exists, so never on the Worker. | Plain opaque token equal to `BYPASS_TOKEN`. |

On Vercel both cookies are required; on Cloudflare the app-level cookie alone
drives the bypass. The disable endpoint deletes both. Both are `SameSite=None;
Secure; Partitioned`, 30 days.

## 2. Required environment variables

Set every variable in this table both locally (`.env`) and on the deploy target:
Vercel for every environment (Production / Preview), or Worker secrets on
Cloudflare (`wrangler secret put`, see `docs/guidelines/security.md`).

| Variable | Required | Notes |
| --- | --- | --- |
| `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` | yes | Published-only CDA token. |
| `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` | yes | Draft-only CDA token (must include "Access in Preview Mode"). |
| `DATOCMS_CMA_TOKEN` | optional | CMA token for `/api/seo-analysis` and the Site Search reindex. |
| `SECRET_API_TOKEN` | yes | Shared secret for `/api/preview`, `/api/draft-mode/enable`, `/api/preview-links`, `/api/revalidate`. |
| `SIGNED_COOKIE_JWT_SECRET` | yes | Random string used to sign the draft JWT cookie (`openssl rand -hex 32`). |
| `DRAFT_MODE_COOKIE_NAME` | optional | Defaults to `multimage_draft_mode`. |
| `BYPASS_TOKEN` | yes on Vercel, **Vercel only** (not set on the Worker) | Opaque token used both as the `__prerender_bypass` cookie value (Draft Mode) and as the `x-prerender-revalidate` header (on-demand ISR via `/api/revalidate`). Generate with `openssl rand -hex 32`. |
| `DATOCMS_BASE_EDITING_URL` | yes for Visual Editing | **Bare admin URL with no `/environments/...` suffix**: `https://multimage.admin.datocms.com`. Used by Content Link to construct edit-URLs. ⚠️ Appending `/environments/main` (even though `main` *is* the primary) makes the stega edit-URLs take the *sandbox* form, and the plugin then reports "Environment Mismatch Detected" — the sandbox URL shape doesn't match a primary-environment editing session. Only append `/environments/<name>` when targeting a genuine non-primary sandbox. |
| `CACHE_INVALIDATION_WEBHOOK_SECRET` | Cloudflare only | Bearer secret of the `cda_cache_tags` webhook calling `/api/invalidate-cache`. Lives on the Worker and in the DatoCMS webhook header, nowhere else. |
| `SITE_SEARCH_BUILD_TRIGGER_ID` | optional | Site Search build trigger (`37696`) reindexed after a publish; with `DATOCMS_CMA_TOKEN` or it is a no-op. Set on switch day on Cloudflare. |
| `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` | yes | Site Search token (ships to the browser — must be read-only Site Search scope). |
| `PUBLIC_SITE_URL` | yes | Site origin without trailing slash. |

The `SERVER` env var has been **removed**. Do not set it anywhere.

## 3. Draft mode flow

Editors enter preview through one of:

- The **DatoCMS Web Previews** plugin sidebar in DatoCMS — clicks "Draft version".
  The plugin hits `/api/preview-links?token=...` (no manual setup beyond
  installing the plugin via `/api/post-deploy`). Each preview link goes through
  `/api/draft-mode/enable?url=<recordUrl>&token=...` so both cookies are
  set, then redirects to the record page.
- A direct call to `/api/preview?secret=<SECRET_API_TOKEN>&redirect=/percorso`
  (useful for manual smoke tests).

Exiting preview is automatic when the plugin emits a "Published version" link
(it calls `/api/draft-mode/disable`). Manual exit:
`/api/draft-mode/disable?url=/percorso`. The `enable` and `disable` endpoints
read `url=` only; `/api/preview` accepts `redirect=`, `url=` or `path=`.

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

On **Cloudflare** invalidation is by cache tag: the `cda_cache_tags` webhook
calls `/api/invalidate-cache`, which purges the tagged entries and reindexes Site
Search (diagram in § 1, procedure in `docs/guidelines/caching.md`). The rest of
this section describes the **Vercel** URL-based webhook (`/api/revalidate`),
which is disabled at the switch.

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
whole site (`?mode=full` is a manual fallback only). On Vercel revalidation is
URL-based; cache tags exist only on the Cloudflare target. See `docs/guidelines/caching.md` for the
route-to-model audit and the verification procedure.

To recreate it via CLI: `npx datocms cma:call webhooks create --data='{...}'`
with the events above (see the shape doc for the full payload).

## 7. Local development

`npm run dev` runs `astro dev`. ISR caching (Vercel) and Workers Cache
(Cloudflare) are not active locally — every request is SSR'd. Draft mode works via the JWT cookie (visit
`/api/preview?secret=...&redirect=/`). Content Link works locally if
`DATOCMS_BASE_EDITING_URL` is set in `.env`.

`/api/revalidate` works locally but the `fetch` calls hit `PUBLIC_SITE_URL`
(production). Never call it locally without overriding the environment; follow
procedure (b) in `docs/guidelines/caching.md`.

## 8. Troubleshooting

- **Editor sees published content despite cookies (Vercel)** → check both
  cookies are set in DevTools → Application → Cookies (the JWT cookie *and*
  `__prerender_bypass`). If only the JWT is set, `BYPASS_TOKEN` is probably
  missing from Vercel env, so `enableDraftMode` skipped setting the bypass
  cookie. The CDN serves the cached published response.
- **Editor sees published content despite the cookie (Cloudflare)** → the
  gateway looks for the cookie by name (`DRAFT_MODE_COOKIE_NAME`, default
  `multimage_draft_mode`, rule in `src/worker.ts`). If the Worker secret
  `DRAFT_MODE_COOKIE_NAME` differs from the name the cookie was set with, the
  gateway does not see it and serves the shared copy. The name on the Worker must
  match the one the app sets.
- **`/api/seo-analysis` on Cloudflare** → checked on the trial Worker
  (2026-11-21): 401 with a wrong token; with the signed token it answers 500
  `DATOCMS_CMA_TOKEN is not configured on this environment.` (the route and
  `linkedom` load on the Worker; no CMA token is set there by rule). The full
  render, which fetches its own host, is not tested: on `workers.dev` a Worker
  fetching itself is expected to fail. It is checked on www after the custom
  domains (step 9 of `docs/guidelines/cloudflare-switch.md`), with the Backend
  patch (fetch through `locals.cfContext.exports.Backend`, `cache: 'no-store'`)
  as the fix if it fails.
- **`/api/revalidate` returns 500 (Vercel) "BYPASS_TOKEN not configured"** → set
  `BYPASS_TOKEN` on Vercel (and re-deploy so the adapter picks it up).
- **Webhook fires but pages don't update (Vercel)** → check `vercel logs` for the
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
  `SIGNED_COOKIE_JWT_SECRET`, and `BYPASS_TOKEN` (Vercel only). Editors with old cookies
  immediately stop receiving drafts; the cookies are still set in their
  browser but no longer recognized.
