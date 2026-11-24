---
description: How to implement search offered by DatoCMS
---

# Search

DatoCMS Site Search powers `/cerca`. The page is fully client-driven but depends on two build-time artefacts, so any change touches both Astro and Node layers.

## Indexing & content sources
- The Site Search index is configured entirely inside Dato. Flag **Book**, **Author**, **Page**, and **BlogPost** models as indexable; staff-only routes (`/staff`, `/libri/schede/*`) stay out of the index on purpose.
- The site chrome is out of the index: `data-datocms-noindex` sits on the header, the skip link, the newsletter band and the footer, so excerpts quote the page and not the menu. It takes effect after the next crawl of the deployed site.
- Each record contributes `title`, `body_excerpt`, and optional `[h]...[/h]` highlight ranges. The browser parses those markers (see `appendHighlightedText`) and renders `<mark>` tags.
- The index is re-spidered **once a day**: on Cloudflare, once a day by the gateway Worker's Cron Trigger (`scheduled` in `src/worker.ts`, `0 2 * * *` UTC in `wrangler.jsonc`), which calls the CMA `build-triggers/<SITE_SEARCH_BUILD_TRIGGER_ID>/reindex` with `DATOCMS_CMA_TOKEN` — a re-crawl with no rebuild, at night, on a warm cache. Publishing no longer triggers it (see `caching.md`), so new content appears in the search within a day. `robots.txt` keeps the crawler off the catalogue filters (`Disallow: /libri?`). On Vercel (no traffic) `/api/revalidate` still reindexes on publish. Requires `DATOCMS_CMA_TOKEN` + `SITE_SEARCH_BUILD_TRIGGER_ID` (`37696`). See `docs/guidelines/preview-mode.md` §6. Manual fallback: **Settings → Site Search → Regenerate index** in Dato, or a manual Vercel build.
- Requests go straight to `https://site-api.datocms.com/search-results` from the browser. There is no proxy, so rate limiting and ACLs must be enforced via the dedicated Site Search API token.

## Architecture
1. `scripts/build-search-client.mjs` bundles `src/pages/cerca/search-page.client.ts` into `public/generated/search-page.client.js`. The script also emits `public/generated/swiper-element.js` for `BookCarouselSection` so `npm run prebuild` remains a single source of truth.
2. `src/pages/cerca/index.astro` prerenders a semantic search form (role="search", status region, filters). Styles live in `src/pages/cerca/_search.css` (imported globally so dynamically-created result cards pick them up). At runtime it loads the bundled module (or the source file during `astro dev`) and forwards configuration via `data-*` attributes: endpoint, token, min-length, limit, fuzzy toggle.
3. The client bundle registers listeners (`submit`, `input`, history `popstate`, filter toggles, exact-match checkbox). It debounces keystrokes, updates the URL (`?q=...&exact=1`), and uses `AbortController` to cancel in-flight fetches.
4. All requests hit `https://site-api.datocms.com/search-results` directly from the browser with `Authorization: Bearer <PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN>`. No proxy route exists, so rate limiting and token secrecy rely on Dato’s role system.

## Build & deployment notes
- Run `npm run prebuild` (or `npm run bundle-search-client`) before `astro dev` and definitely before `astro build`/Vercel deployments. Missing bundles result in `<script src="/generated/...">` 404s.
- The bundle targets evergreen browsers (`target: 'es2019'`) and ships no polyfills. If you add dependencies, confirm they tree-shake down or they will bloat the 0-dependency client we have today.
- Dev mode imports the TypeScript entry (`/src/pages/cerca/search-page.client.ts`) via Vite so HMR works. Do not rely on path-based feature flags; the runtime decides which script to load.

## Runtime behavior
- Minimum query length defaults to 3 characters (`MIN_QUERY_LENGTH` constant). The bundle enforces it, clears results otherwise, and updates the status live region with Italian guidance.
- Results are typed by URL (`kindOf`):
  - `/libri/<slug>` → book;
  - `/libri`, `/libri/pagina/…`, `/libri/archivio` → catalogue;
  - `/autori/<slug>` → author;
  - `/magazine/<slug>` → article;
  - `/collane/<slug>` → collection;
  - anything else → page.

  The filter toggles are `books`, `authors`, `magazine` and `other` (collections, catalogue and pages).
