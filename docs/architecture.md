**Overview**

- Astro 5.15 is configured for static output with `prerender = true` on pages; `src/layouts/BaseLayout.astro` wraps all routes and pulls global navigation + SEO using the DatoCMS CDA at build time (astro.config.mjs:1-18, src/layouts/BaseLayout.astro:1-124).
- Component structure follows the `_graphql.ts` + `index.astro` pattern mandated in AGENTS.md, with shared fragments under `src/lib/datocms/commonFragments.ts` and utility view-model mappers in `src/lib`.
- All content originates from DatoCMS via `executeQuery`, which uses the server-only `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`; no local CMS data store is maintained (src/lib/datocms/executeQuery.ts:1-26).

**Data Flow**

- Each routed page issues GraphQL queries defined alongside it (e.g., `src/pages/libri/index/_graphql.ts`), mapping records to view models with helpers like `mapBooksToCards` before rendering components.
- The layout requests menu pages and favicon tags on every render; individual sections assemble structured text through `@datocms/astro/StructuredText` or via `toRichTextHtml` for legacy HTML strings.
- Client-side search bundles a small ES module via `scripts/build-search-client.mjs` and talks to DatoCMS Site Search using the public token exposed through `data-*` attributes (src/pages/cerca/index.astro:6-78, scripts/build-search-client.mjs:1-37).
- `src/pages/llms-full.txt.ts` è un endpoint prerender che replica le query del vecchio script e produce direttamente `dist/llms-full.txt` durante la build, con le query centralizzate in `src/pages/llms-full/_graphql.ts` (src/pages/llms-full.txt.ts, src/pages/llms-full/\_graphql.ts).

**Build & Deploy**

- `npm run dev` copies the Swiper web component into `public/vendor` before starting Astro, ensuring `BookCarouselSection` can hydrate the `<swiper-container>` element (package.json:10-13, scripts/ensure-swiper-element.mjs:6-27).
- Lo schema GraphQL (`schema.ts`) e `DATOCMS.md` vengono sincronizzati automaticamente all’avvio tramite `npm run sync-datocms`, che rigenera lo schema quando `DATOCMS_API_TOKEN` è presente (leggendo anche token legacy dal `.env`) e aggiorna la doc solo se il contenuto remoto varia (package.json:7-15, scripts/sync-datocms.mjs:1-110).
- `npm run prebuild` oggi si limita a copiare lo Swiper bundle e a ricostruire il client di ricerca prima che `npm run build` esegua `astro check` e la build di produzione (package.json:10-18, scripts/build-search-client.mjs:1-37).
- Repository targets Vercel per README guidance; env vars (`DATOCMS_*`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`) are required at build/publish time and are defined in datocms.json for deployment tooling (README.md:49-80, datocms.json:1-31).
- A `wrangler.toml` is present for Cloudflare Pages static hosting, matching Astro’s static output directory, but no Cloudflare adapter is wired in the Astro config (wrangler.toml:1-3).

**Structure & Conventions**

- `src/components` contains reusable UI with TS view-model facades (`index.ts`) and CSS modules; DatoCMS structured text blocks live under `src/components/datocms/structuredText`.
- `src/pages/…/_graphql.ts` files import component fragments (`BOOK_CARD_FRAGMENT`, `BANNER_SECTION_FRAGMENT`, etc.) to reduce duplication when building queries.
- Shared logic for authors, books, suppliers, SEO, and structured text lives under `src/lib`, with TypeScript types mirroring the generated `schema.ts` file (src/lib/\*.ts, schema.ts).
- Global styles and Tailwind configuration establish the design system; Tailwind is integrated via `@astrojs/tailwind` with custom colors and zero-radius defaults (src/styles/global.css, tailwind.config.mjs).
