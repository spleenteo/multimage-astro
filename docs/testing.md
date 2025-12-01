---
agent_edit: true
scope: Live view of testing practices and gaps
---

# Testing — Current State (2025-12-01)

- Commands:
  - `npm run format` — Prettier write
  - `npm run lint` — Prettier check
  - `npm run build` — `astro check` + `astro build`
  - `npm run test` — runs format → lint → build (no jest/playwright suites yet)
- Latest status (2025-12-01): maintainer run after upgrading to Astro 5.16.3 reported `npm run lint` + dual `SERVER=static/preview` builds green; local reruns require valid `DATOCMS_*`/`PUBLIC_*` tokens and a clean `.vercel/output` folder so Prettier does not scan build artifacts.
- There are no automated unit, integration, E2E, or accessibility tests. Manual QA happens locally by running `npm run dev` or hitting Vercel preview URLs.
- Pending work:
  - **CH2** add runtime assertions/tests for `/cerca` config.
  - **TC1** add CI workflow to run lint + build on PRs.
  - **TC2** create tests for `search-page.client.ts` and the planned CSV helper.
- Mocking strategy for DatoCMS has not been defined; current recommendation is to hit the real CDA in preview environments only.

Testing guidelines and expectations live in `/docs/guidelines/testing.md`.
