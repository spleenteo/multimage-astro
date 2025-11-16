---
agent_edit: true
---

# Split guidelines from editable docs

**Moved long-lived policy docs into `/docs/guidelines/**` (read-only) so day-to-day inventories stay editable under `/docs`.**

- Date: 2025-11-16
- Alternatives Considered:
  - Keep every document in `/docs` and rely on `agent_edit` flags only (hard to understand at a glance which files are safe to edit).
  - Duplicate documents instead of moving them (risked divergence between guideline copies and living docs).

## Decision

- Created `/docs/guidelines/` and relocated accessibility, assets, CMS modelling/loading, routing, performance, preview, search, SEO, security, testing, and similar policy docs there.
- Marked every guideline with `agent_edit: false` so automation and contributors cannot modify them accidentally.
- Left operational inventories (`list-*.md`, `TODO.md`, decision log, prompts) at the root so they remain editable during feature work.
- Updated `AGENTS.md` and repository references to point to the new paths, highlighting that `/docs/guidelines` is read-only.

## Consequences

- Contributors now quickly understand which documents are immutable policies versus living inventories.
- Any future edits to guidelines require maintainer approval or an explicit frontmatter change, reducing accidental churn.
- Existing tasks referencing policy docs continue to work because all paths now point at `/docs/guidelines/...`.
