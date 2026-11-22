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

Four layers:

1. **`/docs/guidelines/`** — canonical policies (routing, assets, SEO, security, etc.). Modify carefully; document significant decisions in `docs/decisions-log/`.
2. **`/docs/current-state.md`** — living snapshot of actual implementation status. Update when features change.
3. **`/docs/list-*.md` · `TODO.md` · `decisions-log/`** — component/helper/model inventories, open tasks, and architectural decisions.
4. **`/docs/work/`** — development works run with Flow (`/flow:dev`). See "Works with Flow" below.

`/docs/shapes/` holds shaped proposals written before Flow was adopted (see "Legacy shapes").

## Quick Reference

| Need                          | File                                       |
| ----------------------------- | ------------------------------------------ |
| Project structure & routes    | `docs/guidelines/project-structure.md`     |
| Blocks & components authoring | `docs/guidelines/blocks-and-components.md` |
| GraphQL / CMS data loading    | `docs/guidelines/cms-data-loading.md`      |
| CMS content modelling         | `docs/guidelines/cms-content-modelling.md` |
| Assets (images, video, icons) | `docs/guidelines/assets.md`                |
| SEO                           | `docs/guidelines/seo.md`                   |
| Search                        | `docs/guidelines/search.md`                |
| Preview / draft mode          | `docs/guidelines/preview-mode.md`          |
| Security                      | `docs/guidelines/security.md`              |
| Caching / revalidation        | `docs/guidelines/caching.md`               |
| Testing                       | `docs/guidelines/testing.md`               |
| Operations (build, deploy)    | `docs/guidelines/operations.md`            |
| Performance                   | `docs/guidelines/performance.md`           |
| i18n                          | `docs/guidelines/i18n.md`                  |
| Dependencies                  | `docs/guidelines/dependencies.md`          |
| Current implementation status | `docs/current-state.md`                    |
| Component catalogue           | `docs/list-components.md`                  |
| Helper catalogue              | `docs/list-helpers.md`                     |
| Model catalogue               | `docs/list-models.md`                      |
| Open tasks                    | `docs/TODO.md`                             |

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

## Works with Flow

Development work (features, upgrades, migrations, multi-file fixes) runs through the Flow plugin: start or resume it with `/flow:dev`.

- `.flow.yml` (repo root) — Flow's configuration: stacks `[astro, datocms]`, `merge: local`
- `docs/development-guidelines.md` — references, test level, gate and deviations; Flow reads it whole in every plan, review, execution and close
- `docs/work/<date>-<slug>/` — one folder per work: `STATUS.md` (phase, slice, step, Log), `slices.md`, `lessons.md`, and per slice `V<n>-plan.md`, `V<n>-packet.md`, `V<n>-ledger.md`
- `docs/decisions-log/` — decisions are proposed at the close of a step and written only on a yes
- Closing a work: changelog and version (`/flow:changelog`), then archive (`/flow:archive`), then merge — each step asks first
- New work starts with `/flow:dev`, not with a new shape file

## Legacy shapes

`/docs/shapes/` contains shaped work proposals written before Flow. They are a backlog of ideas, not a working system: to act on one, open a Flow work from it with `/flow:dev` and pass the shape file as source material. Keep `docs/shapes/README.md` index up to date when a shape is taken over by a work or dropped.

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
