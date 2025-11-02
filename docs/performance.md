**Hot Paths**

- The staff catalogue table renders hundreds of rows at build time and ships them as HTML plus client-side CSV logic, inflating static payloads and impacting perceived performance for what should be an internal-only tool (src/pages/staff/archivio-catalogo/index.astro:1-317).

**Client Bundles**

- `BookCarouselSection` imports `swiper/css/bundle` and the full `swiper/element` bundle; consider lazy-loading the component or trimming the bundle if carousel usage stays limited (src/components/BookCarouselSection/index.astro:1-134).
- Global scripts include legacy Google Analytics, Iubenda, and Vercel analytics; defer or async-load non-essential scripts to avoid blocking the main thread (src/layouts/BaseLayout.astro:132-210).

**Data Fetching & HTML Size**

- Many GraphQL queries request `first: 500` records (books, authors, sitemap, staff), producing large responses and risking truncation when the catalogue grows beyond 500 items; pagination or incremental builds would shrink payloads (src/pages/libri/index/\_graphql.ts:15-22, src/pages/sitemap.xml/\_graphql.ts:4-24, src/pages/staff/archivio-catalogo/\_graphql.ts:1-25).
- Base layout refetches navigation data for every page render; caching the `_site` query or lifting it into a single build hook would reduce repeated CDA calls (src/layouts/BaseLayout.astro:20-70).

**Build Costs**

- L’esportazione LLM ora avviene nel prerender dell’endpoint `src/pages/llms-full.txt.ts`, evitando round-trip aggiuntivi durante `npm run prebuild`; resta comunque un processo pesante per il CDA, quindi monitora i tempi di build quando il catalogo cresce (src/pages/llms-full.txt.ts, src/pages/llms-full/\_graphql.ts).
