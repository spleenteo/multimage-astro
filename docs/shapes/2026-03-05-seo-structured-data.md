# Shape: SEO Structured Data (JSON-LD)

**Status**: idea
**Date**: 2026-03-05
**Appetite**: small (1 session)

## Problem

Books, authors, and the organization have no `<script type="application/ld+json">` structured data. Google and other engines use JSON-LD to power rich results (book cards, author knowledge panels, breadcrumbs). This is a missed SEO opportunity for a publisher site.

## Solution sketch

- Add a `buildJsonLd(type, data)` helper in `src/lib/seo.ts` that returns a serialized JSON-LD string.
- Inject via `<script type="application/ld+json" set:html={...}>` in `BaseLayout` (for `Organization`) and in the relevant pages.
- Schemas to implement:
  - `Organization` — once, in `BaseLayout` or `_site` query result
  - `Book` — on `/libri/[slug]` (ISBN, author, publisher, price, cover image)
  - `Person` — on `/autori/[slug]`
  - `Article` — on `/magazine/[slug]`

## Rabbit holes

- Don't replicate all Dato fields — use only what's already in existing queries.
- Avoid adding new GraphQL queries just for JSON-LD; reuse data already fetched.

## No-gos

- No BreadcrumbList for now (requires route awareness in BaseLayout).
- No dynamic schema validation — trust the shape of existing data.

## Slices

- [ ] SEO2a: Add `buildJsonLd` helper and `Organization` schema in BaseLayout
- [ ] SEO2b: Add `Book` schema on `/libri/[slug]`
- [ ] SEO2c: Add `Person` schema on `/autori/[slug]`
- [ ] SEO2d: Add `Article` schema on `/magazine/[slug]`
- [ ] Update `docs/guidelines/seo.md` with JSON-LD conventions
