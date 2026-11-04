# Slices — upgrade-2026-11

High-level plan. Every slice is demonstrated by the gate (`npm run lint` + `npm run build`, 100% green locally) plus its own Done. Rule for the whole work: DatoCMS is touched only through the `datocms` CLI and the DatoCMS skills (`datocms-cli`, `datocms-cda`, `datocms-frontend-integrations`), never from memory.

Deploy policy (user, 2026-11-04): during slices only Vercel **preview** deploys (`vercel deploy`). At the end of the work: local merge into `main`, then a **production** deploy (`vercel --prod`, asked first) and the cache procedure re-run on production; the user pushes `main` so the Git integration does not redeploy an older `main`. A fresh deployment starts with an empty ISR cache: expect MISS, warm a few URLs, then check HIT (FOT cost, Hobby plan).

Baseline (`npm outdated`, 2026-11-04): astro 6.3.3 (latest 7.4.5), @astrojs/vercel 10.0.7 (11.0.18), @datocms/cda-client 0.2.10 (0.3.2), @datocms/cma-client 5.4.18 (6.8.0), datocms CLI 4.0.28 (4.2.0), tailwindcss 3.4.19 (4.3.4), typescript 5.9.3 (7.0.2; 6.0.3 available), swiper 12.1.4 (14.4.0), jsdom 29.1.1 (30.1.3), @types/jsdom 28 (30), prettier-plugin-astro 0.14.1 (1.1.2), plus patch/minor on the rest. `.nvmrc` is Node 20 (EOL April 2026).

Out of scope: TypeScript 7 (`@astrojs/check` peer is `typescript ^5 || ^6`; goes to TODO), DatoCMS cache tags (CD3 / shape `2026-03-05-cache-tags.md`, a separate work).

## Rules for every slice (from impact)

- **The gate renders nothing.** Every route is ISR (`output: 'server'`, nothing prerendered), so `astro build` runs no CMS query and no page render. From V3 on, every Done adds a **dev smoke**: home, `/libri`, one book, one author, one structured-text page (info or magazine), `/staff` → 404 without session, one draft read.
- **`/api/revalidate` is never called against production by hand.** Locally `PUBLIC_SITE_URL` is production: the endpoint fetches production URLs with `x-prerender-revalidate` and triggers the production Site Search reindex. Local runs override, for the session only, `PUBLIC_SITE_URL=http://localhost:4321` and `SITE_SEARCH_BUILD_TRIGGER_ID=` (empty) in the shell (process env wins over `.env`). `astro preview` does not work with `@astrojs/vercel`: use `astro dev`.
- **The endpoint's `success` count lies** (`revalidate/index.ts:55` counts 401/404 as fulfilled): judge by `x-vercel-cache` / `age` headers, never by the JSON counts.
- **Dev server hygiene.** `npm run dev` runs `sync-datocms`, which rewrites `schema.ts`; Astro 7 `astro dev` backgrounds itself when it detects an agent. After each local check: stop the server (`lsof -nP -iTCP -sTCP:LISTEN`) and restore `schema.ts` unless the slice regenerates it on purpose. Nothing in `src` imports `schema.ts`: a regenerated `schema.ts` says nothing about type safety.
- **Docs step at each close**: `docs/current-state.md`, `docs/guidelines/dependencies.md`, the affected guidelines, `TODO.md`; a decision in `docs/decisions-log/` for Astro 7 and Tailwind 4.

## V1 — Cache baseline

