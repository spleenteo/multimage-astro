# 2026-06-20 — Reduce Vercel Fast Origin Transfer (FOT)

## Context

The site runs on Vercel's **Hobby** plan. The binding quota is **Fast Origin
Transfer** — bytes moving from serverless compute (function render) to the CDN —
capped at **10 GB / period**. We were at ~7.5 GB with `multimage-astro` alone
responsible for 96.4%. ISR works correctly (`x-vercel-cache: HIT`; normal
anonymous traffic serves from cache and generates no FOT). Images are served by
DatoCMS/Imgix straight to the browser and never touch Vercel compute, so they
are irrelevant to FOT.

Two confirmed drivers, plus one amplifier:

1. **Spikes — blanket revalidation on every publish.** `/api/revalidate` called
   `getAllPublicUrls()` (~670 URLs from the sitemap) and re-fetched every one
   with the prerender-bypass header on **every** webhook call, ignoring the
   payload. One record publish re-rendered the whole site (~67 MB FOT). The
   in-memory `lastRunAt` debounce is ineffective on serverless (each invocation
   can hit a fresh lambda).
2. **Baseline — short ISR TTL.** `isr.expiration` was 7 days, so the whole
   surface served `STALE` and re-rendered in the background roughly weekly even
   with zero publishes.
3. **Amplifier — heavy `/libri`.** ~1.04 MB of HTML: 340 book cards on a single
   un-paginated page (`allBooks(first: 500)`), 6-candidate srcsets (~277 KB) and
   base64 LQIP placeholders (~171 KB). Every render shipped ~1 MB of FOT.

## Decision

Cut FOT without leaving SSR, without a static/SSR split, and without changing
the editorial workflow (editors keep publishing in DatoCMS).

### 1. Surgical revalidation (kills the spikes)

`/api/revalidate` now parses the DatoCMS webhook payload (payload API v3) and
revalidates **only the URLs affected by the changed record**.

- Payload parsing lives in `src/lib/datocms/webhookPayload.ts` (pure, unit
  tested): reads `event_type`, the record `slug` from `entity.attributes.slug`,
  and the model `api_key` from `related_entities` (the item_type sideloaded and
  referenced via `entity.relationships.item_type.data.id`).
- `src/lib/datocms/revalidationUrls.ts` maps `api_key + slug → string[]`. The
  api_key → route mapping mirrors `recordToWebsiteRoute` in `recordInfo.ts`
  (keep them in sync). Per model:
  - **book** → `/libri/<slug>`, the full set of catalogue pages (`/libri` +
    `/libri/pagina/2..N`), `/libri/ebooks`, `/libri/highlights`,
    `/libri/archivio`, `/`, `/sitemap.xml`, **plus** the detail pages that list
    the book: each author's `/autori/<slug>` and the collection's
    `/collane/<slug>`. The catalogue page count and the related author/collection
    slugs come from one enrichment query (`BOOK_CONTEXT_QUERY`). Bounded to
    ~12–20 URLs.
  - **author / collection / blog_post / page** → own detail URL + its index +
    `/sitemap.xml` (author/collection/blog_post; `/` only for book).
  - **singletons / index records** (`home`, `books_index`, `archive_index`,
    `highlights_index`, `ebooks_index`, `collections_index`, `authors_index`,
    `magazine_index`) → their index URL + `/sitemap.xml`.
  - **unknown api_key / missing slug** → empty set → endpoint **no-ops** (logs
    and returns 200, never re-renders the site).
- `?mode=full` still runs the whole-surface sweep via `getAllPublicUrls()` for
  manual maintenance / emergencies.
- The auth-token check is unchanged. The ineffective in-memory debounce was
  **removed**: with surgical revalidation each call is cheap and idempotent, and
  a debounce would wrongly drop a second distinct record published within the
  window.

**Decision — revalidate authors' and collections' pages on book change: YES.**
A book add/remove/rename changes the author and collection detail pages that
list it, so we enrich the book event with one extra CDA query to fetch those
slugs and revalidate them. The alternative (static set only, let those pages go
stale until their own publish or the TTL) was rejected by the owner in favour of
correctness; the cost is one bounded query + a handful of extra URLs per book
publish, still far from the old ~670.

Target met: a single-record publish revalidates ~12–20 URLs instead of ~670.

### 2. Longer ISR TTL (kills the baseline)

`isr.expiration` raised from **7 days → 60 days**. Freshness is handled
on-demand by the webhook; the TTL is only a safety net for a missed/failed
webhook. A short TTL was pure waste — it re-rendered the whole surface ~weekly
for unchanged content. Force a full refresh anytime with a build or
`POST /api/revalidate?mode=full`.

### 3. Lighter card grids + paginated `/libri` (cuts per-render cost)

- **3a/3b — lean card images.** New `RESPONSIVE_IMAGE_CARD_FIELDS` in
  `commonFragments.ts` — a shared raw-field selection (not a named fragment, to
  avoid GraphQL unused/unknown-fragment errors across mixed queries) that omits
  `base64` and `srcSet`. Card fragments (`BookCard`, `AuthorCard`,
  `CollectionCard`) and the inline card images on `/autori` and `/magazine` use
  it; the now-unused `RESPONSIVE_IMAGE_FRAGMENT` interpolation was removed from
  the card-only queries. Card `<Image>` components pass `srcSetCandidates={[1, 2]}`
  so `@datocms/astro` rebuilds a 2-candidate srcset client-side (1x at w:520 +
  2x via `dpr=2`) instead of the 6 DatoCMS returns. The flat `bgColor`
  placeholder the cards already render replaces the base64 blur-up.
  `RESPONSIVE_IMAGE_FRAGMENT` (with base64 + srcSet) is kept for hero/detail
  images where the blur-up is wanted.