- Book details come from `/search-books.json` (`src/pages/search-books.json.ts`): every published book keyed by slug, with title, authors, year, format (not paper), price, archived flag, cover URL, cover ratio and the pale cover-field colour. It is about 21 KB gzipped, cached like `/archived-books.json`, and loaded once, after the first search that returns a book. It drives the cover and meta line, hides archived books, and merges a print and an ebook edition (same title and authors) into one row ("Anche in ebook · 2,99 €").
- The “Ricerca esatta” checkbox toggles a local `exactMatch` flag; when enabled, results are re-filtered client-side through `entryContainsPhrase` before rendering. Otherwise the request uses Dato’s fuzzy search (`filter[fuzzy]=true`).
- Results render flat `<li>` rows (see DESIGN.md "Search"):
  - the cleaned title (SEO suffix " | Multimage Editrice" stripped) as the only link, stretched over the row;
  - one slate meta line (the type, or "di … · anno · formato · prezzo" for books);
  - the highlighted excerpt, clamped to 3 lines.

  `appendHighlightedText` safely escapes everything except the `[h]...[/h]` tokens returned by Site Search.
- The status reads the real total (`meta.total_count`: "321 risultati per “pace”: eccone 25, i più pertinenti."). "Mostra altri risultati" fetches the next page (`page[offset]`) and focuses the first new row. The status speaks once per search: while loading, the list only fades (`aria-busy`).
- Empty and zero-result states show "Oppure parti da qui" (catalogue, authors, collections, magazine, where to find the books). Without JavaScript a `<noscript>` line points to the same links. The server never reads `?q`: the Cloudflare cache key is the path only, so a server-filled field would be served to every query.
- URL state stays in sync via `window.history.replaceState` so sharing `/cerca?q=libro&exact=1` restores the view. The script also caches the most recent payload (`cachedResults`, `cachedQuery`, `cachedTotal`) and cleans up listeners on `astro:before-swap` to avoid memory leaks.

## Index health & drift
- Because types rely on URL patterns, extend `kindOf` when you ship a new section.
- Magazine posts have their own filter (`magazine`).
- After large content migrations, run “Regenerate index” and smoke-test `/cerca` in both dev and a deployed preview. Missing bundles, stale tokens, or index drift should be logged back in `docs/TODO.md` (Testing task **TC2** covers automated coverage for the bundle itself).

## Tokens & permissions
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` **must** belong to a Dato role that only has *Perform Site Search API calls*. Treat it as public but environment-specific; never reuse CDA/CMA tokens because this value is embedded into the HTML as a `data-token` attribute.
- `src/pages/cerca/index.astro` throws at build time if the token is missing. Surface this clearly in `.env.example`, Vercel, and deployment runbooks.
- `getRootConfig()` throws at runtime if `data-endpoint` or `data-token` are absent on `[data-search-root]`. The error is caught in `mountSearchPage`, logged to the console, and surfaced in the UI status region. This guards against silent misconfiguration in preview or staging builds.
- Rotate the token by updating envs **and** re-running `npm run prebuild` so the generated bundle in `public/generated` picks up the new value.

## Error handling & observability
- Network errors (including 401) bubble up to the UI via `setStatus(...)` so visitors see Italian fallback messaging. Abort errors are swallowed silently to avoid noisy logs during fast typing.
- We currently rely on `console.error` for debugging. If production insight is required, wire the handler into whatever logging/analytics platform we standardize on (see docs/TODO.md Testing/CI task **TC2** for coverage).

## Hardening checklist
- Sanitization: highlight snippets rely on `[h]` markers but still pass through `appendHighlightedText`. Keep validating the API payload and escape any markup that might be injected (ties into docs/guidelines/assets.md#html-fragments--sanitization).
- CSP/SRI: the bundle is loaded via `<script type="module" src="..." is:inline>`. When we introduce a CSP, add hashes for these modules (tracked in docs/TODO.md Security task **S3**).
- Monitoring: consider adding search analytics (queries, throttling, error rates) once we protect PII. For now, keep the `aria-live` messages accurate so support can reproduce user reports quickly.
