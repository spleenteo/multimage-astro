---
scope: How to manage draft preview, Visual Editing, and on-demand cache invalidation for editors
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
                          → enumerates all public URLs
                          → fetches each with x-prerender-revalidate header
                          → CDN regenerates + recaches
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
| `DATOCMS_BASE_EDITING_URL` | yes for Visual Editing | Format `https://{project-slug}.admin.datocms.com/environments/{environment-name}`. Used by Content Link to construct edit-URLs. |
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
`src/middleware.ts` adds `Content-Security-Policy: frame-ancestors 'self'
https://plugins-cdn.datocms.com` to draft-mode responses only.

## 6. On-demand cache invalidation (webhook)

DatoCMS publish → webhook → `POST /api/revalidate?token=<SECRET_API_TOKEN>`.

The endpoint:

1. Validates the secret.
2. Debounces if invoked less than 5 seconds ago (idempotent burst protection).
3. Calls `getAllPublicUrls()` from `src/lib/datocms/publicUrls.ts` to enumerate
   ~900–1100 URLs (records via CDA + hard-coded statics).
4. Fetches each URL with `x-prerender-revalidate: <BYPASS_TOKEN>` in chunks of
   20 in parallel, with a 250 ms pause between chunks (stays under the DatoCMS
   40 req/sec rate limit during cascading regeneration).
5. Logs total/success/failures and elapsed time to `vercel logs`.

Expected completion: ~30–45 s per webhook for the current catalogue size.

### Configuring the DatoCMS webhook

1. DatoCMS → Settings → Webhooks → New webhook.
2. URL: `https://www.multimage.org/api/revalidate?token=<SECRET_API_TOKEN>`.
3. Events: every publish, unpublish, update (record + content management).
4. Save.

## 7. Local development

`npm run dev` runs `astro dev`. ISR caching is a Vercel CDN feature, not active
locally — every request is SSR'd. Draft mode works via the JWT cookie (visit
`/api/preview?secret=...&redirect=/`). Content Link works locally if
`DATOCMS_BASE_EDITING_URL` is set in `.env`.

`/api/revalidate` works locally but the `fetch` calls hit `PUBLIC_SITE_URL`
(production), so it's effectively a no-op for local testing unless you point
`PUBLIC_SITE_URL` at a tunnel.

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
  set. Without it `executeQuery` skips Content Link opts (`contentLink: 'v1'`
  is still set, but the CDA needs the base URL to encode edit-URLs).
- **Iframe in DatoCMS "Visual" tab won't load** → check response headers for
  `Content-Security-Policy: frame-ancestors ...`. If absent on a page where
  draft mode is supposed to be active, double-check `isDraftModeEnabled` is
  resolving to `true` (likely missing or invalid JWT cookie).
- **DatoCMS rate limit errors during webhook** → unlikely with current
  chunking (20 parallel × 250 ms pause ≈ 80 req/sec inbound, but each URL
  triggers 1–3 GraphQL calls so the burst can briefly exceed 40 req/sec).
  Increase `CHUNK_PAUSE_MS` in `src/pages/api/revalidate/index.ts` if you see
  429 errors.
- **Need to revoke editor access** → rotate `SECRET_API_TOKEN`,
  `SIGNED_COOKIE_JWT_SECRET`, and `BYPASS_TOKEN`. Editors with old cookies
  immediately stop receiving drafts; the cookies are still set in their
  browser but no longer recognized.
