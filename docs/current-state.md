---
scope: Living snapshot of Multimage's current implementation status. Update sections as the codebase evolves.
---

# Current State

> Last significant update: 2025-12-01. Update sections as features ship or gaps are closed.

## Project Structure

- Astro pages live under `src/pages/**`, each with a sibling `_graphql.ts` defining queries/fragments. API routes exist under `src/pages/api/**` and power preview/draft tooling plus automations (`post-deploy`, `seo-analysis`, `preview-links`).
- Components are grouped by feature: `src/components/blocks`, `src/components/datocms/structuredText`, `src/components/ui`, and utility components like `DraftModeQueryListener`.
- Helpers live in `src/lib/**` (datocms, draftMode, seo, books/authors/suppliers). `~/lib/prerender` centralizes the shared `export { prerender }` flag so pages switch between static/SSR based on `SERVER`.
- Layout, styles, scripts:
  - `src/layouts/BaseLayout.astro` loads site-wide data, analytics, and icon scripts.
  - `src/styles/global.css` imports fonts + Tailwind base layers; `tailwind.config.mjs` defines the design tokens.
  - `scripts/` hosts `sync-datocms.mjs` (schema generation) and `build-search-client.mjs`.
- Generated assets: `public/generated` stores the Site Search + Swiper bundles built during `npm run prebuild`.
- Known gaps: `/staff/*` remains unauthenticated (**S1**), `/llms-full.txt` is public (**S4**), cache tags aren't wired (**CD3**), `LinkToRecord` still links `/blog/...` (**PS2**).

## Routing

- Static content: `/`, `/libri`, `/libri/[slug]`, `/collane`, `/autori`, `/magazine`, `/magazine/[slug]`, `/distributori`, `/info`, `/info/[slug]`, `/staff`, `/staff/archivio-catalogo`, `/llms-full.txt`, `/sitemap.xml`, `/cerca`, `/libri/ebooks|archivio|highlights`, `/collane/[slug]` all prerender when `SERVER=static` and switch to SSR automatically in preview mode via `~/lib/prerender`.
- API routes: `/api/preview`, `/api/draft-mode/enable|disable`, `/api/preview-links`, `/api/seo-analysis`, `/api/post-deploy`, `/api/utils` remain SSR-only endpoints even during static builds.
- Route helpers: `recordToWebsiteRoute` is used by `/api/preview-links` and `LinkToRecord.astro` to resolve URLs from Dato records.
- Known issues: `/staff` routes still lack auth (**S1**); `/llms-full.txt` should be gated (**S4**); `/magazine` Structured Text links still point to `/blog/...` (**PS2**).

## CMS Data Loading

- All GraphQL calls go through `src/lib/datocms/executeQuery.ts`, which swaps CDA tokens based on `includeDrafts`.
- Pages and layouts access data via collocated `_graphql.ts` modules that export both the query string and typed helpers; there is no global query registry.
- Draft Mode detection happens through `resolveDraftMode(Astro)` → `draftModeEnabledFromAstro`, allowing every fetch to opt into `includeDrafts` when SSR is active (`SERVER=preview`).
- Static builds (`SERVER=static`) execute all queries at build time; preview builds rerun queries per request.
- No pagination yet — routes such as `/libri`, `/autori`, `/sitemap.xml`, and staff exports still request up to 500 items (**CD2**).
- Cache tag propagation is not yet wired (**CD3**).

## Blocks & Components

- CMS-driven blocks map to files under `src/components/blocks/**`. Each block pairs with a `_graphql.ts` fragment collocated with its consumer page.
- Structured Text renders through `src/components/datocms/structuredText/*`; `LinkToRecord.astro` still needs a `/magazine/${slug}` fix (**PS2**).
- UI primitives such as `Button`, `Card`, `SectionIntro`, and `BookCarouselSection` live under `src/components/ui` and expect Tailwind utility classes.
- Draft-mode specific UI (`DraftModeQueryListener`) sits under `src/components` and is conditionally rendered based on the cookie helper in `~/lib/draftPreview`.

## Assets

