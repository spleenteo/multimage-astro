---
description: Describe how Multimage is built, deployed, and configured across environments.
---

# Operations Runbook

## Deployments

- **Two targets, one codebase.** Vercel is production today; Cloudflare Workers is the target on branch `chore/cloudflare`, chosen at build time by `DEPLOY_TARGET` (`astro.config.mjs` picks `@astrojs/vercel` or `@astrojs/cloudflare`; unset means Vercel). The switch is a one-off procedure: `docs/guidelines/cloudflare-switch.md`.
- **Vercel**: link the repo, sync environment variables, and run `npm run build`. The site is one deployment running `output: 'server'` with ISR (`@astrojs/vercel`): every route is rendered per request and cached by the Vercel CDN, nothing is prerendered at build time. Draft Mode (the signed JWT cookie plus Vercel's `__prerender_bypass` cookie) bypasses the cache on the same deployment, so there is no separate static/preview split.
- **Cloudflare** (`DEPLOY_TARGET=cloudflare`): a Worker `multimage-astro` in the Cloudflare account "Multimage" (`account_id` in `wrangler.jsonc`), trial URL `https://multimage-astro.matteo-59f.workers.dev` (`workers_dev` and `preview_urls` are on). Entry `src/worker.ts` is a gateway that forwards every request to the `Backend` entrypoint, which runs the Astro handler behind Workers Cache (see `preview-mode.md` § 1 and `caching.md`).
  - Build and deploy with the env file (the build validates the secrets, `validateSecrets`): `npx dotenv -e <ENV_FILE> -- npm run build:cf` to build only, `npx dotenv -e <ENV_FILE> -- npm run deploy:cf` to build and deploy. The env file holds production secrets: keep it outside the repo and never print it.
  - Every Cloudflare build rewrites `.wrangler/deploy/config.json`; `.wrangler/` is in `.prettierignore` so `npm run lint` stays green.
  - Logs: `npx wrangler tail multimage-astro --format json`; useful fields are `cpuTime`, `wallTime`, `entrypoint` and `event.request.url`. The tail drops events under a burst: count outcomes from HTTP answers, use the tail for per-page fields.
  - Files under `public/` are served by Workers Assets before the Worker runs: the middleware cache policy never applies to them and they leave no tail event. Set their headers with `_headers`.
- Vercel builds on Node 24.x with the Vercel project Node setting kept on 24.x to match `engines.node` (`24.x`) in `package.json` and `.nvmrc` (local work). `.vercelignore` keeps `.env*` (plus `dist/`, `.astro/`, `.claude/`) out of CLI uploads (`vercel deploy`).
- `npm run dev` chains `npm run sync-datocms` before `astro dev`, ensuring `schema.ts` and `docs/DATOCMS.md` stay in sync when `DATOCMS_API_TOKEN` is available.
- `npm run prebuild` currently rebuilds the Site Search client before `npm run build` invokes `astro check` and the production build.
- Local checks use `astro dev` (`npm run dev`). `astro preview` does not work with `@astrojs/vercel`, so no preview script is provided. ISR caching is a Vercel CDN feature and Workers Cache runs only on a deployed Worker, so neither is active locally; see `docs/guidelines/caching.md` for the revalidation checks. Under an AI agent, Astro 7 `astro dev` starts in the background (stop it with `npx astro dev stop`), and `--ignore-lock` keeps a one-off foreground server.
- `tmp-sample/` is a read-only Astro starter kept in the repo for reference. It is excluded via `tsconfig.json` so `astro check`/`npm run build` ignore its missing React dependencies.

## Environment & Secrets

- Required env vars on Vercel: `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`, and `NODE_ENV=production`. `DATOCMS_CMA_TOKEN` and `SITE_SEARCH_BUILD_TRIGGER_ID` are runtime variables on Vercel too (Site Search reindex in `/api/revalidate`, `/api/seo-analysis`): without them the reindex is off and SEO analysis returns 500. The CLI-only `DATOCMS_API_TOKEN` can remain local unless schema generation runs in CI. `BYPASS_TOKEN` is Vercel-only (ISR bypass and revalidation header).
- Worker secrets on Cloudflare (set with `wrangler secret put <NAME>`, see `security.md`): `CACHE_INVALIDATION_WEBHOOK_SECRET`, `DATOCMS_BASE_EDITING_URL`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DRAFT_MODE_COOKIE_NAME`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`. There is no `BYPASS_TOKEN` on the Worker. `DATOCMS_CMA_TOKEN` (SEO analysis, Site Search reindex) and `SITE_SEARCH_BUILD_TRIGGER_ID` are set on switch day, not on the trial Worker.
- `datocms.json` enumerates the CDA/CMA tokens used during automation; keep it updated when tokens rotate so `vercel env pull` stays in sync.
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` ships to the browser; provision it from a role limited to **Perform Site Search API calls** to prevent privileged access. See `docs/guidelines/security.md` for scoping details.
- Runtime also reads standard flags (`NODE_ENV`, `CI`, `CONTINUOUS_INTEGRATION`, `VERCEL`). Only set what the deploy target actually needs to keep the surface minimal.
- `PUBLIC_SITE_URL` powers sitemap generation and absolute links; missing values break `/src/pages/sitemap.xml.ts`. It is inlined at build time, so the Cloudflare build must run with the production value in the env file.

## Preview & Drafts

- `/api/preview` ora gestisce l’ingresso in Draft Mode firmando il cookie e reindirizzando alla rotta desiderata. `/api/draft-mode/enable|disable` vengono usate dal plugin DatoCMS Web Previews per generare i link “Draft/Published”.
- `executeQuery` accetta `{ includeDrafts: true }` e grazie a `resolveDraftMode(Astro)` (vedi `~/lib/draftPreview`) legge i cookie su ogni richiesta: il cookie di Draft Mode fa saltare la cache ISR sulla stessa deployment.
- `/api/post-deploy` è invocato automaticamente da Vercel (via `datocms.json`) ed è **solo Vercel**: su Cloudflare non esiste un hook di deploy equivalente, quindi plugin e URL di anteprima si controllano a mano nel passo 9 di `docs/guidelines/cloudflare-switch.md`. Si occupa di installare/aggiornare plug-in ufficiali DatoCMS:
  - **Web Previews** → aggiunge due frontends (Production + Preview) che puntano a `/api/preview-links?token=...`.
  - **SEO/Readability Analysis** → punta `htmlGeneratorUrl` al `/api/seo-analysis` dell’ambiente corrente.
  Se il post-deploy fallisce (es. perché il plug-in è già installato con permessi diversi) puoi rilanciarlo manualmente con `curl -X POST <deploy-url>/api/post-deploy -H 'Content-Type: application/json' -d '{"datocmsApiToken":"<CMA>","frontendUrl":"<deploy-url>"}'` (usa un CMA token “Admin”).

## Monitoring & Logging

- Client monitoring uses Google Analytics (legacy UA) only; Vercel Analytics and Speed Insights were removed on 2026-11-22, on both targets.
- Server side: on Vercel there is no logging or alerting beyond `vercel logs`. On Cloudflare, Workers observability is on (`observability.enabled` in `wrangler.jsonc`: logs in the dashboard, `wrangler tail` live).
- The `/llms-full.txt` export route was removed (2026-06-20); no exporter to maintain.

## Testing & Automation

- No CI workflow runs `astro check`, linting, or builds. Add GitHub Actions (or Vercel checks) to execute at least `npm run lint` and `npm run build` on pull requests.
- `npm run test` chains `npm run format` → `npm run lint` (Prettier `--check`) → `npm run build`. This covers formatting and build health but not unit coverage.
- Utilities like `src/pages/cerca/search-page.client.ts` and the staff CSV helpers have zero unit tests; start with Vitest for pure helpers and DOM tests for CSV/search scripts.
- GraphQL queries rely on build-time validation. Consider lightweight contract tests that mock `executeQuery` responses so schema drift is caught earlier.
