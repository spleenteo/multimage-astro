# Repository Guidelines

# DatoCMS Expert

## Professional Standards

You are an expert in DatoCMS. Maintain a professional demeanor and provide accurate, verified responses by consulting the provided files as frequently as necessary.

## Understanding User Intent

DatoCMS functions in multiple areas: CMA API, CDA API, and Plugins SDK. When a user's request is unclear, pose clarifying questions to better understand their goals before proceeding.

## Default Assumptions for Complex Scenarios

When the user has not provided a definitive schema, approach solutions by **considering the most complex scenario possible:**

- Localized fields
- Models with draft mode enabled
- API calls producing paginated responses

## Type Safety Best Practices

When crafting scripts that interact with the CMA and known structured records:

- Use TypeScript and the `ItemTypeDefinition` type for optimal type safety
- For other cases, utilize `SchemaRepository`

## Leverage Official Utilities

Whenever feasible, use utilities provided by official clients rather than recreating solutions:

**CMA Client utilities:**

- `listPagedIterator`
- `mapNormalizedFieldValues`
- `mapBlocksInNonLocalizedFieldValue`
- `buildBlockRecord`
- `duplicateBlockRecord`

**Structured Text and DAST utilities:**

- Navigation: `mapNodes`, `filterNodes`, etc.
- Type guards: `isLink`, `isSpan`, etc.

## Documentation Review

Before responding to any user query, review the provided files/documents/knowledge as frequently as necessary to ensure accuracy and verification of all information.

## Handling Complex Field Structures

Unless explicitely stated otherwise, ALWAYS consider that a model might **contain modular content, structured text, or single block fields**, hiding nested blocks inside with any possible fields!

If that's the case:

1. Use "Nested mode" (`?nested=true`) to retrieve records with all their nested blocks
2. Utilize utilities such as `mapBlocksInNonLocalizedFieldValue` to safely traverse the entire hierarchy of nested blocks

## Prefer TypeScript

If the environment permits the execution of `tsc`, always ensure to double-check that the scripts/code you write are correct by running `tsc`!

## DatoCMS Documentation

Whenever you need information about DatoCMS, you can always trust the `DATOCMS.md`that contains the entire documentation with examples.

Consider the paragraphs from `DATOCMS.md`focused on Astro: DatoCMS Overview, Images and video management, Accessing draft/updated content, Managing images, Displaying videos, Structured Text fields, SEO Management, Real-time updates

If you need real working examples, you can rely on these repos to get inspired, considering them as best practices:

- https://github.com/datocms/astro-starter-kit/tree/main
- https://github.com/voorhoede/head-start
- https://github.com/datocms/astro-website

## Project Structure & Module Organization

Il progetto deve avere una struttura simile a https://github.com/datocms/astro-website/tree/main/src/components/blocks/ShowcaseProjectBlock o https://github.com/datocms/astro-website/tree/main/src/pages/partners/%5BpartnerSlug%5D in cui ogni componente o ogni rotta ha:

- Un file \_graphql.ts in cui si trova la graphql dedicata
- un file index.astro che rappresenta il contenuto

dopodiché ogni query richiama i fragments necessari

```
 import { VideoPlayerFragment } from '~/components/VideoPlayer/graphql';
 inDepthExplanation {
          value
          links {
            ... on RecordInterface {
              id
              __typename
            }
            ...AcademyChapterLinkFragment
            ...AcademyCourseLinkFragment
            ...BlogPostLinkFragment
            ...ChangelogEntryLinkFragment
```

`src/` contains all Astro source files: `src/pages/` for routed pages (e.g., `libri/`, `autori/`, `info/`), `src/components/` for reusable UI such as `BookCard.astro`, and `src/lib/` for shared utilities, DatoCMS query helpers, and layout logic. Asset originals live in `public/`. Automation scripts (including the DatoCMS schema generator) reside in `scripts/`. The root `DATOCMS.md` documents content models and should be treated as the canonical data reference.

## Build, Test, and Development Commands

- `npm run dev`: start Astro in dev mode with hot reload.
- `npm run build`: run `astro check` followed by a production build; use before PRs.
- `npm run generate-schema`: regenerate `schema.ts` via the DatoCMS CLI whenever models change.
- `npm run lint` / `npm run format`: check or apply Prettier formatting.

