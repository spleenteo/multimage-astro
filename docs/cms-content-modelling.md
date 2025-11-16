---
agent_edit: true
scope: Living description of the Multimage DatoCMS models and relationships
---

# CMS Content Modelling — Current State (2025-11-16)

- DatoCMS powers books, authors, collections, distributors, staff pages, magazine posts, and info pages. Each route under `src/pages/**` owns a `_graphql.ts` that defines the fragments consumed by the page/component pair.
- Common fragments (`ResponsiveImageFragment`, `TagFragment`) live in `src/lib/datocms/commonFragments.ts`; page-specific fragments (e.g., `HOME_PAGE_QUERY`, `BOOK_DETAIL_QUERY`) describe current fields. All fragments avoid `_private` fields as mandated.
- Preview-friendly fields (Structured Text, hero copy, CTA blocks) are modeled as modular blocks; each block slug maps to a component inside `src/components/blocks`.
- `recordToWebsiteRoute` in `src/lib/datocms/recordInfo.ts` is the source of truth for generating preview URLs for every routable model.
- Editors rely on the Dato Web Previews plugin and the `/api/preview-links` endpoint to navigate between draft/published views; no custom dashboards exist.

Canonical modelling rules live in `/docs/guidelines/cms-content-modelling.md`. Update this file whenever schema changes land (and regenerate `schema.ts`).
