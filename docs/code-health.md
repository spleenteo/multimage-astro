---
agent_edit: true
scope: Track maintainability issues, duplication, and refactors needed across the codebase.
---

# Code Health Checklist

## Key Issues

- `executeQuery` still hardcodes `includeDrafts: false`, so preview mode silently fails. Implement the draft token swap and honor the `includeDrafts` option exposed by the helper.
- Rich-text rendering mixes Structured Text serializers with manual `set:html` calls (home page hero, supplier cards, author pages). Consolidate on Structured Text renderers or sanitize HTML to keep escaping rules consistent.

## Duplication & Dead Code

- GraphQL queries repeatedly declare `first: 500` across pages (`src/pages/libri/[slug]/_graphql.ts`, `src/pages/autori/index/_graphql.ts`, `src/pages/sitemap.xml/_graphql.ts`). Extract pagination helpers or re-usable fragments so record limits live in one place.

## Maintainability Gaps

- Draft-mode tooling mandated by AGENTS.md (QueryListener, toggler, `/api/preview`) is still missing. Add those components and API routes so editors can verify unpublished content safely.
- Staff tooling still lives under `src/pages/staff/` alongside public content. Once auth is added, consider moving exports into a protected admin bundle or API endpoint to avoid accidental deployment.
