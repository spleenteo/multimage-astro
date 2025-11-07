---
agent_edit: true
scope: A list to describe all models in pages
---

## Singleton & index models
- **`_Site`** (queried inside `BaseLayout` via `SITE_QUERY`)
  - Powers favicon/meta tags and header/footer menus for every page.
  - Notes: Italian-only site, so `menu`/`menuFooter` just control which info pages appear in the navigation.
- **`HomeRecord`** (`src/pages/index/_graphql.ts`)
  - Fields: `title`, `claim`, `heroImage`, `_seoMetaTags`, `highlight`, modular `banners`.
  - Used in home hero plus the modular block pipeline described below.
- **`BooksIndexRecord`, `ArchiveIndexRecord`, `HighlightsIndexRecord`, `EbooksIndexRecord`** (book listings)
  - Provide hero copy + SEO metadata for `/libri`, `/libri/archivio`, `/libri/highlights`, `/libri/ebooks`.
- **`AuthorsIndexRecord`**
  - Supplies hero copy + SEO for `/autori`.
- **`CollectionsIndexRecord`**
  - Drives `/collane` hero content and SEO.
- **`SuppliersIndexRecord`**
  - Feeds `/distributori` hero copy + SEO.
- **`MagazineIndexRecord`**
  - Feeds `/magazine` hero copy + SEO.

## Core records
- **`BookRecord`** (`BookCardFragment`, `BOOK_DETAIL_QUERY`, staff/LLM queries)
  - Fields include `authors`, `license`, `format`, `coverImage`, `archive`, `promo`, `price`, structured review, etc.
  - Used everywhere: listings, detail pages, sitemap, staff CSV, `/llms-full.txt`.
  - Notes: most queries still fetch `first: 500`; see docs/TODO.md CMS task **CD2**.
- **`AuthorRecord`** (`AUTHORS_PAGE_QUERY`, `AUTHOR_DETAIL_QUERY`)
  - Fields: `fullName`, `alias`, `slug`, `country`, `biography`, `picture`, `pseudonyms`.
  - Drives `/autori`, book detail sidebars, Structured Text inline references.
- **`CollectionRecord`** (`COLLECTION_CARD_FRAGMENT`, `COLLECTION_DETAIL_QUERY`)
  - Fields: `name`, `slug`, `description`, `logo`, `seo`.
  - Used for `/collane`, collection detail hero, and related book carousels.
- **`SupplierRecord`** (`SUPPLIERS_PAGE_QUERY`)
  - Fields: contact info, address, map coordinates, `logo`.
  - Used exclusively on `/distributori`.
- **`PageRecord`** (`INFO_PAGE_QUERY`, BaseLayout menu queries, `LLMS_INTRO_QUERY`)
  - Fields: `title`, `subtitle`, `body`, `label`, `menu`, `menuFooter`, `_seoMetaTags`.
  - Used for `/info/[slug]`, header/footer navigation, and llms intro export.
- **`BlogPostRecord`** (`MAGAZINE_INDEX_QUERY`, `MAGAZINE_POST_QUERY`, sitemap)
  - Fields: `title`, `slug`, `abstract`, `sticky`, `body`, `featuredImage`, `category`, `author`, `seo`, `_seoMetaTags`.
  - Notes: Structured Text links still route to `/blog/...`; see Project Structure task **PS2**.
- **`BlogCategoryRecord`**
  - Provides category ribbons for `MagazinePostCard` entries.
- **`KeywordRecord`** (nested in `keywords`)
  - Used in staff exports to list comma-separated keywords.
- **`ReprintRecord`**
  - Appears in book detail + staff CSV for reprint history (`number`, `year`, `circulation`).
- **`DimensionRecord`** (`dimension` field)
  - Supplies formatted dimension strings for book detail + staff exports.

## Modular blocks
- **`BannerRecord`** (`BANNER_SECTION_FRAGMENT`, Structured Text `blocks`)
  - Feeds `BannerSection` and `BannerBlock` (title/content/link/imagePosition/featuredImage).
- **`SingleBookRecord`** (`FEATURED_BOOK_HIGHLIGHT_FRAGMENT`, Structured Text)
  - Provides book references for hero highlights and inline callouts.
- **`SingleAuthorRecord`** (home + magazine Structured Text)
  - Supplies author references for inline cards.
- **`BookCarouselRecord`** (`BOOK_CAROUSEL_SECTION_FRAGMENT`)
  - Contains `title`, `description`, and `books[]` arrays for carousels.
- **`CtaButtonWithImageRecord`** (home + magazine blocks)
  - Stores CTA copy, optional HTML, up to two buttons, and an image asset.
- **`PillsBlockRecord`** + nested **`SingleInfoBlockRecord`**/**`ButtonRecord`** (`PILLS_BLOCK_FRAGMENT`)
  - Describe the multi-pillar info section used on the home page.
- **`ImageBlockRecord`**
  - Supplies responsive asset + caption for Structured Text `ImageBlock`.
- **`VideoRecord`**
  - Drives `VideoBlock` (supports provider metadata for YouTube/Vimeo).
- **`SectionBlockRecord`**
  - Simple text block with `title` + `body` string.

## Utility & meta models
- **`Tag`** (`_seoMetaTags`)
  - Appears in virtually every query; reuse `TagFragment` whenever possible.
- **Aggregate meta queries** (`_allBooksMeta`, `_allAuthorsMeta`, etc.)
  - Used for counts in `/autori`, `/libri`, `/staff`, and pagination planning.
- **Dato Site Search index**
  - Not a GraphQL model but relevant to `/cerca`; configured via `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` and described in docs/search.md.
