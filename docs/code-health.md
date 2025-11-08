---
agent_edit: true
scope: Track maintainability issues, duplication, and refactors needed across the codebase.
---

# Code Health Checklist

## Key Issues

- Preview plumbing now swaps CDA tokens correctly, but there are no regression tests for the `/api/preview` flow or `DraftModeQueryListener`. Add unit/integration coverage so future refactors do not break drafts silently.
- Rich-text rendering mixes Structured Text serializers with manual `set:html` calls (home page hero, supplier cards, author pages). Consolidate on Structured Text renderers or sanitize HTML to keep escaping rules consistent.

## Duplication & Dead Code

- GraphQL queries repeatedly declare `first: 500` across pages (`src/pages/libri/[slug]/_graphql.ts`, `src/pages/autori/index/_graphql.ts`, `src/pages/sitemap.xml/_graphql.ts`). Extract pagination helpers or re-usable fragments so record limits live in one place.

## Maintainability Gaps

- Draft-mode tooling now exists; the remaining gap is observability. Add smoke tests (or at least a Playwright script) that calls `/api/preview` and asserts the toggler swaps state so regressions surface before deploys.
- Staff tooling still lives under `src/pages/staff/` alongside public content. Once auth is added, consider moving exports into a protected admin bundle or API endpoint to avoid accidental deployment.
