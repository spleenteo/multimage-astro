---
scope: Document performance-sensitive code paths and tactics to keep Multimage fast.
---

# Performance Notes

## Hot Paths

- The staff catalogue table in `src/pages/staff/archivio-catalogo/index.astro` renders hundreds of rows plus CSV logic at build time, inflating static HTML for an internal-only view. Gate it behind auth or an API before shipping to production.

## Client Bundles

- `BookCarouselSection` currently imports `swiper/css/bundle` and the complete `swiper/element` runtime. Consider lazy-loading the carousel or switching to the minimal modules if the carousel stays limited to a few sections.
- Inline global scripts (legacy Google Analytics, Iubenda, Vercel analytics) in `src/layouts/BaseLayout.astro:132-210` execute immediately. Mark them `async`/`defer` and audit whether each script is still required.

## Data Fetching & HTML Size

- Many GraphQL queries request `first: 500` items (books, authors, sitemap, staff). Introduce pagination helpers or incremental routes so responses and generated HTML scale beyond 500 records.
- `_site` navigation data is fetched by `BaseLayout` for every page render; investigate lifting this query into `astro:config` hooks or a global loader so it can be cached instead of re-fetched per page.

## Build Costs

- `/libri` is paginated (40/page) to keep listing HTML — and Vercel Fast Origin Transfer — small; card grids use lean responsive images (no base64/srcSet). The heavy `/llms-full.txt` export was removed (2026-06-20). See decision-log `2026-06-20-fot-reduction`.
