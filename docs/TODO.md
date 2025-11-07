---
agent_edit: true
scope: Codex adds things to be done as a list of tasks, suggestions, urgencies
---

- [ ] [Security] [Impact: H] [Effort: L] [Owner: @codex] [Status: todo] — Lock down `/staff` tools and CSV export so inventory data is no longer publicly prerendered (`src/pages/staff/index.astro`, `src/pages/staff/archivio-catalogo/index.astro`, `public/robots.txt`).
- [ ] [Security] [Impact: H] [Effort: M] [Owner: @codex] [Status: todo] — Sanitize or replace `toRichTextHtml` usages to prevent XSS in `src/lib/text.ts`, homepage hero, supplier cards, and author pages.
- [ ] [Features] [Impact: M] [Effort: M] [Owner: @codex] [Status: todo] — Restore draft/preview query pipeline so `executeQuery` honors `includeDrafts` and swaps tokens automatically.
- [ ] [Features] [Impact: M] [Effort: M] [Owner: @codex] [Status: todo] — Implement `/api/draft-mode`, `DraftModeToggler`, and `DraftModeQueryListener` wiring per `docs/preview-mode.md`.
- [ ] [Refactoring] [Impact: M] [Effort: M] [Owner: @codex] [Status: todo] — Replace scattered `first: 500` GraphQL limits with pagination helpers or batched feeds (books, authors, sitemap, staff exports).
- [ ] [Testing] [Impact: L] [Effort: M] [Owner: @codex] [Status: todo] — Add CI automation (`npm run lint`, `npm run build`) and seed unit tests for utilities (search client, CSV helpers, GraphQL contracts).
