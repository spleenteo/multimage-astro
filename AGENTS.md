# Repository Guidelines

## DatoCMS Documentation

Whenever you need information about DatoCMS, you can always trust the `DATOCMS.md`that contains the entire documentation with examples.

## Project Structure & Module Organization

`src/` contains all Astro source files: `src/pages/` for routed pages (e.g., `libri/`, `autori/`, `info/`), `src/components/` for reusable UI such as `BookCard.astro`, and `src/lib/` for shared utilities, DatoCMS query helpers, and layout logic. Asset originals live in `public/`. Automation scripts (including the DatoCMS schema generator) reside in `scripts/`. The root `DATOCMS.md` documents content models and should be treated as the canonical data reference.

## Build, Test, and Development Commands

- `npm run dev`: start Astro in dev mode with hot reload.
- `npm run build`: run `astro check` followed by a production build; use before PRs.
- `npm run generate-schema`: regenerate `schema.ts` via the DatoCMS CLI whenever models change.
- `npm run lint` / `npm run format`: check or apply Prettier formatting.

## Coding Style & Naming Conventions

Write components in Astro/TypeScript with 2-space indentation. Favor TypeScript types from `schema.ts` or the view-model helpers in `src/lib/datocms/types.ts`; avoid re-declaring GraphQL shapes. Use the DatoCMS `<Image>` component for CMS-driven images, mirroring the implementations in `BookCard.astro` and `AuthorCard.astro`. Run Prettier before committing to keep code style consistent.

## Testing Guidelines

There is no dedicated unit-test suite; rely on `astro check` plus `npm run build` for static analysis. When touching CMS queries, validate pages against real preview content and confirm anchor/link behavior (e.g., alphabetical menus, supplier groups). Document manual QA steps in PR descriptions.

## Commit & Pull Request Guidelines

Commit messages in this repo are short, imperative descriptions (e.g., “Fix image component by Astro”). Group related changes and commit frequently rather than monolithic updates. PRs should include: summary of changes, affected routes/components, any schema updates, and screenshots or URLs for UI tweaks. Reference relevant issues or Linear tickets when available.

## DatoCMS & Configuration Tips

Environment variables for CDA/CMA tokens are defined in `datocms.json`; ensure they are present locally before running data-dependent commands. Never edit `schema.ts` or `schema.graphql` manually—always regenerate with `npm run generate-schema`. Never update `DATOCMS.md` this is a downloaded file to access DatoCMS's documentation in a super fast way.
