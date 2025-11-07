---
agent_edit: true
scope: A list to describe all helpers, scripts, middlewares used in the project
---

## Data Fetching & GraphQL

- `executeQuery` (`src/lib/datocms/executeQuery.ts`): Thin wrapper around `@datocms/cda-client` that selects the proper CDA token based on the `includeDrafts` flag, enforces `excludeInvalid`, and forwards variables for every GraphQL request.
- `commonFragments` (`src/lib/datocms/commonFragments.ts`): Hosts the shared responsive image, SEO (`TagFragment`), and taxonomy fragments so blocks/pages can stay DRY.
- `types` (`src/lib/datocms/types.ts`): Re-exports generated GraphQL types, keeping component props aligned with the DatoCMS schema.

## Draft Mode Utilities

- `draftMode` helpers (`src/lib/draftMode.ts`): Provides `enableDraftMode`, `disableDraftMode`, `isDraftModeEnabled`, and `draftModeHeaders()` to manage the signed cookie, guard API access, and re-create the Draft Mode header set when server-side fetching draft content.

## Routing & Preview Glue

- `recordInfo` helpers (`src/lib/datocms/recordInfo.ts`): Maps DatoCMS items to on-site routes and friendly slugs; used by preview/SEO endpoints to build URLs for `Page` and `Article` models.

## Internationalization

- `i18n` toolkit (`src/lib/index.ts`): Initializes Rosetta with the configured locales, exposes `t`, `setLocale`, `getLocale`, `getLocaleName`, and constants like `defaultLocale`/`cookieName` for locale-aware UI.

## Design & Icons

- `design` config (`src/config/design.ts`): Defines the default `ICON_SET` and the `iconName()` helper to normalize Iconify identifiers consumed by the `Ico` component.

## Content & View-Model Helpers

- `authors` (`src/lib/authors.ts`): Normalizes author names, sorts them, and builds view models for author lists.
- `books` (`src/lib/books.ts`): Formats prices, editions, call-to-action labels, and simplifies CTA wiring for book cards.
- `colors` (`src/lib/colors.ts`): Derives background/gradient tokens from cover art to keep cards on-brand.
- `currency` (`src/lib/currency.ts`): Shared Euro currency formatter used by price tags and badges.
- `seo` (`src/lib/seo.ts`): Merges `_site` defaults, Structured Text content, and per-page overrides into the props consumed by `<Seo />`.
- `suppliers` (`src/lib/suppliers.ts`): Groups distributor records, maps CSV fields, and powers the staff exports.
- `text` (`src/lib/text.ts`): Provides helpers for truncation, highlight parsing, and legacy HTML rendering (to be sanitized per security notes).

## Structured Text Tooling

- `structuredText` serializers (`src/lib/datocms/structuredText.ts` + `structuredTextComponents.ts`): Custom renderers that map blocks, inline records, and links to Astro components while keeping escaping consistent.

## API Route Helpers

- API utilities (`src/pages/api/utils.ts`): Shared functions for Astro API routes, including CORS headers (`withCORS`), JSON serialization, success/error response builders, and `isRelativeUrl` guard used to prevent open redirects.

## Tooling Scripts

- `sync-datocms` (`scripts/sync-datocms.mjs`): Node script that loads `.env` values, regenerates `schema.ts` via `npx datocms schema:generate`, and refreshes `docs/DATOCMS.md` from the official DatoCMS LLM docs dump.
