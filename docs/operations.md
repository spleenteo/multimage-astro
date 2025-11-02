**Deployments**

- Default deployment target is Vercel; README documents linking the repo, syncing env vars, and running `vercel deploy --prod`; build command is `npm run build` with static output in `dist/` (README.md:57-80, astro.config.mjs:1-18).
- A `wrangler.toml` is present for Cloudflare Pages with `pages_build_output_dir = "./dist"`, but there is no Cloudflare adapter configured, so deployments there remain manual (wrangler.toml:1-3).

**Environment & Secrets**

- DatoCMS tokens (`DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`, `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`, `DATOCMS_CMA_TOKEN`) plus webhook secrets (`SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `DRAFT_MODE_COOKIE_NAME`) are declared in datocms.json but only the published token is enforced via Astro’s env schema (datocms.json:1-31, astro.config.mjs:6-16).
- Public runtime expects `PUBLIC_SITE_URL` for sitemap URLs and `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` for the client search page; missing values throw at build time (src/pages/sitemap.xml.ts:5-44, src/pages/cerca/index.astro:6-28).

**Preview & Drafts**

- There is no `/api/preview` endpoint, DraftMode toggler, or QueryListener implementation even though AGENTS.md calls for them; as a result editors cannot trigger draft previews or live updates (AGENTS.md:73-89, src/lib/datocms/executeQuery.ts:13-26).
- `executeQuery` always uses the published CDA token, so draft mode cannot be enabled without code changes; this also prevents secure gating of preview tokens (src/lib/datocms/executeQuery.ts:13-26).

**Monitoring & Logging**

- Client monitoring relies on Google Analytics (legacy UA), Vercel Analytics, and Vercel Speed Insights; there is no server-side logging, error tracking, or health checks configured (src/layouts/BaseLayout.astro:132-210).
- No CI/CD workflow exists to run builds before deployment; deployments rely on developers running `npm run build` manually as per README instructions (README.md:49-66).

**Gaps & Recommendations**

- Protect the `/staff` routes before deploying; add authentication middleware or move the catalogue export into a secured API function (src/pages/staff/index.astro:1-55).
- Document required environment variables in a dedicated ops runbook and add validation for draft/CMA tokens similar to the published token check (astro.config.mjs:6-16, .env.example:1-3).
- Automate schema generation within CI using guarded scripts to avoid surprises from `npm install` running `npx datocms` without credentials (scripts/prepare.mjs:36-68, package.json:18-20).
