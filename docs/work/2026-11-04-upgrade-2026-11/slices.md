# Slices — upgrade-2026-11

High-level plan. Every slice is demonstrated by the gate (`npm run lint` + `npm run build`, 100% green locally) plus its own Done. Rule for the whole work: DatoCMS is touched only through the `datocms` CLI and the DatoCMS skills (`datocms-cli`, `datocms-cda`, `datocms-frontend-integrations`), never from memory.

Deploy policy (user, 2026-11-04): during slices only Vercel **preview** deploys (`vercel deploy`). At the end of the work: local merge into `main`, then a **production** deploy (`vercel --prod`, asked first) and the cache procedure re-run on production; the user pushes `main` so the Git integration does not redeploy an older `main`. **Last step, after the production deploy: rotate `SECRET_API_TOKEN`** (TODO S6): the user sets the new value in Vercel env and in the webhook 33942 URL; then procedure (c) on a real publish, including one `index_page` publish whose index URL must show as revalidated (V2's deferred Done). A fresh deployment starts with an empty ISR cache: expect MISS, warm a few URLs, then check HIT (FOT cost, Hobby plan).

Baseline (`npm outdated`, 2026-11-04): astro 6.3.3 (latest 7.4.5), @astrojs/vercel 10.0.7 (11.0.18), @datocms/cda-client 0.2.10 (0.3.2), @datocms/cma-client 5.4.18 (6.8.0), datocms CLI 4.0.28 (4.2.0), tailwindcss 3.4.19 (4.3.4), typescript 5.9.3 (7.0.2; 6.0.3 available), swiper 12.1.4 (14.4.0), jsdom 29.1.1 (30.1.3), @types/jsdom 28 (30), prettier-plugin-astro 0.14.1 (1.1.2), plus patch/minor on the rest. `.nvmrc` is Node 20 (EOL April 2026).

Out of scope: TypeScript 7 (`@astrojs/check` peer is `typescript ^5 || ^6`; goes to TODO), DatoCMS cache tags (CD3 / shape `2026-03-05-cache-tags.md`, a separate work).

## Rules for every slice (from impact)

- **The gate renders nothing.** Every route is ISR (`output: 'server'`, nothing prerendered), so `astro build` runs no CMS query and no page render. From V3 on, every Done adds a **dev smoke**: home, `/libri`, one book, one author, one structured-text page (info or magazine), `/staff` → 404 without session, one draft read.
- **`/api/revalidate` is never called against production by hand.** Locally `PUBLIC_SITE_URL` is production: the endpoint fetches production URLs with `x-prerender-revalidate` and triggers the production Site Search reindex. Local runs override, for the session only, `PUBLIC_SITE_URL=http://localhost:4321` and `SITE_SEARCH_BUILD_TRIGGER_ID=` (empty) in the shell (process env wins over `.env`). `astro preview` does not work with `@astrojs/vercel`: use `astro dev`.
- **Dev servers.** Port 4321 runs the user's own `astro dev` (normal `.env`, so `PUBLIC_SITE_URL` = production): use it freely for GET smoke checks, **never** POST `/api/revalidate` to it. A run that needs the overrides (procedure b) starts its own server on a free port with `PUBLIC_SITE_URL` set to that same port. Port 4329 is another project (spleenteo.com): leave it.
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

**V1 — done on 2026-11-05**

V1 delivered docs/guidelines/caching.md (status: cache tags not implemented, revalidation URL-based; configuration; DatoCMS side from a read-only schema:inspect and webhook 33942 read; a 23-row route → models → revalidated table; 15 gaps, 4 fated V2 and 11 TODO, mirrored as "Cache gap #5–#15" in TODO.md), the offline check `npm run check:revalidation-map` (13 payloads, executeQuery stubbed through module.registerHooks, fetch blocked), the ISR/routes baseline under baseline/ for V4, and the three procedure runs. The route audit needed two fix rounds: reviews found blog_post/blog_author (book reviews) and license (every book card and the featured book) missing from most rows, so V2 must build its URL lists from the table, not from the impact list. The check first passed vacuously: module.register with tsx exits 0 without running the entry on Node 24, so it now uses module.registerHooks with an exit-code sentinel and needs Node >= 22.15 (.nvmrc is 20, UP-node in TODO). Procedure (b) on local astro dev returned 15 URLs (real catalogue, pages 2–9) and showed the success-count gap live: the fixture book page threw "Book not found" and was still counted ok. Procedure (c) found all URLs of the last publish HIT, but /distributori had the same age, so a deploy may have reset the cache; it also found Vercel caches the anonymous /staff 404 (gap #15). The webhook-calls CLI prints nothing with --json and its records carry ?token= in request_url: the procedure now pipes the plain output straight into a field-picking node filter, no file, no rm (the agent shell's hook blocks /bin/rm too). One executor printed SECRET_API_TOKEN once in its own terminal (not committed); rotation is the user's call. Rulings: README/project-structure stale runtime → TODO; tsx stays transitive → TODO; T1 and T7 extra commits accepted; the gate's pre-existing prettier failure on two src files fixed in V1, formatting only. The rm hook also blocked /bin/rm for executors; they used `del` (Trash) or Python.

## V2 — Revalidation map fixes

**In**: in `revalidationUrls.ts` and `recordInfo.ts` (shared with `/api/preview-links` and `/api/seo-analysis`): map `index_page` by slug (libri, ebooks, highlights, archivio, collane, autori, magazine, distributori) to its index URL and remove the 7 non-existent api_keys; map `supplier` → `/distributori`, `license` → the book pages/cards it appears on, `app` → the pages that read it. Unit-level check with the V1 no-network script, extended with the new cases.
Also: give `getRevalidationUrls` an injectable query function (`query = executeQuery` parameter, the endpoint keeps calling it as today) so `check:revalidation-map` passes its stub directly; drop `hooks.mjs`, `register-stubs.mjs` and the `module.registerHooks` / Node >= 22.15 requirement. Build the URL lists from the route table in `docs/guidelines/caching.md` (license and blog_post/blog_author reach far more pages than the impact list said).
**Out** (to TODO, design choices): `page` → menus on every page (would mean a full sweep, FOT cost); book unpublish/delete → author/collection pages; slug change → old URL; `success` count fix in the endpoint.
**Done**: gate green; V1 procedure (a) green with the new cases; Web Previews links for index pages resolve (they share `recordInfo.ts`); after merge+deploy, a real publish of an index page shows the index URL revalidated.

**Deviations found while planning V2**

- Default query is a lazy `import('./executeQuery')`, not `query = executeQuery`: a static import pulls `astro:env`, which tsx cannot load (the hooks would have to stay).
- The endpoint changes by one line to pass the payload `id`: `license` has no slug, so its books are found by record id.
- `app` stays an explicit no-op: its only reader (`/libri/schede/[slug]`) is staff-gated; revalidating would only re-cache the anonymous 404.
- `license` maps only to its books' `/libri/<slug>`: the plan review found it is rendered only on the book page (`BookCard` never renders its `license` prop), overturning V1's "license on every book card route"; no gap #16.
- Extra reach of `blog_post`/`blog_author` (gaps #10, #14) stays TODO: the mandate's In list maps only `index_page`, `supplier`, `license`, `app`.
- Done item "real publish of an index page after merge+deploy" is met only at the end of the work (procedure (c) after the production deploy); T6 shows it locally.

**V2 — done on 2026-11-05**

V2 mapped `index_page` (by slug, through `INDEX_PAGE_PATHS` and the `indexPagePath` helper, now shared by both maps), `supplier` → `/distributori`, `license` → its books' `/libri/<slug>` pages by record id, and `app` as a deliberate no-op, and removed the 7 phantom api_keys from `recordInfo.ts` and `revalidationUrls.ts`. `getRevalidationUrls` takes an injectable query with a lazy `executeQuery` default, so the check passes its stub directly: `hooks.mjs`, `register-stubs.mjs` and the Node >= 22.15 requirement are gone, and a preload sentinel keeps the fail-if-not-run guarantee (proven by the reviewer with an empty entry, not by a throw). Plan review overturned V1's audit: the license is rendered only on the book page, so the card routes need nothing. The real-CDA run on an own server (port 4331) gave `/libri` + `/libri/pagina/2..9` for the libri index, 42 and 2 book pages for two licenses, no enrichment failure, and a resolving Web Previews link. The final review found only low items. A fix round added the own-property lookup (prototype-key slugs) and corrected the docs. Three low items were ruled and left: the raw `libri` compare, the missing constructor payload, and the stale `indexPagePath` doc line. Process slips: T5 landed in two commits, and the T7 executor ran `git stash` in the shared checkout while T5 had uncommitted work, with no loss. Still open: the Done item "a real publish of an index page after merge+deploy", to be checked by procedure (c) on production.

## V3 — Patch/minor, Node 24, TypeScript 6

**In**: `npm update` within ranges and bump ranges for patch/minor (astro 6.4.x, @astrojs/check, ts-plugin, @datocms/astro, content-link, prettier 3.9, postcss, esbuild, autoprefixer, dotenv-cli, serialize-error); **`datocms` CLI stays on 4.0.x** (4.2 pulls the CMA v6 family: moved to V5); `.nvmrc` → 24 and `"engines": { "node": "24.x" }` in `package.json`; TypeScript 5.9 → 6.0.3; `.vercelignore` with at least `.env*`.
**Out**: any major other than TypeScript 6.
**Done**: gate green; `astro check` 0 errors; `npm ls` without peer errors.
**Gotchas**: prettier minor may reformat files → `npm run format` once, committed separately; TS 6 deprecations (`baseUrl`, `moduleResolution: node`) in `tsconfig.json`.

**Deviations found while planning V3**

- A plain `npm update` would pull the CMA v6 family (datocms 4.0.29 → `@datocms/cli-utils ^4.0.25` → cli-utils 4.2.x needs `@datocms/cma-client-node ^6.1.0`): an `overrides` entry `"@datocms/cli-utils": "<4.2.0"` holds it back; V5 removes it.
- swiper pinned exact at 12.1.4 (`npm update` would take 12.2.0); `dependencies.md` asks for a pin, V6 owns swiper.
- The docs step also edits the README Node line, `docs/guidelines/operations.md` and the status log of the TS 7 decision.
- User action, outside the checkout: Vercel project Node.js Version → 24.x (`engines` wins at build anyway); first visible on V4's preview.

**V3 — done on 2026-11-05**

V3 put the repo on Node 24 (`.nvmrc` 24, `engines` 24.x), took every patch/minor in range (astro 6.4.8, @astrojs/vercel 10.0.8, @datocms/astro 0.6.16, content-link 0.3.23, cma-client 5.8.1, prettier 3.9.10 and the rest), held the datocms CLI on `~4.0.29` with an `overrides` guard keeping `@datocms/cli-utils` below 4.2 (4.2 pulls cma-client-node 6), pinned swiper at 12.1.4, moved to TypeScript 6.0.3 with `baseUrl` dropped from `tsconfig.json`, and added `.vercelignore`. The one surprise came in T2: cma-client 5.8 broke an ambient `declare module '@datocms/cma-client'` shim that re-exported generated paths that no longer exist, and deleting it alone gave 9 errors, because a second shim in `src/types/datocms.d.ts`, a script-file module declaration, was replacing the real module wholesale. The runner ruled to delete both and let the package's own types resolve; buildClient, Client, ApiError and ItemTypeDefinition all come from cma-client itself now, and the final review confirmed a single rest-client-utils copy so `instanceof ApiError` holds. TS 6 needed only the `baseUrl` removal; prettier 3.9 rewrote one file. The runner ran T6 itself on port 4333 (user at first stop): all published routes 200, `/staff` 404 without session, draft read and `/staff` with session 200; server stopped, schema.ts clean. Gate green. Five low findings from the final review were logged, not fixed: two stale doc sentences (caching.md:125 on `.nvmrc`, dependencies.md:32 "upgrade promptly" vs the 4.0.x hold), wording at current-state.md:102, TODO ordering, and a follow-up to pin `@types/node@^24`. Still to happen outside the checkout: the Vercel project's Node.js setting to 24.x (user), first seen on V4's preview.

## V4 — Astro 7 + @astrojs/vercel 11

**Entry conditions** (user): `vercel link` to the existing Vercel project, confirmed; Node 24.x on the project; `BYPASS_TOKEN` and the other env vars present in the Preview environment (names only); preview Deployment Protection bypass known.
**In**: astro 7.x, @astrojs/vercel 11.x, aligned @astrojs/* packages, following the official upgrade guide; pin `compressHTML: true` (Astro 7 default is `'jsx'`, strips whitespace between elements); ISR config (option names unchanged in 11; `allowQuery` gains `x_astro_path_token`, rewrite uses `$1` — compare with the V1 snapshot); middleware (`src/middleware.ts`, editor session gating, CSP); draft mode endpoints; `@datocms/astro` under the new compiler.
**Out**: Tailwind, DatoCMS client majors.
**Done**: gate green; ISR config diff against V1 snapshot only as expected; dev smoke green; Vercel **preview** deploy: the smoke routes, `/staff` 404 checked **before and after** the draft test in a clean session, draft mode enable sets **`__prerender_bypass`**; `/api/revalidate` on the preview called only if the Preview build's `PUBLIC_SITE_URL` is the preview origin, otherwise only the unmapped-model no-op payload.
**Gotchas**: never `throw new Response()` in frontmatter; Content Link header coupled to `DATOCMS_BASE_EDITING_URL`; without `BYPASS_TOKEN` an editor's draft render (carrying the draft CDA token) is cached for anonymous visitors — TODO: `/api/draft-mode/enable` refuses on Vercel when `BYPASS_TOKEN` is unset.

**Deviations found while planning V4**

- The T1/T4 DOM diff goes beyond the named dev smoke: the guide asks for a visual check after the Rust compiler change, and visitors must see no change.
- The `/api/revalidate` preview condition is tightened: `SITE_SEARCH_BUILD_TRIGGER_ID` must also be absent from Preview, because a non-no-op call reindexes the production search.
- The entry conditions (Node 24.x, Preview env, protection) are checked inside T5, as the user asked at resume; any failure stops the slice.
- T6 fixes two stale lines left from V3's final review (caching.md:125, dependencies.md:32) and adds one sentence to operations.md on how `astro dev` behaves under an agent.

**V4 — done on 2026-11-05**

V4 moved the site to Astro 7.4.7 and @astrojs/vercel 11.0.20 (vite 8.3.6, Rust compiler) with no template fix needed, and pinned `compressHTML: true`. Astro 7's `true` is not v6's: it keeps one space where the source has whitespace between elements, so the T1/T4 DOM diff showed word-splitting hunks only; they were accepted (block/flex or collapsing context) because `'jsx'` glued header words and `false` keeps everything. The ISR output changed as the adapter's changelog says (`x_astro_path_token`, `$1`, wrapped `src`, `/_astro` header before `filesystem`), plus the final catch-all losing `"status": 404`, which the server-rendered 404 page now sets (unknown path 404 on the preview). The preview deploy waited twice on entry checks: the Vercel project's Node setting was 22.x until the user changed it to 24.x (the build then skipped its cache on the version change), and the SSO-protected project had no automation bypass, so `vercel curl` created one under the user's authorization; revoking it is now TODO S7. On the preview: six smoke routes 200, `/staff` 404 before and after the editor session, both draft cookies with Secure/Partitioned/SameSite=None, the draft book served as BYPASS and the anonymous one as HIT with no badge; Preview `PUBLIC_SITE_URL` is production, so only the no-op revalidate ran. Found on the way: an unknown book slug returns 500 (also on production), now TODO BOOK-404.

## V5 — DatoCMS clients and CLI

**In**: @datocms/cda-client 0.3, @datocms/cma-client 6, **`datocms` CLI 4.2** (moved from V3), regenerate `schema.ts`; following the changelogs via the DatoCMS skills. Scope: `src/lib/datocms/executeQuery.ts` (Content Link, `baseEditingUrl`, `includeDrafts`, `excludeInvalid`, `environment`); **delete the type shims** `src/types/datocms-cma-client.d.ts` and `src/types/datocms.d.ts` so the real v6 types apply (they deep-import files that don't exist and resolve to `any` under `skipLibCheck`); `src/pages/api/utils.ts` (`ApiError`, `serializeError`), `/api/revalidate` (`buildTriggers.reindex`), `/api/seo-analysis` (`items.rawFind`), `/api/post-deploy` (`plugins.*`).
**Out**: query rewrites not required by the upgrade.
**Done**: gate green with the shims gone; `reindex`, `rawFind`, `plugins.*` signatures checked against the CMA docs; dev smoke green (draft and published reads); a 500 from `api/utils.ts` no longer echoes the CDA token (cda-client 0.3.1 redacts it).

**Deviations found while planning V5**

- The type shims were already deleted in V3 (858c5da); `src/types/` is an empty, untracked directory. V5 only checks that no `declare module '@datocms…'` is left and removes the empty directory.
- No preview deploy. `reindex` and `plugins.*` are never called for real (both touch production: search index, plugins); they are checked against the docs and `astro check`; their first real run is procedure (c) on production at the end of the work.
- T4 goes beyond the named dev smoke: one read-only `rawFind` against the primary environment and a CMA-error 500; T1 adds a before/after token-leak probe, so the token Done does not rest on types alone.
- Removing the `@datocms/cli-utils` override and closing TODO UP-cli-utils-override come from `dependencies.md` and `TODO.md`, not the slice text: CLI 4.2 cannot install while the override is in place.
- T5 also edits `security.md` (the CMA `authorization` header and CDA options are redacted; `request.body` is still echoed, so a `/api/post-deploy` 500 can carry `SECRET_API_TOKEN`, S5) and the D4-R5 TODO line (cda-client 0.3.0 changes `instanceof ApiError`).

**V5 — done on 2026-11-06**

V5 moved the DatoCMS stack to @datocms/cda-client 0.3.2, @datocms/cma-client 6.8.0 and the `datocms` CLI 4.2.0 (cli-utils 4.2.1, one rest-client-utils 6.10.1 copy), removing the `@datocms/cli-utils` override (UP-cli-utils-override closed). No `src` file needed a change: the type shims were already gone since V3, so `astro check` now checks `reindex`, `rawFind` and `plugins.*` against the real v6 types, and T3 matched them to `cma:docs`, the 5.8.1 d.ts and the release notes. A before/after probe showed a CDA 401 through `handleUnexpectedError` echoing the token on 0.2.10 and not on 0.3.2. `schema.ts` regenerated with CLI 4.2 is a pure reorder (same 39 types, same ids). The dev smoke found two things the plan didn't foresee: in dev Vite answers every OPTIONS with its own 204, so the route-load check became a GET (our OPTIONS handlers wait for the V7 preview); and the local `.env` has `DATOCMS_CMA_TOKEN` empty, so `/api/seo-analysis` 500s locally — the real `rawFind` ran with the token mapped from `DATOCMS_API_TOKEN` in the server's process env only, and a CMA 404 came back as a 500 with `authorization` REDACTED and no token in body or log. The final review recorded the `DATOCMS_CMA_TOKEN` docs drift as TODO UP-cma-token-docs (runtime variable on Vercel for the reindex and seo-analysis; the `.env.example` comment is the user's). Still open from V5: a `/api/post-deploy` 500 can carry `SECRET_API_TOKEN` in the echoed CMA `request.body` (S5, now in security.md).

## V6 — Other majors

**In**: swiper 14 pinned to an **exact** version (as `docs/guidelines/dependencies.md` asks), jsdom 30 + @types/jsdom 30, prettier-plugin-astro 1.x.
**Done**: gate green; dev smoke green; local call to `/api/seo-analysis` with a real record id (only place jsdom runs; read-only); carousels checked on the **production bundle** (`public/generated/`, built by esbuild in prebuild) on home, a book page and a structured-text page with `BookCarouselBlock`; prettier output stable (format diff committed separately).

**Deviations found while planning V6**

- `.prettierrc` gains `astroCompressHTML: "html"` and `astro.config.mjs` a sync comment: not named by the slice, but plugin 1.0 needs them so formatting never changes what the site renders.
- The production bundle is checked locally: a globally installed Playwright (not a project dependency) serves `public/generated/swiper-element.js` in place of the dev source module, CSS and page from `astro dev`; no preview deploy (V7 ends with one).
- Extra checks beyond the mandate: T1 baseline, a carousel probe proven to fail on a broken bundle, a DOM diff proving the format commit renders the same, a before/after seo-analysis metadata comparison.
- jsdom 31.0.0 (published 2026-11-05) is left out, TODO `UP-jsdom-31`: the mandate says jsdom 30 and @types/jsdom stops at 30.
- Swiper 14 raises the browser floor to Chrome/Edge 110+, Safari 16.4+, Firefox 110+ (narrower than Swiper 12, no polyfills from esbuild `es2019`): accepted by the user on 2026-11-06.

**V6 — done on 2026-11-06**

Swiper 14.4.0 (exact), jsdom 30.1.3 + @types/jsdom 30.0.0 and prettier-plugin-astro 1.1.2 landed with no source change (9eb6ec6, 15344b2, format diff 036f4c3 on 50 `.astro` files, docs bd972a4). The runner took a before/after baseline on its own `astro dev` (4336): eight pages, the `/api/seo-analysis` read on book `PYDIU1WNQhaiuhvbf8a6ww` and a Playwright carousel probe that swaps the dev module for `public/generated/swiper-element.js`, shown to fail on an empty bundle. After the upgrades, carousels on `/`, `/libri/arte-trascendentale` and `/info/la-storia` (the only page with a BookCarouselBlock) initialize, paginate and navigate on the swiper 14 bundle; the normalized DOM of all eight pages and the seo output is identical; the seo metadata JSON is identical. A whitespace-aware raw-HTML diff (added on the T3 review's advice) found one change: the `/libri` pagination ellipsis lost its inner spaces (`Pagination/index.astro:82`), invisible since the li is a flex item — ruled accepted. Plugin 1.0 needed `astroCompressHTML: "html"` to match `compressHTML: true`; the two are tied by a comment in `astro.config.mjs`. Rulings: T1/T4 in the runner; T4 run during T3's review (read-only); T5 committed the V7 "Carried from V6" line in slices.md outside its Files. jsdom 31 deferred (UP-jsdom-31); the seo-analysis draft-token exposure tracked as S8. Carried to V7: Node ≥ 24.15 on Vercel, one GET /api/seo-analysis on the preview.

## V7 — Tailwind 4

**In**: tailwindcss 4 with `@tailwindcss/vite`; theme from `tailwind.config.mjs` into `@theme`; **font stacks defined once in `@theme`**, removing `--font-sans`/`--font-serif` from `:root` in `global.css` and from the config (otherwise a cyclic variable drops the site to the default font); in all 37 `*.module.css`: replace `@tailwind components;` with `@reference` to the global/theme CSS and **remove the `@layer components {}` wrappers** (33 files) so the cascade stays unlayered as today (native layers would lose to `swiper/css/bundle`); `global.css` is the entry, no `@reference`; `container` rewritten as `@utility`; borderRadius/letterSpacing overrides; remove autoprefixer and the tailwind PostCSS plugin, delete the dead one of `postcss.config.cjs` / `postcss.config.mjs`; default changes (border colour, ring, shadow scale).
**Done**: gate green; dev smoke green; visual check page by page before/after (home, libri, libro, autori, autore, collane, magazine, info, distributori, staff), carousel and module headings in particular; final Vercel preview deploy green, cache procedure green.
**Gotchas**: silent visual regressions; layer order.
**Carried from V6**: on the preview, read the Node version from the build log (must be ≥ 24.15, jsdom 30) and make one GET /api/seo-analysis.
