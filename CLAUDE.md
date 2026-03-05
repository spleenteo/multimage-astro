# 1) Mission & Scope

**Multimage** — website for a non-profit editorial association publishing books on nonviolence and human rights.

**Stack:** Astro · Tailwind · Iconify · DatoCMS · Vercel · npm
**Language:** TypeScript + GraphQL
**Features:** Static routes, dynamic routes, Astro Islands, query listeners, cache tags, preview/draft mode via Vercel.

## Objectives

- Maintainable structure the team can evolve over time
- Follow guidelines under `/docs/guidelines/`
- Keep `/docs/list-*.md`, `/docs/TODO.md`, and `/docs/current-state.md` in sync with the codebase
- Avoid repetition: create helpers, fragments, and shared queries instead of duplicating code

## Never Do

- **Do not push** to any remote branch — open an Issue instead (attach a patch file if applicable)
- **Never include** GraphQL fields ending in `_private`
- **Never edit `schema.ts` manually** — regenerate with `npm run generate-schema`
- Never touch credentials, `.env*` files, or environment variable definitions

# 2) Documentation System

Three layers:

1. **`/docs/guidelines/`** — canonical policies (routing, assets, SEO, security, etc.). Modify carefully; document significant decisions in `docs/decision-log/`.
2. **`/docs/current-state.md`** — living snapshot of actual implementation status. Update when features change.
3. **`/docs/list-*.md` · `TODO.md` · `decision-log/`** — component/helper/model inventories, open tasks, and architectural decisions.

## Quick Reference

| Need | File |
|------|------|
| Project structure & routes | `docs/guidelines/project-structure.md` |
| Blocks & components authoring | `docs/guidelines/blocks-and-components.md` |
| GraphQL / CMS data loading | `docs/guidelines/cms-data-loading.md` |
| CMS content modelling | `docs/guidelines/cms-content-modelling.md` |
| Assets (images, video, icons) | `docs/guidelines/assets.md` |
| SEO | `docs/guidelines/seo.md` |
| Search | `docs/guidelines/search.md` |
| Preview / draft mode | `docs/guidelines/preview-mode.md` |
| Security | `docs/guidelines/security.md` |
| Testing | `docs/guidelines/testing.md` |
| Operations (build, deploy) | `docs/guidelines/operations.md` |
| Performance | `docs/guidelines/performance.md` |
| i18n | `docs/guidelines/i18n.md` |
| Dependencies | `docs/guidelines/dependencies.md` |
| Current implementation status | `docs/current-state.md` |
| Component catalogue | `docs/list-components.md` |
| Helper catalogue | `docs/list-helpers.md` |
| Model catalogue | `docs/list-models.md` |
| Open tasks | `docs/TODO.md` |

## DatoCMS

Use the installed skills — no local documentation file exists for DatoCMS:

- **`datocms-cda-skill`** — GraphQL Content Delivery API, queries, fragments, pagination, responsive images
- **`datocms-cma-skill`** — Content Management API, bulk operations, publishing, asset uploads
- **`datocms-cli-skill`** — CLI commands: `schema:generate`, migrations, environments
- **`datocms-frontend-integrations-skill`** — Astro integration, draft mode, real-time updates, cache tags

## After a Feature is Confirmed Complete

1. Update any affected `/docs/guidelines/` files if conventions changed
2. Update `/docs/list-*.md` for new/changed components, helpers, or models
3. Update `/docs/current-state.md` for affected areas
4. Update `/docs/TODO.md` (mark done, add follow-ups)

## `docs/prompts/` folder

Contains legacy audit and workflow prompts from previous tooling. Ignore unless explicitly asked to use them. Any reference to `AGENTS.md` in those files means `CLAUDE.md`.

# 3) TODO.md Format

```
- [ ] [Area] [Impact: H|M|L] [Effort: H|M|L] [Owner: @handle] [Status: todo|wip|done] — description
```

Areas: `Refactoring` · `Security` · `Performance` · `Features` · `Documentation`
Sort by Impact desc, then Effort asc. Reference Issue IDs when available.

Completed tasks go to the bottom:

```
- [YYYY-MM-DD] - [Area] **Feature name**: short description
```

# 4) Style & Conventions

## Commits & PRs

Short imperative messages (e.g. "Fix image component in Astro"). Group related changes. PRs include: summary, affected routes/components, schema changes, screenshots for UI tweaks. Reference Issues or Linear tickets.

## DatoCMS & Config

- Env vars defined in `datocms.json` for local use; set per Vercel environment for deployment
- Never edit `schema.ts` manually — run `npm run generate-schema`
- `npm run dev`/`start` auto-runs `npm run sync-datocms` (schema generation only, no external downloads)

# 5) Working with Humans

Analyze before writing code. Ask concise, targeted questions when context is unclear. Even with broad permissions, clarify before guessing.
