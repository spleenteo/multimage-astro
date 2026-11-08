# Slice packet — upgrade-2026-11 · V6

Work: technical (no frame, no criterion). Visitors must see no change: success is a 100% green local build and a working deploy.

## Work-wide context (slices.md, header and rules for every slice)

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



## The slice (slices.md)

## V6 — Other majors

**In**: swiper 14 pinned to an **exact** version (as `docs/guidelines/dependencies.md` asks), jsdom 30 + @types/jsdom 30, prettier-plugin-astro 1.x.
**Done**: gate green; dev smoke green; local call to `/api/seo-analysis` with a real record id (only place jsdom runs; read-only); carousels checked on the **production bundle** (`public/generated/`, built by esbuild in prebuild) on home, a book page and a structured-text page with `BookCarouselBlock`; prettier output stable (format diff committed separately).

## Lessons (lessons.md)

- Never print raw DatoCMS CLI output, not even with head: webhook-call records carry ?token=<SECRET_API_TOKEN> in request_url; pipe straight into a node filter that prints chosen fields, never through a file.
- `datocms cma:call … --json` prints nothing (npm notices on stdout break parsers): use the plain output, sliced from the first line starting with [ or {.
- A route audit lists models from the fragments too: grep every fragment a page composes (BookCard, FeaturedBookHighlight, review blocks), not only the page's own query.
- A check script must fail when it doesn't run: set process.exitCode = 1 in the preload and let the entry overwrite it at the end; treat a missing fixture as a mismatch.
- With tsx on Node 24, module.register hooks can skip the entry silently; use module.registerHooks (Node >= 22.15).
- `rm` and `/bin/rm` are blocked by the zsh hook in agent shells: delete with Python (os.remove) or `del`, or avoid temp files.
- docs/ is in .prettierignore: format docs with `npx prettier --ignore-path /dev/null`, and don't claim a vacuous prettier pass.
- A Verified line that expects "a status line per URL" must allow for fixture slugs unknown to the CDA: the page throws and logs no status.
- Executors running in parallel share one checkout and index: never `git stash`, `git reset` or `git checkout -- .`; stage by path only.
- Prove a preload's exit-code guard with an entry that returns without throwing; a thrown error exits 1 on its own and proves nothing.
- An object used as a lookup table keyed by CMS input needs an own-property check (`Object.hasOwn`); `constructor` or `__proto__` slugs otherwise return inherited values.
- On macOS, `sed -i` needs an empty suffix argument (`sed -i ''`); re-run the Verified grep after any in-place edit, before committing.
- A `.d.ts` with `declare module 'x'` and no top-level import/export replaces package x's own types entirely: before editing or deleting one such shim, grep `src` for every `declare module 'x'` and treat them as one unit.
- Plain `tsc -p tsconfig.json` cannot resolve `.astro` imports (TS2307 on every component `index.ts`): judge a TypeScript or tsconfig change by `astro check`, never by plain `tsc` alone.
- A dev server log records the full `/api/draft-mode/enable?token=…` URL: write it to the scratchpad, print only redacted lines, delete it when the server stops.
- Before asserting that a newer framework's option "keeps vN output", diff a normalized DOM of real pages before and after: Astro 7 `compressHTML: true` keeps a space v6 dropped.
- A vercel deploy run under an agent prints JSON on stdout: take the URL from `.deployment.url`, not from the last line.
- zsh doesn't word-split an unquoted `$var`: `set -- $p` in a loop silently passes empty arguments; use a function with explicit arguments.
- Probe 404s with more than one shape of unknown path (top-level and under a dynamic route): a dynamic route that throws gives 500 where a top-level miss gives 404.
- `vercel curl` on a protected project with no automation bypass creates one silently on the project: record it in TODO for revocation the moment it is created.
- In a leak probe, guard each needle (`v ? body.includes(v) : 'unset'`): a variable present but empty in `.env` loads as `""`, and `includes("")` is always true.
- In `astro dev`, Vite answers every OPTIONS request with its own 204 before the route runs: prove a route module loads with a GET (404 or 401), and leave the OPTIONS handlers to a deploy.
- On TypeScript 6, a standalone `tsc <file>` with flags fails with TS5112 when a `tsconfig.json` is present: add `--ignoreConfig`.
- Before a smoke that needs a server-side token, check that it is non-empty in the env the server reads (names and emptiness only, never values); a local `.env` can hold the name with no value.

## Effective test level

essential

## Development guidelines (docs/development-guidelines.md)

# Development guidelines

Read whole by `/flow:dev` in every plan, review, execution and close. Prose guidance per concern lives in `docs/guidelines/`.

## References

- Astro docs (docs.astro.build) for directives and APIs.
- DatoCMS skills, when in session: `datocms-cli` (CLI, migrations, environments, schema), `datocms-cda` (queries, cache tags, type generation), `datocms-frontend-integrations` (draft mode, Content Link, components), `datocms-structured-text`, `datocms-content-modeling`. Otherwise `datocms cma:docs` and datocms.com — never memory.
- Project conventions: `CLAUDE.md` and `docs/guidelines/`.

## Tests

Level: essential
Sensitive areas: `src/pages/api/` (revalidate, draft-mode, post-deploy), `src/middleware.ts`, draft mode and editor session, `src/lib/datocms/` (queries, fragments, revalidation map), `scripts/`

No test runner is configured: `npm test` runs format + lint + build, so it rewrites files. Verification is the gate below plus a working deploy.

## Gate

- `npm run lint` (prettier check)
- `npm run build` (runs `astro check` then `astro build`; needs the local `.env`)

## Guidelines

### docs/guidelines/dependencies.md

---
description: Summarise runtime, CMS, and tooling dependencies used by Multimage.
---

# Dependencies

## Runtime & UI

- Node 24.x (`.nvmrc` for local, `engines.node` in `package.json` for Vercel) and TypeScript 6 (`typescript@^6`; TypeScript 7 is deferred, see `docs/decisions-log/2026-11-04-defer-typescript-7.md`).
- `astro@^7` (Rust compiler, Vite 8, `compressHTML: true` pinned) with `output: 'server'` and `@astrojs/vercel@^11` ISR (no prerendered routes), deployed to Vercel as a single project.
- Styling uses `tailwindcss` (3.x) and `autoprefixer` wired as PostCSS plugins (`postcss.config.mjs`/`.cjs`); there is no `@astrojs/tailwind` integration. Brand tokens defined in `tailwind.config.mjs`.
- `swiper` provides the carousel web component; `BookCarouselSection` imports `swiper/element/bundle` so no asset-copy step is required.

## CMS & Data

- `@datocms/astro`, `@datocms/cda-client`, and the `datocms` CLI package (not `@datocms/cli`) handle rendering helpers, GraphQL fetching, and schema generation. `@datocms/cma-client` is a runtime dependency: `/api/revalidate` (Site Search reindex), `/api/post-deploy` and `/api/seo-analysis` call `buildClient`.
- `@datocms/cma-client` 6 and the `datocms` CLI 4.2 family share one `@datocms/rest-client-utils` 6 copy (no `overrides` in `package.json`); both clients redact tokens in their `ApiError` (`@datocms/cda-client` ≥ 0.3.1, `@datocms/rest-client-utils` ≥ 6.1.1).
- `tsx` is not a direct dependency: `npm run check:revalidation-map` uses the copy hoisted from the `datocms` CLI (also pulled by `vite`).
- DatoCMS data primarily flows through `@datocms/cda-client`; `dotenv-cli` is only needed for scripts like `npm run sync-datocms`.

## Monitoring & Analytics

- `@vercel/analytics` and `@vercel/speed-insights` augment inline Google Analytics and Iubenda snippets inside `BaseLayout`.

## Tooling

- Formatting is enforced via `prettier` + `prettier-plugin-astro`. No ESLint is configured, so lint coverage stops at formatting.

## Risk Notes

- `swiper` is pinned at exactly 12.1.4 in `package.json`; keep it pinned to avoid sudden bundle regressions introduced by caret releases.
- Track `datocms` CLI updates, especially when schema generation APIs change.

### docs/guidelines/operations.md

---
description: Describe how Multimage is built, deployed, and configured across environments.
---

# Operations Runbook

## Deployments

- Vercel is the single supported target: link the repo, sync environment variables, and run `npm run build`. The site is one deployment running `output: 'server'` with ISR (`@astrojs/vercel`): every route is rendered per request and cached by the Vercel CDN, nothing is prerendered at build time. Draft Mode (the signed JWT cookie plus Vercel's `__prerender_bypass` cookie) bypasses the cache on the same deployment, so there is no separate static/preview split.
- Vercel builds on Node 24.x with the Vercel project Node setting kept on 24.x to match `engines.node` (`24.x`) in `package.json` and `.nvmrc` (local work). `.vercelignore` keeps `.env*` (plus `dist/`, `.astro/`, `.claude/`) out of CLI uploads (`vercel deploy`).
- `npm run dev` chains `npm run sync-datocms` before `astro dev`, ensuring `schema.ts` and `docs/DATOCMS.md` stay in sync when `DATOCMS_API_TOKEN` is available.
- `npm run prebuild` currently rebuilds the Site Search client before `npm run build` invokes `astro check` and the production build.
- Local checks use `astro dev` (`npm run dev`). `astro preview` does not work with `@astrojs/vercel`, so no preview script is provided. ISR caching is a Vercel CDN feature and is not active locally; see `docs/guidelines/caching.md` for the revalidation checks. Under an AI agent, Astro 7 `astro dev` starts in the background (stop it with `npx astro dev stop`), and `--ignore-lock` keeps a one-off foreground server.
- `tmp-sample/` is a read-only Astro starter kept in the repo for reference. It is excluded via `tsconfig.json` so `astro check`/`npm run build` ignore its missing React dependencies.

## Environment & Secrets

- Required env vars on Vercel: `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`, and `NODE_ENV=production`. CLI-specific `DATOCMS_API_TOKEN`/`DATOCMS_CMA_TOKEN` can remain local unless schema generation runs in CI.
- `datocms.json` enumerates the CDA/CMA tokens used during automation; keep it updated when tokens rotate so `vercel env pull` stays in sync.
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` ships to the browser; provision it from a role limited to **Perform Site Search API calls** to prevent privileged access. See `docs/guidelines/security.md` for scoping details.
- Runtime also reads standard flags (`NODE_ENV`, `CI`, `CONTINUOUS_INTEGRATION`, `VERCEL`). Only set what the deploy target actually needs to keep the surface minimal.
- `PUBLIC_SITE_URL` powers sitemap generation and absolute links; missing values break `/src/pages/sitemap.xml.ts`.

## Preview & Drafts

- `/api/preview` ora gestisce l’ingresso in Draft Mode firmando il cookie e reindirizzando alla rotta desiderata. `/api/draft-mode/enable|disable` vengono usate dal plugin DatoCMS Web Previews per generare i link “Draft/Published”.
- `executeQuery` accetta `{ includeDrafts: true }` e grazie a `resolveDraftMode(Astro)` (vedi `~/lib/draftPreview`) legge i cookie su ogni richiesta: il cookie di Draft Mode fa saltare la cache ISR sulla stessa deployment.
- `/api/post-deploy` è invocato automaticamente da Vercel (via `datocms.json`) e si occupa di installare/aggiornare plug-in ufficiali DatoCMS:
  - **Web Previews** → aggiunge due frontends (Production + Preview) che puntano a `/api/preview-links?token=...`.
  - **SEO/Readability Analysis** → punta `htmlGeneratorUrl` al `/api/seo-analysis` dell’ambiente corrente.
  Se il post-deploy fallisce (es. perché il plug-in è già installato con permessi diversi) puoi rilanciarlo manualmente con `curl -X POST <deploy-url>/api/post-deploy -H 'Content-Type: application/json' -d '{"datocmsApiToken":"<CMA>","frontendUrl":"<deploy-url>"}'` (usa un CMA token “Admin”).

## Monitoring & Logging

- Client monitoring uses Google Analytics (legacy UA), `@vercel/analytics`, and `@vercel/speed-insights`. There is no server-side logging or alerting yet.
- The `/llms-full.txt` export route was removed (2026-06-20); no exporter to maintain.

## Testing & Automation

- No CI workflow runs `astro check`, linting, or builds. Add GitHub Actions (or Vercel checks) to execute at least `npm run lint` and `npm run build` on pull requests.
- `npm run test` chains `npm run format` → `npm run lint` (Prettier `--check`) → `npm run build`. This covers formatting and build health but not unit coverage.
- Utilities like `src/pages/cerca/search-page.client.ts` and the staff CSV helpers have zero unit tests; start with Vitest for pure helpers and DOM tests for CSV/search scripts.
- GraphQL queries rely on build-time validation. Consider lightweight contract tests that mock `executeQuery` responses so schema drift is caught earlier.

### docs/guidelines/security.md

---
description: Track security risks, mitigations, and review checkpoints for Multimage.
---

# Security Overview

## Critical Findings

- **Rich-text XSS (CWE-79)** — `toRichTextHtml` returns raw CMS HTML and multiple templates bind the result with `set:html`, so any editor-provided `<script>` executes for visitors. Harden `src/lib/text.ts:65-95`, audit `src/pages/index.astro:345-355`, `src/components/SupplierCard/index.astro:71-139`, and `src/pages/autori/[slug]/index.astro:138-158` to use Structured Text renderers or sanitize output.
- **Catalog data exposure (CWE-200)** — _Resolved 2026-05-31 (S1)._ Internal routes (`/staff`, `/staff/archivio-catalogo`, `/libri/schede/*`) are gated centrally in `src/middleware.ts`: a request without the editor session (the signed draft-mode JWT cookie) gets a flat `404` before any render, so the public never learns the paths exist nor receives inventory/CSV data. Enforcement is single-point — pages no longer guard themselves. The bearer-token model fits the sensitivity (stock/circulation business data, not PII); see `docs/decisions-log/2026-05-31-editor-session-gating.md`.

## High-Priority Gaps

- **Preview tokens rotation** — `/api/preview` and `/api/draft-mode/*` now enforce `SECRET_API_TOKEN` and drop signed cookies before toggling Draft Mode. Keep the CDA draft token and secrets rotated across Vercel environments so a leaked URL cannot grant long-term preview access.
- **Unbounded CSV export** — The staff CSV button currently serializes the full catalogue on the client (`src/pages/staff/archivio-catalogo/index.astro:200-317`). Even after the page is secured, validate user roles and strip fields that should never leave the CMS.

## Additional Observations

- **Third-party scripts** — Google Analytics, Iubenda, and Vercel analytics are injected inline in `src/layouts/BaseLayout.astro:132-210` with no integrity hints. Load them with `async`/`defer`, monitor outages, and keep the snippet list minimal.
- **LLM export** — the `/llms-full.txt` route was removed (2026-06-20), closing **S4**: the full catalogue + long-form bios/emails are no longer published in plaintext to anonymous visitors.
- **DatoCMS client errors (S5 still open)** — since V5 the CMA `authorization` header is redacted in a CMA `ApiError` and a CDA error's options no longer serialize, but `handleUnexpectedError` (`src/pages/api/utils.ts`) still returns a CMA error's `request.body` to the caller, so a `/api/post-deploy` 500 can carry `SECRET_API_TOKEN` (in `previewWebhook`/`htmlGeneratorUrl`).
- **Environment documentation** — `.env.example` only mentions the published CDA token; document draft/CMA tokens separately so engineers do not reuse privileged keys accidentally.
- **Search token scoping** — Ensure `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` is created with a Site Search–only role. Admin/CMA tokens must never be exposed because the value ships to the browser (`src/pages/cerca/index.astro:6-78`).

---

## Environment Variables Audit (2026-05-16)

### Matrix

| Variable | Astro context | Astro access | Optional? | Ships to client? | Used in | Vercel must have |
|---|---|---|---|---|---|---|
| `SERVER` | server | public | yes | no | `src/lib/draftPreview.ts`, `src/lib/prerender.ts` (build-time selector "static"/"preview") | yes — set per env |
| `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` | server | secret | no | no | `src/lib/datocms/executeQuery.ts` | yes |
| `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` | server | secret | no | no | `executeQuery.ts`, `DraftModeQueryListener` | yes (preview env) |
| `DATOCMS_CMA_TOKEN` | server | secret | yes | no | `src/pages/api/seo-analysis/index.ts` (runtime) | only if seo-analysis enabled |
| `SECRET_API_TOKEN` | server | secret | no | no | `post-deploy`, `preview`, `preview-links`, `seo-analysis`, `draft-mode/enable` | yes |
| `SIGNED_COOKIE_JWT_SECRET` | server | secret | no | no | `src/lib/draftMode.ts` | yes |
| `DRAFT_MODE_COOKIE_NAME` | server | secret | yes | no | `src/lib/draftMode.ts` | optional |
| `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` | client | public | no | **YES** | `src/pages/cerca/index.astro` (via `import.meta.env`), search bundle | yes |
| `PUBLIC_SITE_URL` | client | public | no | **YES** | BaseLayout canonical, sitemap, `post-deploy` | yes |
| `DATOCMS_API_TOKEN` | — (not declared) | — | — | no | only `scripts/sync-datocms.mjs` (local dev) | **NO — dead weight on Vercel** |

### Findings

1. **`DATOCMS_API_TOKEN` su Vercel non viene letto a runtime.** Lo script `sync-datocms.mjs` gira solo da `npm run dev`/`start` (locale), non da `npm run build`. Tenerlo su Vercel è solo superficie d'attacco senza utilità. → **Action**: rimuovere da tutti gli env Vercel.
2. **6 secret su Vercel sono "Needs Attention"** (non cifrati at-rest nel dashboard team): `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `DATOCMS_API_TOKEN` (verrà eliminato), `DATOCMS_CMA_TOKEN` (se presente). → **Action**: migrare a tipo *Sensitive*.
3. **`PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` scope da verificare.** Il token finisce nel bundle JS del browser (`src/pages/cerca/index.astro:11` via `import.meta.env`) ed è quindi leggibile da chiunque. Deve essere un token DatoCMS con **solo il ruolo "Site Search"** (read-only sull'endpoint `/search-results`). Se ha permessi più ampi (CDA published, CDA draft, CMA) è una **leak severa**.
4. **`PUBLIC_SITE_URL` è safe** — è solo `https://www.multimage.org`, nessun problema a esporlo al browser.

### Vercel: migrazione a "Sensitive"

Per ogni secret marcato "Needs Attention", da fare via dashboard (richiede manual action — non automatizzabile via API senza CLI auth):

1. Apri Project Settings → Environment Variables
2. Clicca la variabile → "Edit"
3. Cambia il tipo da "Plain text" a **"Sensitive"** (encrypted at-rest)
4. Salva — il valore resta lo stesso, non serve rotazione
5. Conferma che il badge "Needs Attention" sparisce

**Ordine consigliato** (più sensibili prima):
1. `SIGNED_COOKIE_JWT_SECRET` (controlla draft mode auth)
2. `SECRET_API_TOKEN` (gatekeeper API routes)
3. `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` (legge contenuti draft)
4. `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` (legge contenuti pubblicati)
5. `DATOCMS_CMA_TOKEN` (se presente — accesso CMA full)
6. **Elimina** `DATOCMS_API_TOKEN` da Vercel (non serve)

**Rotazione**: non necessaria salvo sospetto compromissione. Migrare a Sensitive **conserva lo stesso valore** — la cifratura at-rest è la sola differenza.

### Verifica `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`

Da fare su DatoCMS:

1. Vai su Project settings → API tokens
2. Trova il token usato come `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`
3. Verifica:
   - Role: **"Site Search"** (built-in role)
   - Permissions: solo `Use the Site Search API`
   - NON deve avere accesso a CDA, CMA, o altri endpoint
4. Se il token ha permessi più ampi → creare un nuovo token "Site Search" only, sostituire su Vercel, eliminare quello vecchio

### Public env vars: review

Le sole variabili che finiscono nel bundle browser (per dichiarazione `context: 'client'` o uso via `import.meta.env`):

- `PUBLIC_SITE_URL` — safe (URL pubblico)
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` — safe **solo se scope verificato come Site Search-only** (vedi sopra)

Nessun secret è accidentalmente prefissato `PUBLIC_*` in `astro.config.mjs`. ✅

### docs/guidelines/testing.md

---
description: How to run simple test
---

# Testing

Fastro is a website with very poor dynamic parts. Most of it is static site.
So testing is just about code formatting and build before pushing the repo

You can run the unit tests with the following command:

```bash
npm run test
```

Via `run-p test:*` it will run several check:

- format
- lint
- build

## Matching decisions (descriptions)

- docs/decisions-log/2026-11-04-defer-typescript-7.md — Upgrade to TypeScript 6.0.3 and defer TypeScript 7 (native compiler) until @astrojs/check supports it; astro check is part of the gate.
- docs/decisions-log/2026-11-05-astro-7-upgrade.md — Astro 7.4.7 and `@astrojs/vercel` 11.0.20, with `compressHTML: true` pinned and `--ignore-lock` for one-off dev servers.
- docs/decisions-log/2026-05-16-datocms-review.md — DatoCMS patterns review; `src/pages/api/seo-analysis/index.ts` is the SEO/Readability plugin endpoint using the CMA client.
- docs/decisions-log/2025-11-16-static-preview-dual-runtime.md — The `SERVER` variable publishes a fully static production site plus an SSR twin for previews; `src/pages/api/seo-analysis/index.ts` stays SSR-only.
- docs/decisions-log/2025-12-01-astro-516-upgrade.md — Raised the framework to Astro 5.16.3.

## Project lenses

project lenses: none (docs/impact-lenses.md absent)

## Preset rules

### flow:stack-astro — Rules

1. Pages are static by default; opt a route out with `export const prerender = false` only when its data is per request (session, query string, preview), because static output is the cheapest and most cacheable.
2. Set `output` once in `astro.config.*` and keep it; do not mix per-route overrides in both directions, because two defaults make the rendering mode of a route impossible to read.
3. Components are `.astro` unless they need client state or events; a framework component gets a `client:*` directive only for that interactivity, because every island ships JavaScript.
4. Prefer `client:idle` over `client:load`, and `client:visible` for below-the-fold parts only, and never `client:only` without a reason written in a comment, because eager hydration costs the first paint.
5. Content comes through typed queries (content collections with a schema, or generated types for a CMS), never untyped `fetch` in a page, because a renamed field must fail the build, not the page.
6. Declare environment variables with `astro:env` (`envField`, context `server`, access `secret`) in Astro 5; `import.meta.env` is replaced at build, so it cannot supply runtime secrets on SSR routes. Only public client variables (`PUBLIC_`) may reach client code, because anything else leaks into the bundle.
7. Local images go through `astro:assets` (`<Image />`, `<Picture />`) with explicit `alt` and dimensions; CMS assets go through the CMS preset's component; remote images through `astro:assets` need `image.domains` or `remotePatterns`; fonts are self-hosted, because remote assets add requests and layout shift.
8. Set `lang` and `dir` on the root element from the route's locale, and use logical CSS properties (`margin-inline-start`) over physical ones, because right-to-left locales break otherwise.
9. Client scripts that must survive navigation re-attach on `astro:page-load` when the site uses `<ClientRouter />`, because the router replaces the DOM and loses listeners.
10. Generate the sitemap and `robots.txt` from the config (`@astrojs/sitemap`, an endpoint), with `site` set, because hand-kept lists drift from the routes.
11. Keep dynamic routes explicit: `getStaticPaths` returns every locale and slug, and unknown paths hit a real 404 page, because a silent empty page returns 200.
12. Take adapters and hosting limits (bundle size, build time, route count) into account before adding a route-generating feature, because the host fails the deploy, not the build.

### flow:stack-datocms — Rules

**CLI**

1. Work on the project through the DatoCMS CLI (`datocms`), linked once per repo (`datocms link`, which writes `datocms.config.json`), because schema, environments and migrations then run the same way for everyone and in CI.
2. Before planning a schema change, read the live schema with `datocms schema:inspect` instead of guessing it from the code, because the code shows only the fields it queries.
3. For API details and examples, use the DatoCMS skills when the session has them (References), else `datocms cma:docs` and the docs at datocms.com, never memory, because the API changes and remembered option names drift.

**Environments**

4. Change the schema in a sandbox, never by hand on the primary environment: `datocms migrations:run` forks the primary into a sandbox (`--destination`) and runs the pending migrations there; `datocms environments:promote` makes it primary once reviewed, because the primary serves production.
5. Run migrations in place on the primary (`--in-place --allow-primary`) only for strictly additive changes, because a run that fails halfway has no rollback.
6. Pass the environment to every client explicitly, from a variable the app reads, and keep production reads on the primary, because a sandbox returns different content without any error.
7. Keep the CMA token and the draft read token server-side and out of git, because one writes and the other reads unpublished content.

**Schema**

8. Every schema change is a migration script (`datocms migrations:new <name>`, or `--autogenerate=<sandbox>` to diff a sandbox built in the dashboard) committed with the code that uses it, because a migration is reviewable and replayable.
9. Query types come from the schema (`datocms schema:generate`, `gql.tada` or GraphQL Code Generator) and are checked in CI, because a field renamed in the CMS must fail the build, not the page.
10. Treat optional and localized fields as nullable in the code, because an untranslated or half-filled record returns `null`, not a fallback.

**Naming**

11. Name models for what they hold, not for how a page shows them, because the same content is reused by other pages and other apps.
12. Pages are regular models named `… Page`; reusable blocks are named `… Block`; the API key is the snake_case of the name and matches the component's name in the code.
13. Name fields by data type first, then by function, and by appearance only through `layout` and `style`.
14. Use the standard field names (`title`, `subtitle`, `slug`, `text`, `blocks`, `items`, `image(s)`, `video`, `page(s)`); booleans named by function.
15. Control appearance with two fields: `layout` and `style`, each a string with only allowed values.
