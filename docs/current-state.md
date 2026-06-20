---
scope: Living snapshot of Multimage's current implementation status. Update sections as the codebase evolves.
---

# Current State

> Last significant update: 2026-06-20 (Fast Origin Transfer reduction: surgical revalidation, 60-day ISR TTL, lean card images, paginated `/libri`, `/llms-full.txt` removed). Update sections as features ship or gaps are closed.

## Project Structure

- Astro pages live under `src/pages/**`, each with a sibling `_graphql.ts` defining queries/fragments. API routes exist under `src/pages/api/**` and power preview/draft tooling plus automations (`post-deploy`, `seo-analysis`, `preview-links`).
- Components are grouped by feature: `src/components/blocks`, `src/components/datocms/structuredText`, `src/components/ui`, and utility components like `DraftModeQueryListener`.
- Helpers live in `src/lib/**` (datocms, draftMode, seo, books/authors/suppliers). All routes are SSR with ISR caching (no more `prerender` flag branching).
- Layout, styles, scripts:
  - `src/layouts/BaseLayout.astro` loads site-wide data, analytics, and icon scripts.
  - `src/styles/global.css` imports fonts + Tailwind base layers; `tailwind.config.mjs` defines the design tokens.
  - `scripts/` hosts `sync-datocms.mjs` (schema generation) and `build-search-client.mjs`.
- Generated assets: `public/generated` stores the Site Search + Swiper bundles built during `npm run prebuild`.
- Known gaps: cache tags aren't wired (**CD3**), `LinkToRecord` still links `/blog/...` (**PS2**). (**S1** resolved 2026-05-31 — internal routes gated in middleware. **S4** resolved 2026-06-20 — `/llms-full.txt` removed.)

## Routing

- Tutte le route pubbliche (`/`, `/libri` + `/libri/pagina/[page]`, `/libri/[slug]`, `/autori/[slug]`, `/magazine/[slug]`, `/collane/[slug]`, `/info/[slug]`, le index, `/sitemap.xml`, `/archived-books.json`, `/cerca`, `/distributori`) sono SSR ma servite dalla CDN Vercel via ISR — funzionalmente statiche per anonymous, on-demand SSR per editor. API routes (`/api/**`) sono escluse dall'ISR e girano sempre come function invocations.
- Il catalogo `/libri` è **paginato** (40 libri/pagina): pagina 1 canonica su `/libri`, pagine 2..N su `/libri/pagina/<n>` (path-based per chiavi ISR pulite). `/libri/pagina/1` → 301 `/libri`; pagine non numeriche o fuori range → 404. `BOOKS_PER_PAGE` + `buildBooksCataloguePaths()` in `src/lib/books.ts` sono la single source of truth condivisa da route, sitemap e revalidation.
- Route interne (`/staff/*`, `/libri/schede/*`) sono gated in `src/middleware.ts`: senza la sessione editor (cookie JWT draft mode) rispondono **404** prima del render — vedi decision-log `2026-05-31-editor-session-gating` (**S1**).
- API routes: `/api/preview`, `/api/draft-mode/enable|disable`, `/api/preview-links`, `/api/seo-analysis`, `/api/post-deploy`, `/api/revalidate`, `/api/utils` remain SSR-only endpoints even during static builds.
- Route helpers: `recordToWebsiteRoute` is used by `/api/preview-links` and `LinkToRecord.astro` to resolve URLs from Dato records; the surgical revalidation map (`revalidationUrls.ts`) mirrors the same api_key → route table.
- Known issues: `/magazine` Structured Text links still point to `/blog/...` (**PS2**). (**S1** resolved — internal routes gated in middleware. **S4** resolved 2026-06-20 — `/llms-full.txt` removed.)

## CMS Data Loading

- All GraphQL calls go through `src/lib/datocms/executeQuery.ts`, which swaps CDA tokens based on `includeDrafts`.
- Pages and layouts access data via collocated `_graphql.ts` modules that export both the query string and typed helpers; there is no global query registry.
- Draft Mode detection happens through `resolveDraftMode(Astro)` → `draftModeEnabledFromAstro`. `executeQuery` opts into `contentLink: 'v1'` + `baseEditingUrl` for Visual Editing when `includeDrafts` is true **and** `DATOCMS_BASE_EDITING_URL` is set; without the env (e.g. local dev) it serves drafts but skips Content Link to avoid the CDA 422.
- Editors enter draft mode through the DatoCMS Web Previews plugin (or `/api/preview?secret=...`). `enableDraftMode` sets a dual-cookie: the JWT app-level cookie + the Vercel-native `__prerender_bypass` cookie that bypasses CDN cache for the editor's requests.
- Webhook `/api/revalidate` is called by DatoCMS on publish/unpublish (delete optional). It now does **surgical** revalidation: `webhookPayload.ts` parses the payload (event_type, slug, model api_key from `related_entities`), and `revalidationUrls.ts` maps `api_key + slug` → the small set of affected URLs (~12–20 for a book, incl. its catalogue pages, sub-indexes, and its authors'/collection's detail pages; index/singleton records → their index URL). Unknown/unmapped models no-op. `?mode=full` still runs the whole-surface sweep via `getAllPublicUrls()`. After revalidating it re-spiders Site Search via `buildTriggers.reindex` (no rebuild). The ineffective in-memory debounce was removed (each call is cheap + idempotent). See decision-log `2026-06-20-fot-reduction`.
- ISR `expiration` is **60 days** (safety net only; freshness is on-demand via the webhook — see `docs/guidelines/preview-mode.md`).
- Card grids use `RESPONSIVE_IMAGE_CARD_FIELDS` (no `base64`, no `srcSet`; `<Image srcSetCandidates={[1,2]}>` rebuilds a 2-candidate srcset client-side) to keep listing HTML — and thus FOT — small. `RESPONSIVE_IMAGE_FRAGMENT` (with base64 + srcSet) stays for hero/detail images.
- Partial pagination — `/libri` + sitemap catalogue pages now paginate via `first/skip`; `/autori`, staff exports and other `first: 500` reads remain (**CD2**).
- Cache tag propagation is not yet wired (**CD3**); surgical revalidation covers the "revalidate only touched pages" goal via a URL map in the meantime.

