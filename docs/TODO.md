---
agent_edit: true
scope: Codex adds things to be done as a list of tasks, suggestions, urgencies
---

> **Assumptions**
> - `docs/accessibility.md`, `docs/cms-content-modelling.md`, `docs/cms-data-loading.md`, `docs/decision-log/README.md`, `docs/seo.md`, and `docs/testing.md` remain `agent_edit: false`, so remediation work is tracked here until the frontmatter is updated (see Documentation Hygiene task **DH1**).

## Security
- [ ] [Security] [Impact: H] [Effort: M] [Owner: @codex] [Status: todo] — **S1** lock down `/staff` and `/staff/archivio-catalogo` so catalog exports require auth (Due: 2025-11-21; Acceptance: routes return 401 unless a signed cookie/session is present, robots.txt is not the only guard, docs/project-structure.md#route-map--data-flow updated once permissions ship).
- [ ] [Security] [Impact: H] [Effort: M] [Owner: @codex] [Status: todo] — **S2** sanitize every `set:html` surface fed by `toRichTextHtml` (home hero, BannerSection, Cta blocks, book descriptions, supplier bios) (Due: 2025-12-05; Acceptance: introduce a shared HTML sanitizer, add regression tests for script injection, cross-reference docs/assets.md#html-fragments--sanitization).
- [ ] [Security] [Impact: M] [Effort: M] [Owner: @codex] [Status: todo] — **S3** add CSP/SRI + bundle integrity for Iconify, GA, Iubenda, and `/generated/*.js` (Due: 2025-11-28; Acceptance: BaseLayout emits CSP headers + `<script>` hashes, `/cerca` verifies generated bundles exist before booting, see docs/assets.md and docs/search.md).
- [ ] [Security] [Impact: H] [Effort: M] [Owner: @codex] [Status: todo] — **S4** gate `/llms-full.txt` behind a tokenized endpoint or remove it from the public build (Due: 2025-11-28; Acceptance: anonymous visitors cannot download the full catalog + biographies, docs/project-structure.md#route-map--data-flow reflects the new flow).

## Code Health
- [ ] [Refactoring] [Impact: M] [Effort: M] [Owner: @codex] [Status: todo] — **CH1** extract the inline CSV exporter in `src/pages/staff/archivio-catalogo/index.astro` into a tested helper shared with future staff tools (Due: 2025-11-25; Acceptance: helper lives under `src/lib` or `scripts/`, unit tests cover escaping/UTF-8 BOM, docs/list-helpers.md entry updated).
- [ ] [Refactoring] [Impact: M] [Effort: L] [Owner: @codex] [Status: todo] — **CH2** add runtime assertions (and unit tests) that `/cerca` receives valid `data-*` config before wiring listeners to avoid silent failures when the token/min-length is missing (Due: 2025-11-18; Acceptance: search bundle throws a descriptive error, tests live next to `search-page.client.ts`).

## Accessibility
- [ ] [Accessibility] [Impact: M] [Effort: M] [Owner: @codex] [Status: todo] — **A11Y1** run a WCAG 2.1 AA keyboard + screen reader audit on BookCarouselSection, `/cerca`, and staff tables, then document findings once `docs/accessibility.md` is editable (Due: 2025-12-02; Acceptance: issues logged with repro steps, aria attributes adjusted as needed, docs/TODO cross-linked when docs open up).
- [ ] [Accessibility] [Impact: M] [Effort: L] [Owner: @codex] [Status: todo] — **A11Y2** add a skip link + landmark outline to BaseLayout so users can jump past the persistent header stacks (Due: 2025-11-25; Acceptance: `<a href="#main">` (or similar) is focus-visible, BaseLayout exposes `<main id="main">`, documented in docs/project-structure.md).

## SEO
- [ ] [SEO] [Impact: M] [Effort: L] [Owner: @codex] [Status: todo] — **SEO1** enforce `PUBLIC_SITE_URL` (or `astro.config.site`) during builds so `sitemap.xml` and canonical URLs never fall back to `http://localhost:4321` (Due: 2025-11-18; Acceptance: build fails with a clear error when the env is missing, docs/assets.md and docs/project-structure.md reference the requirement).

## CMS/Data
- [ ] [Features] [Impact: M] [Effort: M] [Owner: @codex] [Status: todo] — **CD1** restore preview/draft mode by teaching `executeQuery` to honor `includeDrafts` + alternate CDA tokens, then wiring `/api/preview` + DraftMode toggles (Due: 2025-11-28; Acceptance: preview cookies flip the token, docs/list-helpers.md and docs/project-structure.md updated, regression tests cover both modes).
- [ ] [Refactoring] [Impact: M] [Effort: H] [Owner: @codex] [Status: todo] — **CD2** replace ad-hoc `first: 500` GraphQL calls with paginated loaders + cache tags for books, authors, sitemap, and staff exports (Due: 2025-12-05; Acceptance: helpers accept `first/skip`, sitemap iterates pages, staff exports stream data in batches, docs/list-models.md reflects the new approach).

## Testing / CI
- [ ] [Testing] [Impact: M] [Effort: L] [Owner: @codex] [Status: todo] — **TC1** add a GitHub Action (or Vercel check) that runs `npm run lint` + `npm run build` on every PR (Due: 2025-11-14; Acceptance: workflow file lives under `.github/workflows`, failures block merges, README/docs/testing.md updated once editable).
- [ ] [Testing] [Impact: M] [Effort: M] [Owner: @codex] [Status: todo] — **TC2** create targeted tests for `search-page.client.ts` (debounce, filters, exact match) and the extracted CSV helper (Due: 2025-11-28; Acceptance: tests run via `npm test`, cover success + error paths, referenced in docs/search.md and docs/list-helpers.md).

## i18n
- No open work — Multimage confirmed the site will remain permanently Italian-only (see docs/i18n.md).

## Project Structure
- [ ] [Refactoring] [Impact: M] [Effort: L] [Owner: @codex] [Status: todo] — **PS1** add a prebuild verification that fails the build when `public/generated/search-page.client.js` or `swiper-element.js` are missing or stale (Due: 2025-11-18; Acceptance: CI step or `astro build` guard runs before deployment, docs/assets.md and docs/project-structure.md updated).
- [ ] [Refactoring] [Impact: M] [Effort: L] [Owner: @codex] [Status: todo] — **PS2** fix `LinkToRecord.astro` so `BlogPostRecord` links point to `/magazine/${slug}` and add coverage to stop regressions (Due: 2025-11-21; Acceptance: Structured Text links resolve correctly, docs/list-components.md#structured-text-blocks annotated, regression test in place).
- [ ] [Refactoring] [Impact: M] [Effort: M] [Owner: @codex] [Status: todo] — **PS3** either implement Draft Mode (UI + `/api` routes) or delete the empty `src/components/DraftMode*/` directories to avoid future confusion (Due: 2025-11-28; Acceptance: directories contain working components or are removed, docs/list-components.md updated).

## Documentation Hygiene
- [ ] [Documentation] [Impact: M] [Effort: L] [Owner: @codex] [Status: todo] — **DH1** coordinate with maintainers to flip `agent_edit: true` on the locked policy docs (accessibility, cms-content-modelling, cms-data-loading, decision log, SEO, testing) (Due: 2025-11-18; Acceptance: frontmatter updated via maintainer PR, tracked in docs/decision-log once editing is allowed).
- [ ] [Documentation] [Impact: L] [Effort: M] [Owner: @codex] [Status: todo] — **DH2** add a lightweight script or checklist to verify `docs/list-*` files stay in sync with the filesystem (Due: 2025-12-05; Acceptance: script lives under `scripts/` or package.json, runs in CI, prevents stale inventories).

## Completed
- [x] [Features] [Impact: M] [Effort: M] [Owner: @codex] [Status: done] — **I18N1** (Completed: 2025-11-07) — Scope officially locked to a single Italian locale, so the planned localization architecture was retired and docs/i18n.md now records the decision instead of future work.
