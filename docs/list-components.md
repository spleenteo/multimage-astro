---
agent_edit: true
scope: A list to describe all components used in the project
---

## Page Sections & Layout

- `BaseLayout` (`src/layouts/BaseLayout.astro`): Global shell that injects
  navigation, SEO defaults, analytics snippets, header, and footer around every
  page.
- `AuthorsSection` (`src/components/AuthorsSection/index.astro`): Grid section
  with heading, filters, and repeated `AuthorCard` children for `/autori`.
- `BannerSection` (`src/components/BannerSection/index.astro`): Two-column hero
  with gradient background and responsive imagery, mainly used on marketing
  pages.
- `BookCarouselSection` (`src/components/BookCarouselSection/index.astro`):
  Swiper-powered carousel that registers `swiper/element` on demand and renders
  `BookCard` view models.
- `CollectionDetailHero` (`src/components/CollectionDetailHero/index.astro`):
  Hero banner for collection detail pages, surfacing stats and CTAs.
- `FeaturedBookHighlight` (`src/components/FeaturedBookHighlight/index.astro`):
  Prominent highlight on the home hero for a single release.
- `InfoSection` (`src/components/InfoSection/index.astro`): Generic copy block
  with optional chips for informational content.
- `SectionIntro` (`src/components/SectionIntro/index.astro`): Boxed intro text
  used at the top of listing pages.
- `Footer` / `Header` (`src/components/Footer/index.astro`,
  `src/components/Header/index.astro`): Shared navigation, locale switcher,
  search trigger, and legal links.

## Cards, Lists & Detail Blocks

- `AlternateFormatsList` (`src/components/AlternateFormatsList/index.astro`):
  Lists alternate book formats with pricing/link routing.
- `AuthorCard` (`src/components/AuthorCard/index.astro`): Metadata card driving
  `/autori/[slug]` routes.
- `AuthorChip` (`src/components/AuthorChip/index.astro`): Compact pill component
  for inline author references.
- `BookCard` (`src/components/BookCard/index.astro`): Reusable summary card with
  cover art, pricing badge, and CTA.
- `CollectionCard` (`src/components/CollectionCard/index.astro`): Grid card for
  collection/series listings.
- `DetailList` (`src/components/DetailList/index.astro`): Definition list used
  for edition metadata such as ISBN or page count.
- `MagazinePostCard` (`src/components/MagazinePostCard/index.astro`): Condensed
  card with category ribbons for the magazine feed.
- `SupplierCard` (`src/components/SupplierCard/index.astro`): Distributor
  profile card with contact links/logos.
- `BooksSectionNav` (`src/components/BooksSectionNav/index.astro`): Navigation
  header for the `/libri` mega menu.

## UI Primitives & Utilities

- `ui/Button` (`src/components/ui/Button/index.astro`): Atomic anchor/button
  primitive with variants, icons, and external-link affordances.
- `ui/AuthorNames` (`src/components/ui/AuthorNames/index.astro`): Formatter for
  multi-author labels with correct separators.
- `ui/PriceTag` (`src/components/ui/PriceTag/index.astro`): Badge-style label
  for price information.

## Draft & Layout Utilities

- `DraftModeToggler` (`src/components/DraftModeToggler/Component.astro`): Custom element that surfaces enable/disable actions for Draft Mode by calling the `/api/draft-mode/*` routes and reloading the page once the cookie state changes.
- `DraftModeQueryListener` (`src/components/DraftModeQueryListener/Component.astro`): Wraps `@datocms/astro`’s `QueryListener`, automatically subscribing to GraphQL query updates when Draft Mode is active so editors see live previews.

## Media Wrappers

- `ResponsiveImage` (`src/components/ResponsiveImage/Component.astro` + `fragments.ts`): One-stop wrapper around `@datocms/astro`’s `<Image />`, exposing a shared fragment to fetch responsive image data (`src`, `srcSet`, `alt`, etc.) for reuse across pages and blocks.
- `VideoPlayer` (`src/components/VideoPlayer/Component.astro` + `fragments.ts`): Hydrated client component built on `react-datocms`’s `<VideoPlayer />`, paired with a fragment that requests the Mux playback payload once and can be spread wherever video assets appear.

## Structured Text Enhancers

- `HeadingWithAnchorLink` (`src/components/HeadingWithAnchorLink/Component.astro`): Overrides Structured Text heading nodes to inject deterministic anchor links by slugifying the rendered text.
- `PageLink` (`src/components/linkToRecord/PageLink/Component.astro` + `fragments.ts`): Renderer for link nodes targeting `PageRecord` entries, ensuring the structured text link metadata maps to the correct URL.
- `PageInline` (`src/components/inlineRecord/PageInline/Component.astro` + `fragments.ts`): Inline renderer that turns referenced page records into pill-styled anchors within structured text content.

## Blocks (DatoCMS Modular Content)

- `HeroBlock` (`src/components/blocks/HeroBlock/Component.astro` + `fragments.ts`): Renders the home hero section by outputting the localized title/subtitle HTML, optional hero image, and iterating CTA buttons fetched via the block fragment (the `displayOptions` field is currently fetched but unused in the UI pending design guidance).
- `ButtonBlock` (`src/components/blocks/ButtonBlock/Component.astro` + `fragments.ts`): Handles button-rich text blocks by outputting accessible anchors and exposing a fragment for the renamed `label`, `url`, and `primary` fields.
- `ImageBlock` (`src/components/blocks/ImageBlock/Component.astro` + `fragments.ts`): Presents a single asset as a `<figure>` with responsive imagery and caption, sharing the `ResponsiveImage` fragment to stay in sync with the CMS model.
- `ImageGalleryBlock` (`src/components/blocks/ImageGalleryBlock/Component.astro` + `fragments.ts`): Maps an array of assets into a gallery grid, reusing `ResponsiveImage` for each entry while preserving asset titles.
- `VideoBlock` (`src/components/blocks/VideoBlock/Component.astro` + `fragments.ts`): Couples the shared `VideoPlayer` with block metadata to render Mux-hosted videos and a descriptive caption.
- `PillsBlock` (`src/components/blocks/PillsBlock/Component.astro` + `_graphql.ts`): Modular block featuring pill lists with CTA support and exported fragments for reuse in page queries.

## Icons

- `Ico` (`src/components/Ico/Ico.astro`): Thin wrapper around `astro-icon` that enforces the configured icon set (`ICON_SET` in `src/config/design.ts`), adds default sizing, and handles optional accessibility labels.

## Structured Text Renderer Suite

- `datocms/structuredText/*` (`src/components/datocms/structuredText/`): Core
  renderers bridging Structured Text nodes (inline records, links, custom
  blocks) to Astro components.
- `datocms/structuredText/blocks/*.astro`: Implementations for hero banners,
  single book highlights, videos, galleries, and section splits consumed by the
  Structured Text renderer.