## Blocks & Components

- CMS-driven blocks map to files under `src/components/blocks/**`. Each block pairs with a `_graphql.ts` fragment collocated with its consumer page.
- Structured Text renders through `src/components/datocms/structuredText/*`; `LinkToRecord.astro` still needs a `/magazine/${slug}` fix (**PS2**).
- UI primitives such as `Button`, `Card`, `SectionIntro`, and `BookCarouselSection` live under `src/components/ui` and expect Tailwind utility classes.
- Draft-mode specific UI (`DraftModeQueryListener`) sits under `src/components` and is conditionally rendered based on the cookie helper in `~/lib/draftPreview`.

## Assets

- Fonts: `src/styles/global.css` imports Inter + Playfair Display from Google Fonts; stored in CSS variables consumed by Tailwind. No local font files.
- Icons: `iconify-icon.min.js` loaded from CDN via `BaseLayout`. No tree-shaking or local sprite.
- Third-party scripts: BaseLayout injects Google Analytics, Iubenda, Vercel Analytics, and Speed Insights; CSP/SRI hardening is open (**S3**).
- Images: every CMS-driven image goes through `@datocms/astro/Image`. Hero/detail images use the full `RESPONSIVE_IMAGE_FRAGMENT` (with `base64` blur-up + DatoCMS `srcSet`). Card/thumbnail grids use the lean `RESPONSIVE_IMAGE_CARD_FIELDS` (no `base64`/`srcSet`; flat `bgColor` placeholder + `srcSetCandidates={[1,2]}`) to keep listing HTML small (Fast Origin Transfer). Header/footer logos are still remote PNGs without intrinsic dimensions.
- Videos: `VideoBlock.astro` handles YouTube/Vimeo/native MP4 from Structured Text blocks.
- Generated bundles: `npm run prebuild` emits `public/generated/search-page.client.js` and `public/generated/swiper-element.js`. Missing bundles break `/cerca` and `BookCarouselSection` (**PS1**).
- HTML sanitization: home hero copy, Banner sections, supplier bios, and staff notices call `toRichTextHtml`/`set:html` without render-time sanitization (**S2**, partial). Input-side mitigation relies on restricted WYSIWYG toolbars. As of 2026-05-31 **no WYSIWYG field carries the `sanitized_html` validator** (removed from all 16 fields after it re-surfaced on 7 and blocked saves / caused dirty-form loops — see decision-log §4); anti-spurious-HTML protection lives exclusively at the editor/toolbar layer.

## SEO

- Canonical base URL: `astro.config.mjs` sets `site = 'https://www.multimage.org'`; `PUBLIC_SITE_URL` must also be present (**SEO1**).
- Meta defaults come from `src/lib/seo.ts`, which merges page-specific SEO fields from Dato with fallback copy; Structured Data is not yet implemented (**SEO2**).
- `sitemap.xml.ts` pulls data via GraphQL and prerenders during builds; limited to single-locale `it` URLs.
- Open Graph/Twitter tags reuse the SEO helper and Dato fields; no image fallback beyond Dato-provided ones.

## Search

- Uses DatoCMS Site Search. `/cerca/index.astro` renders an accessible form and lazy-loads `public/generated/search-page.client.js`.
- The bundled client applies debounced queries, renders grouped filters, and expects configuration via `data-*` attributes. Missing config fails silently (**CH2**).
- Search results rely on highlight snippets; client-side code escapes `[h]...[/h]` markers into `<mark>` elements before injecting HTML.

## Security

