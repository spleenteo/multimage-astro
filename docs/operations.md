---
agent_edit: true
scope: Living runbook for builds, deployments, and secrets
---

# Operations — Current State (2025-11-16)

- Hosting: two Vercel projects share this repo. Production builds with `SERVER=static` (pure SSG) while the preview project uses `SERVER=preview` for SSR + Draft Mode.
- Environment variables: required secrets (`DATOCMS_*`, `SECRET_API_TOKEN`, `SIGNED_COOKIE_JWT_SECRET`, `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`, `PUBLIC_SITE_URL`, optional `DRAFT_MODE_COOKIE_NAME`) must be set per Vercel environment. CLI-specific `DATOCMS_API_TOKEN`/`DATOCMS_CMA_TOKEN` stay local unless CI needs schema generation.
- Tooling: `npm run dev` runs `npm run sync-datocms` automatically; `npm run build` executes `astro check` then the adapter build, preceded by `npm run prebuild`.
- Preview workflow: editors hit `/api/preview` or the Web Preview plugin to enable cookies, then browse the preview deployment (SSR) for live drafts. Production remains static and ignores draft cookies.
- Monitoring: rely on Vercel Analytics + Speed Insights plus DatoCMS logs; no separate observability stack is configured.

Operational policies live in `/docs/guidelines/operations.md`.
