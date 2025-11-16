---
agent_edit: true
scope: Living record of GraphQL/data-loading behaviors
---

# CMS Data Loading — Current State (2025-11-16)

- All GraphQL calls go through `src/lib/datocms/executeQuery.ts`, which swaps CDA tokens based on `includeDrafts` and propagates cache tags (future work in docs/TODO.md **CD3**).
- Pages and layouts access data via collocated `_graphql.ts` modules that export both the query string and typed helpers; there is no global query registry.
- Draft Mode detection happens through `resolveDraftMode(Astro)` → `draftModeEnabledFromAstro`, allowing every fetch to opt into `includeDrafts` when SSR is active (`SERVER=preview`).
- Static builds (`SERVER=static`) execute all queries at build time and embed published data into the prerendered HTML; preview builds rerun queries per request.
- There is no pagination yet—routes such as `/libri`, `/autori`, `/sitemap.xml`, and staff exports still request up to 500 items, which is slated for refactor (**CD2**).
- Error handling bubbles up from `@datocms/cda-client`; failures currently crash the build (desired) but there’s no user-friendly fallback aside from Astro’s error page.

Reference `/docs/guidelines/cms-data-loading.md` for query conventions, caching rules, and listener patterns.
