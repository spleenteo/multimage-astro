---
work: upgrade-2026-11
slice: V1
step: plan
tests: essential
updated: 2026-11-04
---

# V1 plan — Cache baseline

**Mandate**: [slices.md § V1](slices.md#v1--cache-baseline) · **Guidelines**: [development-guidelines.md](../../development-guidelines.md) · **Lessons**: [lessons.md](lessons.md) (none yet) · **Execution rules**: [executor.md](/Users/spleenteo/.claude/plugins/cache/flow/flow/facb0e621782/agents/executor.md)

**Summary**
1. Read DatoCMS live (read-only CLI) and the code; write `docs/guidelines/caching.md`: config, webhook 33942, route → models → revalidated table, gaps with fate.
2. Add a no-network check of the URL map (`npm run check:revalidation-map`, tsx + stubbed `executeQuery`, fetch blocked) with sample payloads per model.
3. Snapshot the ISR config and Vercel routes from a build with a throwaway `BYPASS_TOKEN`, token redacted, as V4's reference.
4. Write procedures (a)(b)(c) in `caching.md`; run (a), then (b) on local `astro dev` with overrides, then (c) passive `curl -I` on production.
5. Retire `docs/preview-mode.md`, fix the stale passages in the preview-mode, operations and data-loading guidelines, flag the wrong "Models:" list.
6. Record gaps and follow-ups in `TODO.md`, `current-state.md`, `dependencies.md`.

**Files**: docs/guidelines/caching.md, scripts/revalidation-map/check.ts, scripts/revalidation-map/register-stubs.mjs, scripts/revalidation-map/hooks.mjs, scripts/revalidation-map/stub-execute-query.mjs, scripts/revalidation-map/payloads/*.json (13 files, listed in T2), package.json, docs/work/2026-11-04-upgrade-2026-11/baseline/{README.md,isr-prerender-config.json,vercel-routes.json,functions.txt}, docs/preview-mode.md (deleted), docs/guidelines/preview-mode.md, docs/guidelines/operations.md, docs/guidelines/cms-data-loading.md, docs/decisions-log/2026-06-20-fot-reduction.md, CLAUDE.md, docs/TODO.md, docs/current-state.md, docs/guidelines/dependencies.md, docs/list-helpers.md

## The slice, decided here

- **tsx is not added to package.json**: run as `node --import tsx`, which resolves the hoisted tsx 4.22.0 (pulled in by the `datocms` CLI, `tsx ^4.19.2`). There is no network call and no lockfile change in a slice that changes no behaviour. The fallback (add `tsx` as a devDependency if V5's CLI 4.2 drops it) is noted in `caching.md` and TODO.
- **(a) stubs `executeQuery` with a Node resolve hook**, not a refactor. `revalidationUrls.ts` imports `./executeQuery`, which imports `astro:env/server`, and tsx cannot load that. The hook swaps in a fixture so the book branch, enrichment included, runs offline. The hook throws on any `astro:env/*` import, and `globalThis.fetch` is replaced by a thrower that counts calls.
- **The expectations in (a) describe current behaviour**: gaps show as `[]`/GAP lines. V2 updates the expectations when it fixes the map. (b) curls the same payload files that (a) parses.
- **There is no `BYPASS_TOKEN` in the local `.env`** (only on Vercel). The snapshot build and the (b) run use a throwaway `openssl rand -hex 16`, exported only for that command. The snapshot records `bypassToken` as `"<redacted>"`, so it only shows whether a token was set.
- **The snapshot uses `npx astro build`** (it produces an artefact and does not run the gate). (b) uses `npx astro dev`, not `npm run dev`, so `sync-datocms` never rewrites `schema.ts`; `schema.ts` is still checked and restored. (b) needs a server, so the conductor runs it (Server rule).
- **(c) reads the last calls of webhook 33942** (`webhookCalls list`, read-only) to learn which URLs the last real publish revalidated and when, then compares their `age` with `last_sent_at`. `resendWebhook` is never called, because it POSTs to production.
- **Every CLI output that can carry a secret goes through a field-picking `node -e` filter before anything prints.** The webhook `url` and `request_url` hold `?token=<SECRET_API_TOKEN>`; `headers`/`request_headers` are never printed.
- **Fate of each gap**: those named in V2's mandate go to V2 — the 7 phantom api_keys (`books_index`, `archive_index`, `highlights_index`, `ebooks_index`, `collections_index`, `authors_index`, `magazine_index`; the real model is `index_page`, read by slug), plus `supplier`, `license`, `app`. Everything else goes to TODO: `page` menus on every page, book unpublish/delete skipping author and collection pages, a slug change leaving the old URL cached, no upload events, and anything new from T1.
- **`docs/preview-mode.md` is deleted** (a 2025-11-16 `SERVER` snapshot that nothing links to). The decision log is history: the wrong "Models:" list gets a dated note, not a rewrite.

## Tasks

### T1 — Live DatoCMS read + route audit into `caching.md` · critical
**What**: Read-only, from the repo root, using only `npx dotenv -e .env -- npx datocms schema:inspect --json > "$TMPDIR/v1-schema.json"` and `npx dotenv -e .env -- npx datocms cma:call webhooks find 33942 --json | node -e '<print name, enabled, events, payload_api_version, auto_retry, nested_items_in_payload, and url with ?token=<redacted>>'` (no create/update/destroy/resend). Read each route's query, `src/layouts/BaseLayout.astro` (`SITE_QUERY`: `_site`, `allPages` menu/menuFooter), `astro.config.mjs`, `src/pages/api/revalidate/index.ts`, `webhookPayload.ts`, `revalidationUrls.ts`, `recordInfo.ts` and `src/lib/draftMode.ts`. Create `docs/guidelines/caching.md` (front matter `description:`) with: **Status** ("cache tags: not implemented, revalidation is URL-based"); **Configuration** (ISR `bypassToken`/`expiration` 5184000/`exclude`, the dual cookies, `?mode=full`, Site Search reindex, `success` counting 401/404 as ok at `index.ts:55`); **DatoCMS side** (webhook facts; models with api_keys, blocks excluded); **Route → models → revalidated?** (one row per route, layout `page` included; yes / partial (which event) / no); **Gaps and fate** (per the fate rule above).
**Files**: docs/guidelines/caching.md
**Verified**: `for r in '/' '/libri' '/libri/pagina/[page]' '/libri/[slug]' '/libri/ebooks' '/libri/highlights' '/libri/archivio' '/libri/schede/[slug]' '/autori' '/autori/[slug]' '/collane' '/collane/[slug]' '/magazine' '/magazine/[slug]' '/info' '/info/[slug]' '/distributori' '/cerca' '/cerca/search-page.client' '/staff' '/staff/archivio-catalogo' '/archived-books.json' '/sitemap.xml'; do grep -qF "| \`$r\`" docs/guidelines/caching.md || echo "missing $r"; done` prints nothing; `grep -nE 'token=[A-Za-z0-9]{16,}|[0-9a-f]{32}' docs/guidelines/caching.md` prints nothing; `test ! -e v1-schema.json` and `git status --porcelain | grep -i schema` prints nothing (no inspect output landed in the repo).
**Done**: the table covers 23 rows (`/cerca/search-page.client` labelled "not a page: client bundle source, no handler"), every model from schema:inspect appears, and each gap has V2 or TODO as its fate.
**Interfaces**: produces `caching.md` with its sections; T4 appends `## Verification procedure`, and T7 and T8 link to it.

### T2 — No-network URL-map check (procedure a) · critical
**What**: In `scripts/revalidation-map/payloads/`, write v3 payloads in the shape documented in `webhookPayload.ts`, with consistent arbitrary item_type ids: `book-publish` (slug `libro-pubblicato`), `book-unpublish` (`libro-non-pubblicato`), `author-publish` (`autore-uno`), `collection-publish` (`collana-uno`), `blog_post-publish` (`articolo-uno`), `page-publish` (`chi-siamo`), `home-publish`, `books_index-publish`, `index_page-publish` (`autori`), `supplier-publish`, `license-publish`, `app-publish`, and `malformed` (no `related_entities`). `stub-execute-query.mjs` exports `executeQuery`: it returns `{catalogueBooksMeta:{count:81}, book:null}` for slug `libro-non-pubblicato`, else the same count plus `book:{authors:[{slug:'autore-uno'},{slug:'autore-due'}], collection:{slug:'collana-uno'}}`. `hooks.mjs` has a `resolve` hook that short-circuits `./executeQuery` to the stub when `parentURL` ends with `/src/lib/datocms/revalidationUrls.ts` and throws on `astro:env/*`; `register-stubs.mjs` loads it with `module.register(new URL('./hooks.mjs', import.meta.url))`. `check.ts` blocks `fetch` and parses each file with `parseWebhookPayload`; like the endpoint, it skips the map when `apiKey` is null, otherwise it compares `getRevalidationUrls` as a set with a hard-coded expectation. It prints `file event api_key slug n OK|GAP|MISMATCH` per file, then `N payloads, M mismatches, fetch calls: K`, and exits 1 if M or K > 0. Expectations: `book-publish` gives 12 URLs (6 static: `/libri/libro-pubblicato`, ebooks, highlights, archivio, `/`, `/sitemap.xml`; then `/libri`, `/libri/pagina/2`, `/libri/pagina/3`, 2 `/autori/*`, `/collane/collana-uno`); `book-unpublish` gives 9 (GAP); `author`, `collection`, `blog_post` and `page` (GAP: menus) give detail + index + `/sitemap.xml`; `home` gives `/`, `/sitemap.xml`; `books_index` gives `/libri`, `/sitemap.xml` (phantom model); `index_page`, `supplier`, `license` and `app` give `[]` (GAP). Add the npm script `"check:revalidation-map": "node --import tsx --import ./scripts/revalidation-map/register-stubs.mjs scripts/revalidation-map/check.ts"`.
**Files**: scripts/revalidation-map/{check.ts,register-stubs.mjs,hooks.mjs,stub-execute-query.mjs}, scripts/revalidation-map/payloads/{book-publish,book-unpublish,author-publish,collection-publish,blog_post-publish,page-publish,home-publish,books_index-publish,index_page-publish,supplier-publish,license-publish,app-publish,malformed}.json, package.json
**Verified**: `npm run check:revalidation-map` exits 0 and ends `13 payloads, 0 mismatches, fetch calls: 0`; `npx prettier --check scripts/revalidation-map package.json` passes; `npx astro check` reports 0 errors (`scripts/**/*.ts` is in its scope).
**Done**: (a) runs offline in seconds, and the gaps show as GAP lines.
**Interfaces**: produces `npm run check:revalidation-map` and the payload paths, which T4 and T5 consume.

### T3 — ISR/routes baseline snapshot · depends on: T2
**What**: Run `BYPASS_TOKEN="$(openssl rand -hex 16)" npx astro build`. Then write `baseline/isr-prerender-config.json` from `.vercel/output/functions/_isr.prerender-config.json` with `bypassToken` replaced by `"<redacted>"` (via `node -e`), `baseline/vercel-routes.json` (the `routes` array of `.vercel/output/config.json`), `baseline/functions.txt` (`ls .vercel/output/functions`), and `baseline/README.md` (date, astro 6.3.3 / @astrojs/vercel 10.0.7, the command, the throwaway-token note, "reference for V4's expected diff", "`.vercel/output` was deleted after the snapshot: rebuild before any `--prebuilt` deploy"). Then `/bin/rm -rf .vercel/output` (gitignored; it holds the throwaway bypass token).
**Files**: docs/work/2026-11-04-upgrade-2026-11/baseline/{README.md,isr-prerender-config.json,vercel-routes.json,functions.txt}
**Verified**: `grep -c '"bypassToken": "<redacted>"' …/baseline/isr-prerender-config.json` → 1; `grep -c '5184000' …/baseline/isr-prerender-config.json` → 1; `grep -rnE '[0-9a-f]{32}' …/baseline/` prints nothing.
**Done**: the four files are committed and contain no token value; `.vercel/output` is gone.

### T4 — Write procedures (a)(b)(c) in `caching.md`, run (a) · depends on: T1, T2
**What**: Append `## Verification procedure` with: (a) the command, how to read GAP lines, and that the expectations change with V2; (b) the exact T5 commands, with secrets written as placeholders (`token=<SECRET_API_TOKEN>`) and the shell form in a separate note, why each override exists (`PUBLIC_SITE_URL` points at production, the reindex hits production), "never `?mode=full`", "judge by headers/urls, not `success`", and the server stop + `schema.ts` restore; (c) the `webhookCalls list` filter and `curl -sI` on the revalidated URLs, passive only (no POST, no resend); the tsx note. Then run (a) and paste its output under `### Runs — 2026-11-04`.
**Files**: docs/guidelines/caching.md
**Verified**: `grep -c '^### Runs — 2026-11-04' docs/guidelines/caching.md` → 1; within the `## Verification procedure` section, no line pairs `mode=full` with a production host (`sed -n '/^## Verification procedure/,$p' docs/guidelines/caching.md | grep -nE 'mode=full.*(multimage\.org|https://)'` prints nothing).
**Done**: procedure written, (a) recorded.

### T5 — Run (b) locally (conductor, needs a server) · critical · depends on: T4
**What**: Start `cd /Users/spleenteo/Sites/multimage/multimage-astro && PUBLIC_SITE_URL=http://localhost:4321 SITE_SEARCH_BUILD_TRIGGER_ID= BYPASS_TOKEN="$(openssl rand -hex 16)" npx astro dev --port 4321`. Before starting, `lsof -nP -iTCP:4321 -sTCP:LISTEN` must print nothing (else stop: the overrides assume port 4321). POST three requests, each through `npx dotenv -e .env -- sh -c 'curl -s -X POST "http://localhost:4321/api/revalidate?token=$SECRET_API_TOKEN" -H "content-type: application/json" --data @scripts/revalidation-map/payloads/<f>.json'` (single quotes, so the token is never echoed): `book-publish`, `supplier-publish`, and one with `?token=wrong` (`-o /dev/null -w '%{http_code}'`). Record the three results under Runs in `caching.md`. Stop the server (`lsof -nP -iTCP:4321 -sTCP:LISTEN` → kill), then `git diff --quiet -- schema.ts || git checkout -- schema.ts`.
**Files**: docs/guidelines/caching.md
**Verified**: `book-publish` returns `"mode":"surgical"`, `"reindexed":false`, `urls` without authors or collection (fixture slug unknown to the CDA), and the dev log shows a `[status] /path` line per URL; `supplier-publish` returns `"noop":true`; the wrong token returns `401`; after the stop, `lsof -nP -iTCP:4321 -sTCP:LISTEN` and `git status --porcelain schema.ts` print nothing.
**Done**: (b) recorded; no request left localhost except the CDA read.

### T6 — Run (c) on production, passive · critical · depends on: T5
**What**: Run `npx dotenv -e .env -- npx datocms cma:call webhookCalls list --params '{filter:{fields:{webhook_id:{eq:"33942"},status:{eq:"success"}}},order_by:"last_sent_at_desc",page:{limit:5}}' --json`, piped through a `node -e` that prints only `last_sent_at, event_type, status, response_status`, plus `mode`, `total` and `urls` parsed from `response_payload`. For the latest successful publish, run `curl -sI https://www.multimage.org<path> | grep -iE '^(x-vercel-cache|age|date):'` on 3–5 of its URLs, plus `/` and `/distributori`. Record under Runs: HIT/STALE/MISS and whether `age` ≤ seconds since `last_sent_at`. If no recent call exists (calls expire), record that and only the header values; note that a production deploy after the publish also resets `age`.
**Files**: docs/guidelines/caching.md
**Verified**: the Runs section has a (c) table with header values; `grep -nE 'token=[A-Za-z0-9]{16,}|[0-9a-f]{32}|curl -X POST https://www' docs/guidelines/caching.md` prints nothing.
**Done**: (c) run once, read-only.

### T7 — Retire and fix the stale cache/preview docs
**What**: `git rm docs/preview-mode.md`. In `docs/guidelines/preview-mode.md`, replace the §6 paragraph "invalidate everything, ~669 CDA reads" with the surgical reality + a link to `caching.md`, and point §7's revalidate note to `caching.md` (b). In `operations.md`, remove the `SERVER` env var (line 17 included)/static-SSG, `npm run preview` and `~/lib/prerender` claims and state ISR + `astro dev` (`astro preview` does not work with `@astrojs/vercel`). In `cms-data-loading.md`, make "Cache tags (planned)" read "not implemented, revalidation is URL-based → caching.md", and fix line 49 (`SERVER=preview`/`SERVER=static` → ISR + draft cookie) and line 67 ("during SSG" → per-request render). In `fot-reduction.md`, add a dated note under "Models:": the list is wrong, see the `caching.md` audit. Add a `CLAUDE.md` Quick Reference row for Caching.
**Files**: docs/preview-mode.md, docs/guidelines/preview-mode.md, docs/guidelines/operations.md, docs/guidelines/cms-data-loading.md, docs/decisions-log/2026-06-20-fot-reduction.md, CLAUDE.md
**Verified**: `grep -nE 'SERVER\b|npm run preview|~/lib/prerender' docs/guidelines/operations.md docs/guidelines/cms-data-loading.md` and `grep -n '669' docs/guidelines/preview-mode.md` print nothing; `test ! -e docs/preview-mode.md`; `npx prettier --check CLAUDE.md` passes.
**Done**: no doc claims the old dual runtime or full-sweep strategy.

### T8 — Gaps and follow-ups into TODO, current state, dependencies · depends on: T1, T4
**What**: In `docs/TODO.md`, add one entry per TODO-fated gap from `caching.md` (TODO.md format), plus: tsx transitive → devDependency if the CLI drops it; `project-structure.md` stale `SERVER`/`prerender` passages; the missing `BYPASS_TOKEN` in local `.env`, documented as intentional; the `"preview": "astro preview"` script in `package.json` (doesn't work with `@astrojs/vercel`: remove or replace). In `docs/current-state.md` § caching, link `caching.md` and the snapshot. In `docs/guidelines/dependencies.md`, correct the Runtime line (Astro 6, `output: 'server'` + Vercel ISR, the `datocms` CLI package instead of `@datocms/cli`) and note that tsx is used via the CLI's hoisted copy. In `docs/list-helpers.md`, add one bullet for the revalidation-map check naming `check.ts`, `register-stubs.mjs`, `hooks.mjs`, `stub-execute-query.mjs`.
**Files**: docs/TODO.md, docs/current-state.md, docs/guidelines/dependencies.md, docs/list-helpers.md
**Verified**: count the TODO-fated rows in the `caching.md` gaps table, then `grep -c` the new entries in `TODO.md`: the two numbers match; `npm run docs:inventory` exits 0.
**Done**: each gap has a home: V2 or TODO.

## Order

T1, T2 and T7 run side by side (separate files). T3 runs after T2 (both run Astro's sync on `.astro/`). T4 runs after T1 and T2. T5 runs after T4, by the conductor. T6 runs after T5. T8 runs after T4, beside T5 and T6 (separate files).

## Deviations from the mandate

- T7 also edits `cms-data-loading.md` and `CLAUDE.md` (one row each). The mandate's "state plainly" otherwise leaves a contradicting "planned" section, and the new guideline would have no entry in the Quick Reference.
- `project-structure.md` has stale `SERVER` passages too. They go to TODO and are not fixed, because the mandate names only the preview docs and `operations.md`.