- Preview endpoints rely on JWT-signed cookies (`SIGNED_COOKIE_JWT_SECRET`) plus `SECRET_API_TOKEN`. Cookies are `secure`, `sameSite='none'`, and partitioned.
- Internal routes (`/staff`, `/staff/archivio-catalogo`, `/libri/schede/*`) are gated in `src/middleware.ts`: a request without the editor session (signed draft-mode JWT cookie) gets a flat 404 before render. The cookie doubles as the editor session (drafts + staff access + affordances), expires after 30 days, and is activated via the existing magic link. (**S1** resolved 2026-05-31 — see decision-log.)
- `/llms-full.txt` (full catalogue + biographies in plaintext) was **removed** 2026-06-20, closing **S4**.
- `/api/post-deploy` accepts arbitrary requests and can leak preview secrets; needs retirement or auth (**S5**).
- Inline HTML renderers (`toRichTextHtml`, `set:html`) lack render-time sanitization, leaving XSS exposure (**S2**, now partial). Mitigated at input across WYSIWYG fields via restricted toolbars that strip paste-from-Word at source. The `sanitized_html` save/validation-time validator was removed from **all** WYSIWYG fields (2026-05-31) — it either looped (sanitize-on-save) or blocked saves (validate-only) and never coexisted with a WYSIWYG cleanly. Legacy values and other surfaces still unsanitized at render — see `docs/decision-log/2026-05-30-isr-cutover-fixes.md` §4.
- CSP/SRI headers are not enforced (**S3**).
- Secrets live outside the repo; `astro.config.mjs` validates required env fields at build time.

## Performance

- Production ships pure static HTML + assets; preview runs SSR from the same codebase.
- Images use Imgix transformations with AVIF/WebP fallbacks; hero/detail keep base64 placeholders, card grids dropped them (flat `bgColor` only) to shrink listing HTML. Hero sections still request large crops.
- Search bundle loads only on `/cerca`; Swiper's custom element can be heavy on first interaction.
- Vercel Analytics + Speed Insights provide Core Web Vitals monitoring; no custom RUM instrumentation.

## Testing

- Commands: `npm run format` (Prettier write), `npm run lint` (Prettier check), `npm run build` (`astro check` + build single output), `npm run test` (format → lint → build).
- No automated unit, integration, E2E, or accessibility tests. Manual QA happens locally or via Vercel preview URLs.
- Pending: **CH2** (search config assertions), **TC1** (CI workflow), **TC2** (search client tests).
- DatoCMS mocking strategy not defined; recommendation is to use real CDA in preview environments only.

## Code Health

- Formatting: Prettier + `prettier-plugin-astro`; no ESLint config.
- `npm run test` chains format → lint → dual build (no jest/playwright suites).
- Known refactors: **CH1** (extract CSV exporter to helper), **CH2** (search config assertions).
- `tsconfig.json` uses `baseUrl` + path aliases; `allowImportingTsExtensions` enabled for `_graphql.ts`.

## Operations

- Hosting: **un solo progetto Vercel** con `output: 'server'` + ISR. Anonymous → CDN cache. Editor con draft cookie → CDN bypass + SSR + Visual Editing.
- Required env vars: `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `BYPASS_TOKEN`, `DATOCMS_BASE_EDITING_URL`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`. (`SERVER` rimossa.)
- `npm run dev`/`start` auto-runs `npm run sync-datocms` (schema generation).
- Preview workflow: editors hit `/api/preview` or the Web Preview plugin to enable draft cookies, then browse the preview deployment for live drafts.

## Dependencies

- Core: Astro 6.3.3, Tailwind 3.4.19 (via PostCSS plugin, non più via `@astrojs/tailwind`), TypeScript 5.9, `@astrojs/vercel` 10.0.7 con ISR, `@datocms/astro` 0.6.12, `@datocms/cda-client` 0.2.10, `@datocms/cma-client` 5.4.18, `@datocms/content-link` 0.3.20 (Visual Editing), `datocms` (CLI) 4.0.27.
- Tooling: Prettier 3.8 + `prettier-plugin-astro`, esbuild 0.28, dotenv-cli 11.
- Client bundles: Swiper 12 (fix CVE prototype pollution), Iconify CDN.
- Known debt: still shipping GA UA snippet; no automated dependency audit; `experimental.svgo` not yet evaluated (**P1**); `path-to-regexp` ReDoS (GHSA-9wv6-86v2-598j) ancora aperto come transitive di `@vercel/routing-utils@5.3.3` — upstream issue, attende patch da Vercel; Tailwind 4 e TypeScript 6 deliberatamente non aggiornati.

## Accessibility

- Pages use semantic landmarks through `BaseLayout.astro`; no skip link yet (**A11Y2**).
- Interactive blocks (search form, `BookCarouselSection`, staff tables) expose ARIA labels but have not been validated with screen readers (**A11Y1**).
- Color contrast follows the Tailwind theme from `tailwind.config.mjs`; no automated contrast audit since 2025-11-01.
- No Playwright/Cypress suite to prevent regressions.

## i18n

- Site is permanently Italian-only. No alternate locales, language switchers, or translated slugs.
- All URLs canonicalized to `https://www.multimage.org`. No `hreflang` tags beyond default `it-IT` meta.
- Future localization work is paused indefinitely.
