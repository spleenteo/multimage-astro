**Current State**

- There is no automated test suite; the repo relies on `astro check`, build, and manual QA per AGENTS.md (package.json:14-21, AGENTS.md:45-60).
- No GitHub Actions or other CI workflows execute linting or builds, so regressions can land unnoticed (project lacks `.github/workflows`).

**Gaps**

- GraphQL queries are unvalidated at runtime; schema drift will only surface during builds, and preview mode cannot be smoke-tested without automation (src/lib/datocms/executeQuery.ts:13-26).
- Client search logic and CSV export scripts lack unit coverage, despite containing non-trivial parsing/formatting code (src/pages/cerca/search-page.client.ts:1-220, src/pages/staff/archivio-catalogo/index.astro:200-317).
- No accessibility or visual regression tests exist for high-traffic routes like `/` or `/libri`.

**Suggested Plan**

- Add a CI pipeline that runs `npm run lint`, `npm run build`, and (once added) component tests on pull requests.
- Introduce lightweight Vitest suites for pure utilities (authors/books formatting, structured text helpers) and Jest-like DOM tests for search CSV helpers where feasible.
- Incorporate GraphQL contract tests using generated types to assert required fields (e.g., map fragments through `executeQuery` with mocked responses) before deploying schema changes.
- Schedule manual checks for DatoCMS draft previews until automated preview coverage is implemented.