- **3c — paginate the catalogue.** `allBooks` on `/libri` now uses
  `first/skip` variables with `_allBooksMeta` for the total count.

  **Routing shape:** page 1 stays canonical at `/libri`; pages 2..N live at
  `/libri/pagina/<n>` (path-based, not query strings, so each page is an
  independent ISR cache key). `/libri/pagina/1` 301-redirects to `/libri`;
  non-numeric or out-of-range pages return a real 404. 40 books/page → ~9 pages.
  This dedicated `pagina/` segment avoids any collision with `/libri/[slug]`
  (book detail).

  `BOOKS_PER_PAGE` + `buildBooksCataloguePaths()` live in `src/lib/books.ts` as
  the single source of truth shared by the route, the sitemap, the
  full-revalidation list and the surgical revalidation map. The paginated pages
  are emitted in `sitemap.xml` and revalidated on every book publish (a book
  add/remove shifts content across all catalogue pages).

  Shared rendering: `BooksCatalogSection` + generic `Pagination` components, used
  by both `/libri` and `/libri/pagina/[page]`.

### 4. Remove `/llms-full.txt`

The 866 KB plaintext export was barely crawled (served `STALE`, `age ~7.43 d`).
Owner confirmed removal. The route (`src/pages/llms-full.txt.ts` +
`src/pages/llms-full/`) and its `STATIC_URLS` entry are deleted. This also closes
security gap **S4** (it exposed the full catalogue + biographies to anonymous
visitors).

## DatoCMS webhook configuration this expects

The existing webhook (id `33942`, created during the ISR cutover) already targets
this endpoint. Required configuration:

- **URL:** `https://www.multimage.org/api/revalidate?token=<SECRET_API_TOKEN>`
  (POST). Do **not** add `?mode=full` — that forces a whole-site sweep.
- **Trigger:** *Specific event* on **records (items)**.
- **Events:** **publish** and **unpublish** (add **delete** if removed records
  should drop their detail page immediately; on delete the payload still carries
  `entity.attributes.slug`). Avoid create/update (draft saves) — they would call
  the endpoint without changing published output.
- **Models:** all models that back a public URL — `book`, `author`,
  `collection`, `blog_post`, `page`, and the singleton/index models (`home`,
  `books_index`, `archive_index`, `highlights_index`, `ebooks_index`,
  `collections_index`, `authors_index`, `magazine_index`). Any other model
  no-ops safely.
- **Payload:** default JSON, **payload API version `3`**,
  `nested_items_in_payload: false`. The endpoint consumes `event_type`,
  `entity.attributes.slug`, `entity.relationships.item_type.data.id`, and
  `related_entities[].attributes.api_key`.

## Verification

- `npm run build` + `astro check`: clean (0 errors).
- Webhook parser: 13 unit assertions pass (publish/unpublish/singleton/empty/
  null/missing-related/id-mismatch + catalogue path math) via `tsx`.
- Local dev smoke (unminified HTML):
  - `/libri` page 1: **321 KB** (was ~1.04 MB), **0** base64, srcset = 2
    candidates, pagination present (9 pages).
  - `/libri/pagina/2` 200 (40 cards), `/libri/pagina/9` 200, `/libri/pagina/999`
    & `/libri/pagina/abc` → 404, `/libri/pagina/1` → 301 `/libri`.
  - `/autori`, `/collane`, `/magazine`: 200, 0 base64.
  - Book detail page: base64 blur-up preserved (hero/detail still uses the full
    fragment).
  - `/sitemap.xml`: includes `/libri/pagina/2..9`. `/llms-full.txt` → 404.
  - `/api/revalidate` with a wrong token → 401; OPTIONS → 204.
- **Production-only check (run post-deploy):** the surgical fetch loop targets
  `PUBLIC_SITE_URL` (production) and needs `BYPASS_TOKEN` (unset locally), so it
  was not exercised locally to avoid hitting prod. Confirm with a real publish or:
  `curl -s -X POST "https://www.multimage.org/api/revalidate?token=<SECRET_API_TOKEN>" -H 'Content-Type: application/json' -d @sample-publish.json | jq .urls`
  — the JSON response echoes the exact `urls` revalidated (expect ~12–20 for a
  book, not ~670).

## Expected impact

Items 1 + 2 alone remove both the per-publish spikes and the weekly baseline
re-render, which together accounted for essentially all of `multimage-astro`'s
FOT — comfortably under the 10 GB cap. Item 3 (cards + pagination) cuts the
per-render cost of the heaviest page by ~3–6× as defence in depth.

## Follow-ups

- Relates to **CD2** (replace `first: 500` with paginated loaders): `/libri` and
  the sitemap catalogue pages are now paginated; `/autori`, staff exports and the
  remaining `first: 500` reads are still pending.
- Relates to **CD3** (cache-tag plumbing): surgical revalidation achieves the
  "revalidate only touched pages" goal via a URL map rather than DatoCMS cache
  tags. CD3 (true cache tags) remains a cleaner long-term option.
