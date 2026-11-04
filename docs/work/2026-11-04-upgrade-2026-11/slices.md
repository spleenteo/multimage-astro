# Slices — upgrade-2026-11

High-level plan. Every slice is demonstrated by the gate (`npm run lint` + `npm run build`, 100% green locally) plus its own Done. Rule for the whole work: DatoCMS is touched only through the `datocms` CLI and the DatoCMS skills (`datocms-cli`, `datocms-cda`, `datocms-frontend-integrations`), never from memory.

Baseline (`npm outdated`, 2026-11-04): astro 6.3.3 (latest 7.4.5), @astrojs/vercel 10.0.7 (11.0.18), @datocms/cda-client 0.2.10 (0.3.2), @datocms/cma-client 5.4.18 (6.8.0), tailwindcss 3.4.19 (4.3.4), typescript 5.9.3 (7.0.2; 6.0.3 available), swiper 12.1.4 (14.4.0), jsdom 29.1.1 (30.1.3), @types/jsdom 28 (30), prettier-plugin-astro 0.14.1 (1.1.2), plus patch/minor on the rest. `.nvmrc` is Node 20 (EOL April 2026).

Out of scope: TypeScript 7 (`@astrojs/check` peer is `typescript ^5 || ^6`; goes to TODO), DatoCMS cache tags (CD3 / shape `2026-03-05-cache-tags.md`, a separate work).

## V1 — Cache baseline

**In**: audit of the current caching as it is: Vercel ISR config in `astro.config.mjs` (`bypassToken`, `expiration`, `exclude`), `/api/revalidate` (webhook payload parsing, `revalidationUrls.ts` surgical map, `?mode=full`, Site Search reindex), draft-mode bypass cookie. Read the live DatoCMS side through the CLI and skills: webhook 33942 (events, URL, payload), models mapped vs. models existing (`datocms schema:inspect`), so an unmapped model is found. Write a repeatable verification procedure (local: build + call `/api/revalidate` with a sample payload and check the URL list; deployed: publish a record → `x-vercel-cache` STALE/HIT on the affected URLs) in `docs/guidelines/preview-mode.md` or a new `docs/guidelines/caching.md`. Also the docs answer: "cache tags: not implemented, revalidation is URL-based".
**Out**: changing the caching behaviour; implementing cache tags.
**Done**: the procedure exists, run once against current production (read-only checks), and its outcome is recorded; any gap found goes to TODO, not fixed here unless trivial.
**Gotchas**: never trigger `?mode=full` on production; read-only on DatoCMS.

## V2 — Patch/minor, Node 24, TypeScript 6

**In**: `npm update` within ranges and bump ranges for patch/minor (astro 6.4.x, @astrojs/check, ts-plugin, @datocms/astro, content-link, datocms CLI 4.2, prettier 3.9, postcss, esbuild, autoprefixer, dotenv-cli, serialize-error); `.nvmrc` → 24 and `engines`; TypeScript 5.9 → 6.0.3. Regenerate `schema.ts` with `npm run generate-schema` if the CLI bump changes output.
**Out**: any major other than TypeScript 6.
**Done**: gate green; `astro check` 0 errors; `npm ls` without peer errors. Node version on Vercel project noted (set by user if it is a dashboard setting).
**Gotchas**: prettier minor may reformat files → run `npm run format` once and commit separately; TS 6 deprecations (e.g. `baseUrl`, `moduleResolution: node`) in `tsconfig.json`.

## V3 — Astro 7 + @astrojs/vercel 11

**In**: astro 7.x, @astrojs/vercel 11.x, aligned @astrojs/* packages, following the official upgrade guide; ISR config, middleware (`src/middleware.ts`, editor session gating, CSP), draft mode endpoints, `@datocms/astro` compatibility.
**Out**: Tailwind, DatoCMS client majors.
**Done**: gate green; V1 procedure re-run locally green; a Vercel **preview** deploy (`vercel deploy`, never `--prod`) serves home, `/libri`, a book page, `/staff` 404 without session, draft mode enable, and `/api/revalidate` answers as in V1.
**Gotchas**: Astro 6 lesson — never `throw new Response()` in frontmatter; ISR `bypassToken`/`exclude` option names may change; Content Link header coupling with `DATOCMS_BASE_EDITING_URL`.

## V4 — DatoCMS clients

**In**: @datocms/cda-client 0.3, @datocms/cma-client 6, following their changelogs via the DatoCMS skills; `executeQuery.ts`, cache-related request options, CMA usage in scripts and `/api/revalidate` (Site Search reindex).
**Out**: query rewrites not required by the upgrade.
**Done**: gate green; draft and published reads work locally; Site Search reindex call compiles and its API signature is checked against the CMA docs.

## V5 — Other majors

**In**: swiper 14 (carousels), jsdom 30 + @types/jsdom 30, prettier-plugin-astro 1.x.
**Done**: gate green; carousels checked by hand on home and book pages; prettier output stable (format diff committed separately).

## V6 — Tailwind 4

**In**: tailwindcss 4 with `@tailwindcss/vite`, theme from `tailwind.config.mjs` into `@theme` (or `@config` as a bridge), `@reference` in the 34 CSS modules using `@apply` (288 uses), `container` rewritten as `@utility`, removal of autoprefixer/postcss tailwind plugin, default changes (border colour, ring, shadow scale).
**Done**: gate green; visual check page by page (home, libri, libro, autori, autore, collane, magazine, info, distributori, staff) before/after with no regressions; final Vercel preview deploy green, V1 procedure green.
**Gotchas**: silent visual regressions; both `postcss.config.cjs` and `postcss.config.mjs` exist — one is dead.