- Fonts: `src/styles/global.css` imports Inter + Playfair Display from Google Fonts; stored in CSS variables consumed by Tailwind. No local font files.
- Icons: `iconify-icon.min.js` loaded from CDN via `BaseLayout`. No tree-shaking or local sprite.
- Third-party scripts: BaseLayout injects Google Analytics, Iubenda, Vercel Analytics, and Speed Insights; CSP/SRI hardening is open (**S3**).
- Images: every CMS-driven image goes through `@datocms/astro/Image` with `ResponsiveImageFragment`, emitting AVIF/WebP + JPEG fallbacks. Header/footer logos are still remote PNGs without intrinsic dimensions.
- Videos: `VideoBlock.astro` handles YouTube/Vimeo/native MP4 from Structured Text blocks.
- Generated bundles: `npm run prebuild` emits `public/generated/search-page.client.js` and `public/generated/swiper-element.js`. Missing bundles break `/cerca` and `BookCarouselSection` (**PS1**).
- HTML sanitization: home hero copy, Banner sections, supplier bios, and staff notices call `toRichTextHtml`/`set:html` without sanitization (**S2**).

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
- `/staff` and `/staff/archivio-catalogo` remain publicly accessible, exposing catalog exports (**S1**).
- `/llms-full.txt` exposes the full catalogue in plaintext (**S4**).
- `/api/post-deploy` accepts arbitrary requests and can leak preview secrets; needs retirement or auth (**S5**).
- Inline HTML renderers (`toRichTextHtml`, `set:html`) lack sanitization, leaving XSS exposure (**S2**).
- CSP/SRI headers are not enforced (**S3**).
- Secrets live outside the repo; `astro.config.mjs` validates required env fields at build time.

## Performance

- Production ships pure static HTML + assets; preview runs SSR from the same codebase.
- Images use Imgix transformations with AVIF/WebP fallbacks and base64 placeholders; hero sections still request large crops.
- Search bundle loads only on `/cerca`; Swiper's custom element can be heavy on first interaction.
- Vercel Analytics + Speed Insights provide Core Web Vitals monitoring; no custom RUM instrumentation.

## Testing

- Commands: `npm run format` (Prettier write), `npm run lint` (Prettier check), `npm run build` (`astro check` + build), `npm run test` (format → lint → dual SERVER build).
- No automated unit, integration, E2E, or accessibility tests. Manual QA happens locally or via Vercel preview URLs.
- Pending: **CH2** (search config assertions), **TC1** (CI workflow), **TC2** (search client tests).
- DatoCMS mocking strategy not defined; recommendation is to use real CDA in preview environments only.

## Code Health

- Formatting: Prettier + `prettier-plugin-astro`; no ESLint config.
- `npm run test` chains format → lint → dual build (no jest/playwright suites).
- Known refactors: **CH1** (extract CSV exporter to helper), **CH2** (search config assertions).
- `tsconfig.json` uses `baseUrl` + path aliases; `allowImportingTsExtensions` enabled for `_graphql.ts`.

## Operations

- Hosting: two Vercel projects share this repo. Production uses `SERVER=static` (SSG); preview uses `SERVER=preview` (SSR + Draft Mode).
- Required env vars: `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`.
- `npm run dev`/`start` auto-runs `npm run sync-datocms` (schema generation).
- Preview workflow: editors hit `/api/preview` or the Web Preview plugin to enable draft cookies, then browse the preview deployment for live drafts.

## Dependencies

- Core: Astro 5.16.3, Tailwind 3.4, TypeScript 5.5, `@datocms/astro`, `@datocms/cda-client`, `@datocms/cma-client`, `@datocms/cli`.
- Tooling: Prettier 3.3 + `prettier-plugin-astro`, esbuild 0.25, dotenv-cli.
- Client bundles: Swiper 11, Iconify CDN.
- Known debt: still shipping GA UA snippet; no automated dependency audit; `experimental.svgo` not yet evaluated (**P1**).

## Accessibility

- Pages use semantic landmarks through `BaseLayout.astro`; no skip link yet (**A11Y2**).
- Interactive blocks (search form, `BookCarouselSection`, staff tables) expose ARIA labels but have not been validated with screen readers (**A11Y1**).
- Color contrast follows the Tailwind theme from `tailwind.config.mjs`; no automated contrast audit since 2025-11-01.
- No Playwright/Cypress suite to prevent regressions.

## i18n

- Site is permanently Italian-only. No alternate locales, language switchers, or translated slugs.
- All URLs canonicalized to `https://www.multimage.org`. No `hreflang` tags beyond default `it-IT` meta.
- Future localization work is paused indefinitely.
