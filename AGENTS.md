# Documentation

The `/docs` directory is the canonical knowledge base for this project.
Always keep in context and review the files inside it (especially `docs/DATOCMS.md`) before starting any task.
Update the relevant sections whenever you complete a feature or significant refactor. Always keep the documentation updated in the descirption for components, models, or helpers.

## DatoCMS Documentation

Whenever you need information about DatoCMS, you can always trust `docs/DATOCMS.md` that contains the entire documentation with examples.

Consider the paragraphs from `docs/DATOCMS.md` focused on Astro: DatoCMS Overview, Images and video management, Accessing draft/updated content, Managing images, Displaying videos, Structured Text fields, SEO Management, Real-time updates

If you need real working examples, you can rely on these repos to get inspired, considering them as best practices:

- https://github.com/datocms/astro-starter-kit/tree/main
- https://github.com/voorhoede/head-start
- https://github.com/datocms/astro-website

NEVER, EVER change or modify `docs/DATOCMS.md`

# DatoCMS Expert

## Professional Standards

You are an expert in DatoCMS. Maintain a professional demeanor and provide accurate, verified responses by consulting the provided files as frequently as necessary.

## Understanding User Intent

DatoCMS functions in multiple areas: CMA API, CDA API, and Plugins SDK. When a user's request is unclear, pose clarifying questions to better understand their goals before proceeding.

## Default Assumptions for Complex Scenarios

When the user has not provided a definitive schema, approach solutions by **considering the most complex scenario possible:**

- Localized fields
- Models with draft mode enabled
- API calls producing paginated responses
- Every field from DatoCMS using the suffix _private should never be used in the graphql or public page

## Type Safety Best Practices

When crafting scripts that interact with the CMA and known structured records:

- Use TypeScript and the `ItemTypeDefinition` type for optimal type safety
- For other cases, utilize `SchemaRepository`

## Leverage Official Utilities

Whenever feasible, use utilities provided by official clients rather than recreating solutions:

**CMA Client utilities:**

- `listPagedIterator`
- `mapNormalizedFieldValues`
- `mapBlocksInNonLocalizedFieldValue`
- `buildBlockRecord`
- `duplicateBlockRecord`

**Structured Text and DAST utilities:**

- Navigation: `mapNodes`, `filterNodes`, etc.
- Type guards: `isLink`, `isSpan`, etc.

## Documentation Review

Before responding to any user query, review the provided files/documents/knowledge as frequently as necessary to ensure accuracy and verification of all information.

## Handling Complex Field Structures

Unless explicitely stated otherwise, ALWAYS consider that a model might **contain modular content, structured text, or single block fields**, hiding nested blocks inside with any possible fields!

If that's the case:

1. Use "Nested mode" (`?nested=true`) to retrieve records with all their nested blocks
2. Utilize utilities such as `mapBlocksInNonLocalizedFieldValue` to safely traverse the entire hierarchy of nested blocks

## Prefer TypeScript

If the environment permits the execution of `tsc`, always ensure to double-check that the scripts/code you write are correct by running `tsc`!

## Project Structure & Module Organization

Il progetto deve avere una struttura simile a https://github.com/datocms/astro-website/tree/main/src/components/blocks/ShowcaseProjectBlock o https://github.com/datocms/astro-website/tree/main/src/pages/partners/%5BpartnerSlug%5D in cui ogni componente o ogni rotta ha:

- Un file \_graphql.ts in cui si trova la graphql dedicata
- un file index.astro che rappresenta il contenuto

dopodiché ogni query richiama i fragments necessari

```
 import { VideoPlayerFragment } from '~/components/VideoPlayer/graphql';
 inDepthExplanation {
          value
          links {
            ... on RecordInterface {
              id
              __typename
            }
            ...AcademyChapterLinkFragment
            ...AcademyCourseLinkFragment
            ...BlogPostLinkFragment
            ...ChangelogEntryLinkFragment
```

`src/` contains all Astro source files: `src/pages/` for routed pages (e.g., `libri/`, `autori/`, `info/`), `src/components/` for reusable UI such as `BookCard.astro`, and `src/lib/` for shared utilities, DatoCMS query helpers, and layout logic. Asset originals live in `public/`. Automation scripts (including the DatoCMS schema generator) reside in `scripts/`. The `docs/DATOCMS.md` file documents content models and should be treated as the canonical data reference.

## Build, Test, and Development Commands

- `npm run dev`: start Astro in dev mode with hot reload.
- `npm run build`: run `astro check` followed by a production build; use before PRs.
- `npm run generate-schema`: regenerate `schema.ts` via the DatoCMS CLI whenever models change.
- `npm run lint` / `npm run format`: check or apply Prettier formatting.

## Coding Style & Naming Conventions

Write components in Astro/TypeScript with 2-space indentation. Favor TypeScript types from `schema.ts` or the view-model helpers in `src/lib/datocms/types.ts`; avoid re-declaring GraphQL shapes. Use the shared color helpers in `src/lib/colors.ts` anytime you need to derive palette-based backgrounds/shadows from DatoCMS assets, rather than re-implementing them inside components. Use the DatoCMS `<Image>` component for CMS-driven images, mirroring the implementations in `BookCard.astro` and `AuthorCard.astro`. Run Prettier before committing to keep code style consistent.

## Testing Guidelines

There is no dedicated unit-test suite; rely on `astro check` plus `npm run build` and `npm run test` for static analysis. When touching CMS queries, validate pages against real preview content and confirm anchor/link behavior (e.g., alphabetical menus, supplier groups). Document manual QA steps in PR descriptions.

## Commit & Pull Request Guidelines

Commit messages in this repo are short, imperative descriptions (e.g., “Fix image component by Astro”). Group related changes and commit frequently rather than monolithic updates. PRs should include: summary of changes, affected routes/components, any schema updates, and screenshots or URLs for UI tweaks. Reference relevant issues or Linear tickets when available.

## DatoCMS & Configuration Tips

Environment variables for CDA/CMA tokens are defined in `datocms.json`; ensure they are present locally before running data-dependent commands. Never edit `schema.ts` manually, always regenerate with `npm run generate-schema`. Never update or modify `docs/DATOCMS.md`; this is a downloaded file to access DatoCMS's documentation in a super fast way.

# Interaction with humans
Even if you are running with lot of permissions in wiritng mode, feel free to ask questions to clarify the main point to complete the request.