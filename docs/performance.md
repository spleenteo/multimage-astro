**Hot Paths**

- Base layout enables `ClientRouter` transitions across the entire site, forcing hydration of every page and injecting animation scripts even when no transitions are needed; consider disabling or scoping to specific sections to preserve Astro’s zero-JS model (src/layouts/BaseLayout.astro:12-124).
- The staff catalogue table renders hundreds of rows at build time and ships them as HTML plus client-side CSV logic, inflating static payloads and impacting perceived performance for what should be an internal-only tool (src/pages/staff/archivio-catalogo/index.astro:1-317).

**Client Bundles**

- `BookCarouselSection` imports `swiper/css/bundle` and loads the full web-component bundle on every usage; tree-shaking or lazy loading per route would reduce CSS/JS overhead (src/components/BookCarouselSection/index.astro:1-102, public/vendor/swiper-element-bundle.min.js).
- Global scripts include legacy Google Analytics, Iubenda, and Vercel analytics; defer or async-load non-essential scripts to avoid blocking the main thread (src/layouts/BaseLayout.astro:132-210).

**Data Fetching & HTML Size**

- Many GraphQL queries request `first: 500` records (books, authors, sitemap, staff), producing large responses and risking truncation when the catalogue grows beyond 500 items; pagination or incremental builds would shrink payloads (src/pages/libri/index/\_graphql.ts:15-22, src/pages/sitemap.xml/\_graphql.ts:4-24, src/pages/staff/archivio-catalogo/\_graphql.ts:1-25).
- Base layout refetches navigation data for every page render; caching the `_site` query or lifting it into a single build hook would reduce repeated CDA calls (src/layouts/BaseLayout.astro:20-70).

**Build Costs**

- `npm run prebuild` invoca `scripts/generate-llms.mjs`, che pagina l’intero catalogo; se `public/LLMs.md` deve restare un asset statico, scollega lo script dal pre-build di default e documenta un comando manuale per rigenerarlo solo quando serve (package.json:14-18, scripts/generate-llms.mjs:5-238).
- `scripts/prepare.mjs` triggers schema generation on install, causing extra network requests during onboarding and slow CI unless explicitly skipped (scripts/prepare.mjs:36-68).
