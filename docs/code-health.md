---
agent_edit: true
scope: Status of linting, formatting, and maintainability tasks
---

# Code Health — Current State (2025-11-16)

- Formatting relies on Prettier (`npm run format`) plus `prettier-plugin-astro`; there is no ESLint config yet.
- `npm run test` chains format → lint → build; no unit/e2e suites exist, so the “test” step simply re-runs prettier and the production build.
- Known refactors:
  - **CH1** extract the CSV exporter (staff archive) into a helper with tests.
  - **CH2** add runtime assertions/tests for `/cerca` data attributes.
- `tsconfig.json` uses `baseUrl` + path aliases and enables `allowImportingTsExtensions` for `_graphql.ts`; there is no project references setup.
- Observability/logging currently limited to `console.log` inside `/api/preview` and error dumps in `/api/utils`.

Guiding principles live in `/docs/guidelines/code-health.md`; adjust this file as new debt is paid.
