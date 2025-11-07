---
agent_edit: true
scope: How to implement search offered by DatoCMS
---

# Search

DatoCMS Site Search powers `/cerca`. The page is fully client-driven but depends on two build-time artefacts, so any change touches both Astro and Node layers.

## Architecture
1. `scripts/build-search-client.mjs` bundles `src/pages/cerca/search-page.client.ts` into `public/generated/search-page.client.js`. The script also emits `public/generated/swiper-element.js` for `BookCarouselSection` so `npm run prebuild` remains a single source of truth.
2. `src/pages/cerca/index.astro` prerenders a semantic search form (role="search", status region, filters). At runtime it loads the bundled module (or the source file during `astro dev`) and forwards configuration via `data-*` attributes: endpoint, token, min-length, limit, fuzzy toggle.
3. The client bundle registers listeners (`submit`, `input`, history `popstate`, filter toggles, exact-match checkbox). It debounces keystrokes, updates the URL (`?q=...&exact=1`), and uses `AbortController` to cancel in-flight fetches.
4. All requests hit `https://site-api.datocms.com/search-results` directly from the browser with `Authorization: Bearer <PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN>`. No proxy route exists, so rate limiting and token secrecy rely on Dato’s role system.

## Build & deployment notes
- Run `npm run prebuild` (or `npm run bundle-search-client`) before `astro dev` and definitely before `astro build`/Vercel deployments. Missing bundles result in `<script src="/generated/...">` 404s.
- The bundle targets evergreen browsers (`target: 'es2019'`) and ships no polyfills. If you add dependencies, confirm they tree-shake down or they will bloat the 0-dependency client we have today.
- Dev mode imports the TypeScript entry (`/src/pages/cerca/search-page.client.ts`) via Vite so HMR works. Do not rely on path-based feature flags; the runtime decides which script to load.

## Runtime behavior
- Minimum query length defaults to 3 characters (`MIN_QUERY_LENGTH` constant). The bundle enforces it, clears results otherwise, and updates the status live region with Italian guidance.
- Filters are simple checkboxes (`books`, `authors`, `info`). The script computes active filters on every render and hides list items that do not match. The “Ricerca esatta” checkbox toggles a local `exactMatch` flag; when enabled, results are re-filtered client-side through `entryContainsPhrase` before rendering.
- Results render `<li>` cards with badges, links, highlight `<mark>`s, and “Vai alla pagina” links. `appendHighlightedText` safely escapes everything except the `[h]...[/h]` tokens returned by Site Search.
- URL state stays in sync via `window.history.replaceState` so sharing `/cerca?q=libro&exact=1` restores the view. The script also cleans up listeners on `astro:before-swap` to avoid memory leaks.

## Tokens & permissions
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` **must** belong to a Dato role that only has *Perform Site Search API calls*. Treat it as public but environment-specific; never reuse CDA/CMA tokens because this value is embedded into the HTML as a `data-token` attribute.
- `src/pages/cerca/index.astro` throws at build time if the token is missing. Surface this clearly in `.env.example`, Vercel, and deployment runbooks.
- Rotate the token by updating envs **and** re-running `npm run prebuild` so the generated bundle in `public/generated` picks up the new value.

## Error handling & observability
- Network errors (including 401) bubble up to the UI via `setStatus(...)` so visitors see Italian fallback messaging. Abort errors are swallowed silently to avoid noisy logs during fast typing.
- We currently rely on `console.error` for debugging. If production insight is required, wire the handler into whatever logging/analytics platform we standardize on (see docs/TODO.md Testing/CI task **TC2** for coverage).

## Hardening checklist
- Sanitization: highlight snippets rely on `[h]` markers but still pass through `appendHighlightedText`. Keep validating the API payload and escape any markup that might be injected (ties into docs/assets.md#html-fragments--sanitization).
- CSP/SRI: the bundle is loaded via `<script type="module" src="..." is:inline>`. When we introduce a CSP, add hashes for these modules (tracked in docs/TODO.md Security task **S3**).
- Monitoring: consider adding search analytics (queries, throttling, error rates) once we protect PII. For now, keep the `aria-live` messages accurate so support can reproduce user reports quickly.