**In**:
- Audit of the caching as it is: ISR config in `astro.config.mjs` (`bypassToken`, `expiration`, `exclude`), `/api/revalidate` (`webhookPayload.ts`, `revalidationUrls.ts`, `recordInfo.ts`, `?mode=full`, Site Search reindex), draft-mode bypass cookie.
- Live DatoCMS side, read-only via CLI/skills: webhook 33942 (payload v3, no filter, publish/unpublish/delete, no upload events), models (`datocms schema:inspect`).
- Audit shaped as **route → models it reads (layout included) → is it revalidated**, not "models mapped vs. models existing". Known gaps from impact: 7 mapped api_keys that don't exist (`books_index`, `archive_index`, `highlights_index`, `ebooks_index`, `collections_index`, `authors_index`, `magazine_index`; real model is `index_page`, read by slug); `supplier`, `license`, `app` unmapped; `page` feeds header/footer menus on every page; book unpublish/delete skips author and collection pages; slug change leaves the old URL cached. The "Models:" list in `decisions-log/2026-06-20-fot-reduction.md` is marked as wrong.
- Baseline snapshot of `.vercel/output/functions/_isr.prerender-config.json` and the routes in `.vercel/output/config.json`, built with `BYPASS_TOKEN` exported (the config reads `process.env`), as the expected-diff reference for V4.
- Repeatable verification procedure, written in a new `docs/guidelines/caching.md`: (a) **no-network** check of the URL map — `parseWebhookPayload` + `getRevalidationUrls` run with sample payloads per model (script via `tsx`); (b) local `astro dev` with the overrides above, calling `/api/revalidate` with a sample payload and an unmapped-model payload; (c) deployed: **passive only** — `curl -I` on affected URLs for `x-vercel-cache`/`age` after a real editorial publish; never POST to the production endpoint.
- Fix or retire the stale preview docs: `docs/preview-mode.md` (2025-11-16 `SERVER` snapshot) and the "invalidate everything, ~669 CDA reads" passage in `docs/guidelines/preview-mode.md`; `docs/guidelines/operations.md` (`npm run preview`). State plainly: "cache tags: not implemented, revalidation is URL-based".
**Out**: changing caching behaviour (that's V2); implementing cache tags.
**Done**: `caching.md` exists; procedure (a) and (b) run and recorded; (c) run once on production headers (read-only); gaps listed with their fate (V2 or TODO).
**Gotchas**: never `?mode=full` on production; read-only on DatoCMS; the bypass token value never printed.

**Deviations found while planning V1**
- T7 also edits `docs/guidelines/cms-data-loading.md` (cache tags described as "planned") and adds a Caching row to the `CLAUDE.md` Quick Reference.
- Stale `SERVER`/`prerender` passages in `docs/guidelines/project-structure.md` go to `TODO.md`, not fixed (mandate names only the preview docs and `operations.md`).

## V2 — Revalidation map fixes

**In**: in `revalidationUrls.ts` and `recordInfo.ts` (shared with `/api/preview-links` and `/api/seo-analysis`): map `index_page` by slug (libri, ebooks, highlights, archivio, collane, autori, magazine, distributori) to its index URL and remove the 7 non-existent api_keys; map `supplier` → `/distributori`, `license` → the book pages/cards it appears on, `app` → the pages that read it. Unit-level check with the V1 no-network script, extended with the new cases.
**Out** (to TODO, design choices): `page` → menus on every page (would mean a full sweep, FOT cost); book unpublish/delete → author/collection pages; slug change → old URL; `success` count fix in the endpoint.
**Done**: gate green; V1 procedure (a) green with the new cases; Web Previews links for index pages resolve (they share `recordInfo.ts`); after merge+deploy, a real publish of an index page shows the index URL revalidated.

## V3 — Patch/minor, Node 24, TypeScript 6

**In**: `npm update` within ranges and bump ranges for patch/minor (astro 6.4.x, @astrojs/check, ts-plugin, @datocms/astro, content-link, prettier 3.9, postcss, esbuild, autoprefixer, dotenv-cli, serialize-error); **`datocms` CLI stays on 4.0.x** (4.2 pulls the CMA v6 family: moved to V5); `.nvmrc` → 24 and `"engines": { "node": "24.x" }` in `package.json`; TypeScript 5.9 → 6.0.3; `.vercelignore` with at least `.env*`.
**Out**: any major other than TypeScript 6.
**Done**: gate green; `astro check` 0 errors; `npm ls` without peer errors.
**Gotchas**: prettier minor may reformat files → `npm run format` once, committed separately; TS 6 deprecations (`baseUrl`, `moduleResolution: node`) in `tsconfig.json`.

## V4 — Astro 7 + @astrojs/vercel 11

**Entry conditions** (user): `vercel link` to the existing Vercel project, confirmed; Node 24.x on the project; `BYPASS_TOKEN` and the other env vars present in the Preview environment (names only); preview Deployment Protection bypass known.
**In**: astro 7.x, @astrojs/vercel 11.x, aligned @astrojs/* packages, following the official upgrade guide; pin `compressHTML: true` (Astro 7 default is `'jsx'`, strips whitespace between elements); ISR config (option names unchanged in 11; `allowQuery` gains `x_astro_path_token`, rewrite uses `$1` — compare with the V1 snapshot); middleware (`src/middleware.ts`, editor session gating, CSP); draft mode endpoints; `@datocms/astro` under the new compiler.
**Out**: Tailwind, DatoCMS client majors.
**Done**: gate green; ISR config diff against V1 snapshot only as expected; dev smoke green; Vercel **preview** deploy: the smoke routes, `/staff` 404 checked **before and after** the draft test in a clean session, draft mode enable sets **`__prerender_bypass`**; `/api/revalidate` on the preview called only if the Preview build's `PUBLIC_SITE_URL` is the preview origin, otherwise only the unmapped-model no-op payload.
**Gotchas**: never `throw new Response()` in frontmatter; Content Link header coupled to `DATOCMS_BASE_EDITING_URL`; without `BYPASS_TOKEN` an editor's draft render (carrying the draft CDA token) is cached for anonymous visitors — TODO: `/api/draft-mode/enable` refuses on Vercel when `BYPASS_TOKEN` is unset.

## V5 — DatoCMS clients and CLI

**In**: @datocms/cda-client 0.3, @datocms/cma-client 6, **`datocms` CLI 4.2** (moved from V3), regenerate `schema.ts`; following the changelogs via the DatoCMS skills. Scope: `src/lib/datocms/executeQuery.ts` (Content Link, `baseEditingUrl`, `includeDrafts`, `excludeInvalid`, `environment`); **delete the type shims** `src/types/datocms-cma-client.d.ts` and `src/types/datocms.d.ts` so the real v6 types apply (they deep-import files that don't exist and resolve to `any` under `skipLibCheck`); `src/pages/api/utils.ts` (`ApiError`, `serializeError`), `/api/revalidate` (`buildTriggers.reindex`), `/api/seo-analysis` (`items.rawFind`), `/api/post-deploy` (`plugins.*`).
**Out**: query rewrites not required by the upgrade.
**Done**: gate green with the shims gone; `reindex`, `rawFind`, `plugins.*` signatures checked against the CMA docs; dev smoke green (draft and published reads); a 500 from `api/utils.ts` no longer echoes the CDA token (cda-client 0.3.1 redacts it).

## V6 — Other majors

**In**: swiper 14 pinned to an **exact** version (as `docs/guidelines/dependencies.md` asks), jsdom 30 + @types/jsdom 30, prettier-plugin-astro 1.x.
**Done**: gate green; dev smoke green; local call to `/api/seo-analysis` with a real record id (only place jsdom runs; read-only); carousels checked on the **production bundle** (`public/generated/`, built by esbuild in prebuild) on home, a book page and a structured-text page with `BookCarouselBlock`; prettier output stable (format diff committed separately).

## V7 — Tailwind 4

**In**: tailwindcss 4 with `@tailwindcss/vite`; theme from `tailwind.config.mjs` into `@theme`; **font stacks defined once in `@theme`**, removing `--font-sans`/`--font-serif` from `:root` in `global.css` and from the config (otherwise a cyclic variable drops the site to the default font); in all 37 `*.module.css`: replace `@tailwind components;` with `@reference` to the global/theme CSS and **remove the `@layer components {}` wrappers** (33 files) so the cascade stays unlayered as today (native layers would lose to `swiper/css/bundle`); `global.css` is the entry, no `@reference`; `container` rewritten as `@utility`; borderRadius/letterSpacing overrides; remove autoprefixer and the tailwind PostCSS plugin, delete the dead one of `postcss.config.cjs` / `postcss.config.mjs`; default changes (border colour, ring, shadow scale).
**Done**: gate green; dev smoke green; visual check page by page before/after (home, libri, libro, autori, autore, collane, magazine, info, distributori, staff), carousel and module headings in particular; final Vercel preview deploy green, cache procedure green.
**Gotchas**: silent visual regressions; layer order.
