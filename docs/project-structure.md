---
agent_edit: true
scope: Fastro is based on and extends the [Astro project structure](https://docs.astro.build/en/core-concepts/project-structure/)
---

# Project Structure & Module Organization

## Directory overview
- **`src/pages/**`**
  - Route directories (`index`, `libri`, `collane`, `autori`, `distributori`, `magazine`, `info`, `staff`, `cerca`, `sitemap.xml`, `llms-full`) each ship an `index.astro`, optional `_style.module.css`, and a sibling `_graphql.ts` describing their queries. API/utility routes live as `.ts` files (e.g., `sitemap.xml.ts`, `llms-full.txt.ts`).
- **`src/components/**`**
  - Feature components bundle `index.astro`, optional `index.ts` (for fragment exports), and CSS modules. Subdirectories cover Dato blocks (`components/blocks`), Structured Text renderers (`components/datocms/structuredText`), and design primitives (`components/ui`).
- **`src/layouts`**
  - Hosts `BaseLayout.astro`, which fetches `_site`, header/footer menus, analytics scripts, and wraps every page.
- **`src/lib`**
  - Framework-agnostic helpers such as Dato tooling (`datocms/*`), view-model mappers (`books.ts`, `authors.ts`, `suppliers.ts`), formatting utilities (`text.ts`, `colors.ts`, `currency.ts`), and SEO fallbacks (`seo.ts`).
- **`src/styles`**
  - Global Tailwind import (`global.css`) and CSS variables including font declarations to keep modules lean.
- **`scripts`**
  - `build-search-client.mjs` emits the browser bundles in `public/generated`; `sync-datocms.mjs` loads `.env`, regenerates `schema.ts`, and refreshes `docs/DATOCMS.md`.
- **`public/generated`**
  - Build artefacts from `npm run prebuild`. Missing files here break `/cerca` and `BookCarouselSection` because `<script src="/generated/...">` references them directly.
- **`docs/**`**
  - Canonical documentation (assets, search, inventories, etc.). Keep these files aligned with the code or log drift in `docs/TODO.md`.

## Co-location & layering rules
- **Queries next to consumers.** Every page/component that needs data keeps an adjacent `_graphql.ts` exporting both the document and TypeScript helpers. Shared fragments (`BookCardFragment`, `BANNER_SECTION_FRAGMENT`, etc.) are re-exported from `index.ts` to keep import sites tidy.
- **CSS modules per component.** Styles live beside the component they affect. Global typography/colors stay in `src/styles/global.css` and Tailwind theme tokens.
- **Map data in `src/lib`.** Only `src/lib` should know how to massage GraphQL payloads (`mapBooksToCards`, `mapAuthorsToCards`, `groupSuppliersByRegion`, `withFallbackSeo`, `toRichTextHtml`). Pages should stick to view-model orchestration.
- **Generated JS under `public/generated`.** Do not scatter ad-hoc bundles. `BookCarouselSection` and `/cerca` expect their modules there, so always run `npm run prebuild` locally and in CI.

## Route map & data flow
- **`/`**
  - Data: `src/pages/index/_graphql.ts` (`home`, modular `banners`).
  - Primary components: `BaseLayout`, `FeaturedBookHighlight`, `BannerSection`, `BookCarouselSection`, `blocks/PillsBlock`, Structured Text blocks.
  - Notes: Hero copy (`home.claim`) flows through `toRichTextHtml`; sanitize per docs/assets.md#html-fragments--sanitization.
- **`/libri`**
  - Data: `src/pages/libri/index/_graphql.ts` (`booksIndex`, `allBooks`).
  - Primary components: `SectionIntro`, grid of `BookCard` instances.
  - Notes: Still fetches `first: 500`; see docs/TODO.md CMS task **CD2** for pagination.
- **`/libri/[slug]`**
  - Data: `src/pages/libri/[slug]/_graphql.ts` plus related `authors`, `alternate formats`, and `collection` queries.
  - Primary components: `BookCarouselSection`, `AuthorsSection`, `AlternateFormatsList`, `DetailList`.
  - Notes: Heavy view-model mapping—reuse helpers from `src/lib/books.ts` and `src/lib/authors.ts`.
- **`/collane` & `/collane/[slug]`**
  - Data: Listing (`src/pages/collane/index/_graphql.ts`) and detail (`src/pages/collane/[slug]/_graphql.ts`).
  - Primary components: `SectionIntro`, `CollectionCard`, `CollectionDetailHero`, `BookCard`.
  - Notes: Detail route queries `BookCollectionBooks` to populate related carousels.
- **`/autori` & `/autori/[slug]`**
  - Data: `src/pages/autori/index/_graphql.ts`, `src/pages/autori/[slug]/_graphql.ts`.
  - Primary components: `SectionIntro`, `BookCard`, `AuthorsSection`.
  - Notes: Detail route issues separate calls for the author record and related books.
- **`/distributori`**
  - Data: `src/pages/distributori/_graphql.ts`.
  - Primary components: `SectionIntro`, `SupplierCard`.
  - Notes: `SupplierCard` renders HTML descriptions; sanitize per Security task **S2**.
- **`/magazine` & `/magazine/[slug]`**
  - Data: `src/pages/magazine/index/_graphql.ts`, `src/pages/magazine/[slug]/_graphql.ts`.
  - Primary components: `MagazinePostCard`, Structured Text blocks, `BookCarouselSection`.
  - Notes: `LinkToRecord.astro` still targets `/blog/...`; fix via Project Structure task **PS2**.
- **`/info` & `/info/[slug]`**
  - Data: Static placeholder (`src/pages/info/index.astro`) plus `src/pages/info/[slug]/_graphql.ts` for CMS-driven pages.
  - Primary components: `InfoSection`, Structured Text renderer.
  - Notes: `BaseLayout` maps `allPages` into header/footer menus used here.
- **`/staff` & `/staff/archivio-catalogo`**
  - Data: `src/pages/staff/index/_graphql.ts`, `src/pages/staff/archivio-catalogo/_graphql.ts`.
  - Primary components: bespoke markup + CSV export script.
  - Notes: Entire toolset is publicly prerendered; see Security task **S1**.
- **`/cerca`**
  - Data: `src/pages/cerca/index.astro` (no GraphQL) plus the Site Search bundle.
  - Primary components: Search form + `public/generated/search-page.client.js`.
  - Notes: Reads config from `data-*` attributes and talks to Site Search directly; see docs/search.md for operational notes.
- **`/sitemap.xml`**
  - Data: `src/pages/sitemap.xml/_graphql.ts`.
  - Primary components: none (pure XML response).
  - Notes: Falls back to `http://localhost:4321` when `PUBLIC_SITE_URL` is missing; enforce env per SEO task **SEO1**.
- **`/llms-full.txt`**
  - Data: `src/pages/llms-full/_graphql.ts` and `LLMS_BOOKS/INTRO` queries.
  - Primary components: none (streamed text response).
  - Notes: Dumps every book/author/page body without auth; lock it down via Security task **S4**.

## Known gaps & violations
- Structured Text links for blog posts still point to `/blog/...` although the published route is `/magazine/...`. Fix `LinkToRecord.astro` and add regression coverage (docs/TODO.md Project Structure task **PS2**).
- GraphQL queries rely on `first: 500` almost everywhere (`/libri`, `/autori`, `/sitemap`, staff exports), which hammers the CDA and bloats build artifacts. Tackle pagination + cache tags under docs/TODO.md CMS task **CD2**.
- `/staff/*` and `/llms-full.txt` are anonymously accessible yet expose internal data. Hardening plans live in docs/TODO.md Security tasks **S1** and **S4**.
- `public/generated` assets are not fingerprinted or validated; missing `npm run prebuild` results in broken `<script>` imports. Add integrity checks per docs/TODO.md Project Structure task **PS1**.
- Numerous policy docs (accessibility, cms-content-modelling, cms-data-loading, decision log, SEO, testing) remain `agent_edit: false`, preventing us from documenting the real state. Request updated frontmatter via docs/TODO.md Documentation Hygiene task **DH1**.
