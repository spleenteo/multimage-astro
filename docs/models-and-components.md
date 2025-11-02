# Components Overview

## Page Sections & Layout

- `BaseLayout` — global shell wrapping every route with header, footer, analytics, and SEO defaults (src/layouts/BaseLayout.astro).
- `AuthorsSection` — renders author grids with heading, filters, and `AuthorCard` children (src/components/AuthorsSection/index.astro).
- `BannerSection` — two-column marketing hero with responsive imagery and gradient background (src/components/BannerSection/index.astro).
- `BookCarouselSection` — Swiper-powered carousel that registers `swiper/element` on demand; consumes `BookCard` view models (src/components/BookCarouselSection/index.astro).
- `CollectionDetailHero` — builds a hero banner for collection detail pages including statistics and CTA links (src/components/CollectionDetailHero/index.astro).
- `FeaturedBookHighlight` — prominent highlight used on the home hero to showcase a single release (src/components/FeaturedBookHighlight/index.astro).
- `InfoSection` — generic copy block for informational content with optional chips (src/components/InfoSection/index.astro).
- `SectionIntro` — boxed introductory text to headline listing pages (src/components/SectionIntro/index.astro).
- `Footer` / `Header` — site-wide navigation, language switch, search trigger, and legal links (src/components/Footer/index.astro, src/components/Header/index.astro).

## Cards, Lists & Detail Blocks

- `AlternateFormatsList` — renders additional book formats with pricing/link routing (src/components/AlternateFormatsList/index.astro).
- `AuthorCard` — author metadata card driving `/autori/[slug]` routes (src/components/AuthorCard/index.astro).
- `AuthorChip` — compact author pill used inside highlights or stacked metadata (src/components/AuthorChip/index.astro).
- `BookCard` — reusable summary card with cover art, pricing badge, and CTA (src/components/BookCard/index.astro).
- `CollectionCard` — grid card for collection/series listings (src/components/CollectionCard/index.astro).
- `DetailList` — definition list for labelled metadata such as edition or ISBN (src/components/DetailList/index.astro).
- `MagazinePostCard` — condensed card used on magazine listings with category ribbons (src/components/MagazinePostCard/index.astro).
- `SupplierCard` — distributor profile card with contact links and logos (src/components/SupplierCard/index.astro).
- `BooksSectionNav` — navigation header for the `/libri` mega menu (src/components/BooksSectionNav/index.astro).

## UI Primitives & Utilities

- `ui/Button` — atomic anchor/button primitive with variants, icons, and external-link affordances (src/components/ui/Button/index.astro).
- `ui/AuthorNames` — helper component to render formatted author names/labels (src/components/ui/AuthorNames/index.astro).
- `ui/PriceTag` — badge-style label for book price information (src/components/ui/PriceTag/index.astro).
- `DraftModeQueryListener` / `DraftModeToggler` — dev tools for integrating DatoCMS draft previews once the pipeline is restored (src/components/DraftModeQueryListener/index.astro, src/components/DraftModeToggler/index.astro).

## Structured Text Blocks & Custom Modules

- `datocms/structuredText/*` — renderer suite for DatoCMS Structured Text, including inline record/link bridges and block-specific templates (src/components/datocms/structuredText/).
- `datocms/structuredText/blocks/*.astro` — block implementations for hero banners, single books, videos, galleries, and section splits consumed by the Structured Text renderer.
- `blocks/PillsBlock` — modular content block featuring pill lists with CTA, plus `_graphql.ts` fragment exports (src/components/blocks/PillsBlock/).

# Utility Modules

- `lib/authors.ts` — helpers for normalising author names, sorting, and building view models.
- `lib/books.ts` — book formatting utilities (price, edition, licence labels, CTA data).
- `lib/colors.ts` — color palette helpers for deriving background/gradient tokens from cover art.
- `lib/currency.ts` — Euro currency formatter used in price badges.
- `lib/datocms/commonFragments.ts` — shared GraphQL fragments for responsive images, SEO tags, and taxonomy records.
- `lib/datocms/executeQuery.ts` — wrapped CDA fetcher with includeDraft toggles (pending implementation) and error handling.
- `lib/datocms/structuredText.ts` / `structuredTextComponents.ts` — custom serializers for Structured Text rich content blocks.
- `lib/datocms/types.ts` — shared TypeScript types mirroring DatoCMS records and block unions.
- `lib/seo.ts` — utilities for merging DatoCMS SEO metadata with sensible defaults.
- `lib/suppliers.ts` — mapping/grouping helpers for supplier/distributor records and CSV exports.
- `lib/text.ts` — text normalisation utilities (plain text extraction, truncation, highlight parsing).
