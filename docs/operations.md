---
agent_edit: true
scope: Describe how Multimage is built, deployed, and configured across environments.
---

# Operations Runbook

## Deployments

- Vercel is the single supported target: link the repo, sync environment variables, and use `npm run build` (static output lives in `dist/`).
- `npm run dev` chains `npm run sync-datocms` before `astro dev`, ensuring `schema.ts` and `docs/DATOCMS.md` stay in sync when `DATOCMS_API_TOKEN` is available.
- `npm run prebuild` currently rebuilds the Site Search client before `npm run build` invokes `astro check` and the production build.

## Environment & Secrets

- Required env vars on Vercel: `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`, and `NODE_ENV=production`. CLI-specific `DATOCMS_API_TOKEN` can remain local.
- `datocms.json` enumerates the CDA/CMA tokens used during automation; keep it updated when tokens rotate.
- Draft (`DATOCMS_DRAFT_CONTENT_CDA_TOKEN`) and preview secrets should stay out of Vercel until `/api/preview` is implemented. When added, scope them to draft-only roles.
- `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` is bundled into the browser; provision it from a role limited to **Perform Site Search API calls** to prevent privileged access. See `docs/security.md` for scoping details.
- Runtime also reads standard flags (`NODE_ENV`, `CI`, `CONTINUOUS_INTEGRATION`, `VERCEL`). Only set what the deploy target actually needs to keep the surface minimal.
- `PUBLIC_SITE_URL` powers sitemap generation and absolute links; missing values break `/src/pages/sitemap.xml.ts`.

## Preview & Drafts

- `/api/preview` and Draft Mode helpers are still TODO. Once implemented, guard the endpoint with a secret, toggle Draft Mode cookies, and call `executeQuery({ includeDrafts: true })` so editors can see unpublished content.
- `executeQuery` must select between the published and draft CDA tokens. Today it always picks the published token, preventing secure previews.
- Add Draft Mode UI: `DraftModeToggler`, `DraftModeQueryListener`, and guard components that should only render behind preview.

## Monitoring & Logging

- Client monitoring uses Google Analytics (legacy UA), `@vercel/analytics`, and `@vercel/speed-insights`. There is no server-side logging or alerting yet.
- `llms-full.txt` is generated during the build; track CDA rate limits and document any schema changes that require updates to the exporter (`src/pages/llms-full.txt.ts`).

## Testing & Automation

- No CI workflow runs `astro check`, linting, or builds. Add GitHub Actions (or Vercel checks) to execute at least `npm run lint` and `npm run build` on pull requests.
- `npm run test` chains `npm run format` → `npm run lint` (Prettier `--check`) → `npm run build`. This covers formatting and build health but not unit coverage.
- Utilities like `src/pages/cerca/search-page.client.ts` and the staff CSV helpers have zero unit tests; start with Vitest for pure helpers and DOM tests for CSV/search scripts.
- GraphQL queries rely on build-time validation. Consider lightweight contract tests that mock `executeQuery` responses so schema drift is caught earlier.
