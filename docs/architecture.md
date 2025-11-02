**Overview**

- Astro 5.15 is configured for static output with `prerender = true` on pages; `src/layouts/BaseLayout.astro` wraps all routes and pulls global navigation + SEO using the DatoCMS CDA at build time (astro.config.mjs:1-18, src/layouts/BaseLayout.astro:1-124).
- Component structure follows the `_graphql.ts` + `index.astro` pattern mandated in AGENTS.md, with shared fragments under `src/lib/datocms/commonFragments.ts` and utility view-model mappers in `src/lib`.
- All content originates from DatoCMS via `executeQuery`, which uses the server-only `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`; no local CMS data store is maintained (src/lib/datocms/executeQuery.ts:1-26).

**Data Flow**

- Each routed page issues GraphQL queries defined alongside it (e.g., `src/pages/libri/index/_graphql.ts`), mapping records to view models with helpers like `mapBooksToCards` before rendering components.
- The layout requests menu pages and favicon tags on every render; individual sections assemble structured text through `@datocms/astro/StructuredText` or via `toRichTextHtml` for legacy HTML strings.
- Client-side search bundles a small ES module via `scripts/build-search-client.mjs` and talks to DatoCMS Site Search using the public token exposed through `data-*` attributes (src/pages/cerca/index.astro:6-78, scripts/build-search-client.mjs:1-37).
- `scripts/generate-llms.mjs` exports a markdown catalogue (`public/LLMs.md`) by paginating GraphQL requests against DatoCMS, embedding author bios and book metadata for external agents (scripts/generate-llms.mjs:5-238).

**Build & Deploy**

- `npm run dev` copies the Swiper web component into `public/vendor` before starting Astro, ensuring `BookCarouselSection` can hydrate the `<swiper-container>` element (package.json:10-13, scripts/ensure-swiper-element.mjs:6-27).
- `npm run prebuild` ensures schema and LLM exports are regenerated, then `npm run build` runs `astro check` followed by the production build producing `dist/` (package.json:14-20).
- Repository targets Vercel per README guidance; env vars (`DATOCMS_*`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`) are required at build/publish time and are defined in datocms.json for deployment tooling (README.md:49-80, datocms.json:1-31).
- A `wrangler.toml` is present for Cloudflare Pages static hosting, matching Astro’s static output directory, but no Cloudflare adapter is wired in the Astro config (wrangler.toml:1-3).

**Structure & Conventions**

- `src/components` contains reusable UI with TS view-model facades (`index.ts`) and CSS modules; DatoCMS structured text blocks live under `src/components/datocms/structuredText`.
- `src/pages/…/_graphql.ts` files import component fragments (`BOOK_CARD_FRAGMENT`, `BANNER_SECTION_FRAGMENT`, etc.) to reduce duplication when building queries.
- Shared logic for authors, books, suppliers, SEO, and structured text lives under `src/lib`, with TypeScript types mirroring the generated `schema.ts` file (src/lib/\*.ts, schema.ts).
- Global styles and Tailwind configuration establish the design system; Tailwind is integrated via `@astrojs/tailwind` with custom colors and zero-radius defaults (src/styles/global.css, tailwind.config.mjs).
