---
description: GraphQL data loading conventions and patterns for Multimage.
---

# CMS Data Loading

## Core helper: `executeQuery`

All GraphQL calls go through `src/lib/datocms/executeQuery.ts`. It wraps `@datocms/cda-client` and selects the correct token automatically:

```ts
import { executeQuery } from '~/lib/datocms/executeQuery';

const result = await executeQuery<MyQueryType>(MY_QUERY, {
  variables: { slug: 'my-slug' },
  includeDrafts: false,     // default false; true in preview mode
  excludeInvalid: true,     // default true
  environment: 'sandbox',   // optional; omit for default environment
});
```

Token selection:
- `includeDrafts: false` → `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`
- `includeDrafts: true` → `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` (required in preview deployments)

## Query colocation

Every page or component that fetches data keeps a sibling `_graphql.ts` that exports the query string and TypeScript helpers:

```
src/pages/libri/[slug]/
├── index.astro        ← consumes the query
└── _graphql.ts        ← exports query string, fragments, and typed helpers
```

Shared fragments (e.g. `ResponsiveImageFragment`, `BANNER_SECTION_FRAGMENT`) are defined once and re-exported from the component's `index.ts` to keep import sites tidy.

## Draft mode integration

In `.astro` files that support preview, resolve draft mode before executing queries:

```ts
import { resolveDraftMode } from '~/lib/draftPreview';

const { isEnabled: includeDrafts } = resolveDraftMode(Astro);
const data = await executeQuery(QUERY, { includeDrafts });
```

Draft mode is active per request, when the signed draft-mode cookie is present. On Vercel the ISR copy is skipped through `__prerender_bypass`; on Cloudflare the gateway sends the request with `cache: 'no-store'` and the middleware makes the response private. Without the cookie, requests use published content.

## Pagination

There is currently no paginated loader. Routes like `/libri`, `/autori`, and `/sitemap.xml` use `first: 500` as a workaround. This is a known gap tracked as **CD2** in `docs/TODO.md`.

Until a paginated helper ships: keep `first: 500` and annotate it with `// TODO CD2`.

## Fragment conventions

- Name fragments after their owning component: `BookCardFragment`, `AuthorCardFragment`
- Place fragments in the component's `_graphql.ts` or `index.ts`
- Compose fragments at the page-level `_graphql.ts`
- Never duplicate field selections — always reference the fragment
- Never include fields ending in `_private`

## Error handling

`executeQuery` propagates errors from `@datocms/cda-client`. Failures fail the request during the per-request render (desired — fail fast), surfacing as Astro error pages. Nothing is rendered at build time (ISR).

## Type generation

Types come from `schema.ts`, managed by `npm run generate-schema`. Import CMS types from `~/lib/datocms/types`. Never write CMS types by hand.

## Cache tags (Cloudflare only)

Cache tags drive the Workers Cache on the Cloudflare target (branch `chore/cloudflare`). Vercel production does not use them: it revalidates by URL, see `docs/guidelines/caching.md`.

- `executeQuery` feeds a per-request store. On Cloudflare the middleware opens it for GET requests outside `/api`; a published query then runs through `rawExecuteQuery` with `returnCacheTags` and adds the response's `x-cache-tags` to the store. On Vercel there is no store and the query runs as before.
- A draft query (`includeDrafts: true`) marks the store disabled: the page becomes `private, no-store`, never cached.
- `BaseLayout` passes `cacheTagScope: 'layout'` on its site query. That flag tells the middleware the page carries the layout's tags (menus, favicon), so a page publish purges it. Pass it only from the layout.
- Queries never call `cache.set` or `cache.invalidate`: the middleware makes the one cache decision after the response, and `POST /api/invalidate-cache` purges. A new query needs nothing: its tags are collected automatically.
- Code: `src/lib/datocms/cacheTags.ts`, `executeQuery.ts`, `cacheInvalidation.ts`. Check with `npm run check:cache-tags`. Policy, limits and purge answers are in `caching.md`.