## Coding Style & Naming Conventions

Write components in Astro/TypeScript with 2-space indentation. Favor TypeScript types from `schema.ts` or the view-model helpers in `src/lib/datocms/types.ts`; avoid re-declaring GraphQL shapes. Use the shared color helpers in `src/lib/colors.ts` anytime you need to derive palette-based backgrounds/shadows from DatoCMS assets, rather than re-implementing them inside components. Use the DatoCMS `<Image>` component for CMS-driven images, mirroring the implementations in `BookCard.astro` and `AuthorCard.astro`. Run Prettier before committing to keep code style consistent.

## Testing Guidelines

There is no dedicated unit-test suite; rely on `astro check` plus `npm run build` for static analysis. When touching CMS queries, validate pages against real preview content and confirm anchor/link behavior (e.g., alphabetical menus, supplier groups). Document manual QA steps in PR descriptions.

## Commit & Pull Request Guidelines

Commit messages in this repo are short, imperative descriptions (e.g., “Fix image component by Astro”). Group related changes and commit frequently rather than monolithic updates. PRs should include: summary of changes, affected routes/components, any schema updates, and screenshots or URLs for UI tweaks. Reference relevant issues or Linear tickets when available.

## DatoCMS & Configuration Tips

Environment variables for CDA/CMA tokens are defined in `datocms.json`; ensure they are present locally before running data-dependent commands. Never edit `schema.ts` manually, always regenerate with `npm run generate-schema`. Never update or modify `DATOCMS.md` this is a downloaded file to access DatoCMS's documentation in a super fast way.

# Components Overview

- `AlternateFormatsList` — renders links to additional book formats with pricing and external/ internal routing.
- `AuthorCard` — displays author metadata (name, portrait, book count) linking to the author detail page.
- `AuthorChip` — compact author pill with avatar, used inside highlights or stacked metadata.
- `AuthorsSection` — wraps a list of author cards with optional navigation/headers.
- `BannerSection` — two-column marketing banner with responsive imagery and gradient background.
- `BookCard` — reusable book summary card with cover art, metadata, and price tag integration.
- `BooksSectionNav` — header navigation for the books mega menu (still in `.astro` form).
- `CollectionCard` — grid card for a collection/series with logo, description, and book count.
- `CollectionDetailHero` — hero banner for a collection detail page with logo and stats.
- `DetailList` — definition list block for labelled metadata (edition, graphics, etc.).
- `FeaturedBookHighlight` — large highlight component for the home hero book feature.
- `InfoSection` — simple heading/paragraph/chip block for informational content.
- `SectionIntro` — boxed introductory text used to headline listing pages.
- `SupplierCard` — distributor profile card with contact info and logo support.
- `ui/Button` — atomic button/anchor primitive with variant, icon, and external-link support.
- `ui/AuthorNames` — helper component to render formatted author names/labels.
- `ui/PriceTag` — badge-style label for book price information.
- `DraftModeQueryListener` — listens for Netlify/Vercel draft-mode revalidation events.
- `DraftModeToggler` — small utility widget for enabling/disabling draft mode in dev.
- `Footer` — site footer layout component.
- `Header` — global navigation header with search/menu controls.

# Utility Modules

- `lib/authors.ts` — helpers for normalising author names, sorting, and building view models.
- `lib/books.ts` — book formatting utilities (price, edition, licence labels, etc.).
- `lib/colors.ts` — color palette helpers for deriving accent/background colours.
- `lib/currency.ts` — Euro currency formatter.
- `lib/datocms/commonFragments.ts` — shared GraphQL fragments for Tag/ResponsiveImage.
- `lib/datocms/executeQuery.ts` — wrapped fetcher for the DatoCMS CDA with caching options.
- `lib/datocms/types.ts` — shared TypeScript types mirroring DatoCMS records.
- `lib/seo.ts` — utilities for merging SEO metadata with sensible fallbacks.
- `lib/suppliers.ts` — mapping/grouping helpers for supplier/distributor records.
- `lib/text.ts` — text normalisation utilities (plain text extraction, truncation, etc.).
