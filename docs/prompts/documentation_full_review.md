### Role
Act as an experienced Astro + TypeScript principal engineer with deep expertise in security, documentation hygiene, DatoCMS (GraphQL), accessibility, SEO, and CI/CD.

### Task
Perform a full repository audit based on the guidelines and documentation under `/docs/*` for an Astro application: identify security and code-health issues, validate the component/helper inventory from `/docs/list-*`, and compile `/docs/TODO.md` exactly as instructed by `AGENTS.md`, updating only the existing docs listed below.

Don't use markdown tables, prefer bullets lists or more convenient style.

### Context
- Repository scope: whole project, with emphasis on Astro front-end, content fetching, build/runtime configs, and `/docs/*`.
- Docs that MUST be updated (modify only these; do NOT create new files or folders):
  - Decision log → `/docs/decision-log.md`
  - Accessibility → `/docs/guidelines/accessibility.md`
  - Assets (responsive images, video, icons) → `/docs/guidelines/assets.md`
  - How to manage blocks and components (incl. DatoCMS naming conventions) → `/docs/guidelines/cms-content-modelling.md`
  - How to fetch content from the CMS via GraphQL → `/docs/guidelines/cms-data-loading.md`
  - Project structure rules → `/docs/guidelines/project-structure.md`
  - Translations / multilingual → `/docs/guidelines/i18n.md`
  - SEO setup → `/docs/guidelines/seo.md`
  - DatoCMS search system → `/docs/guidelines/search.md`
  - How to test the application → `/docs/guidelines/testing.md`
  - Components catalogue & usage → `/docs/list-components.md`
  - Helper functions catalogue → `/docs/list-helpers.md`
  - Models and pages catalogue → `/docs/list-models.md`
  - Suggested tasks (owner/priorities from AGENTS) → `/docs/TODO.md`
- Reference rules/sources in repo:
  - `/docs/AGENTS.md` — authoritative structure for `/docs/TODO.md` (owners, priorities, SLAs, acceptance criteria).
  - Any security/engineering guidelines found under `/docs/*` — treat as policy.
  - Code areas likely relevant: `src/**`, `astro.config.*`, `tsconfig.*`, `eslint/prettier configs`, `public/**`, `package.json`, lockfiles, workflows under `.github/**` or CI, edge adapters, CMS GraphQL queries/fragments, image pipelines, i18n routing.
- Constraints:
  - **Do not** create any new repo, directories, or files. Only edit the **existing** doc files listed above.
  - Assume offline execution after the Setup Script; no external network calls.
  - Preserve existing formatting conventions within each doc (headings/TOC/front-matter).

### Expected Output
- Provide a **single unified diff patch** that updates only the listed docs, reflecting the audit results:
  1. `/docs/TODO.md`: revised as per `AGENTS.md` with prioritized tasks, owners, due dates/SLAs, acceptance criteria, and cross-links to the other updated docs. Group tasks into Security, Code Health, Accessibility, SEO, CMS/Data, Testing/CI, i18n, Project Structure, and Documentation Hygiene.
  2. `/docs/list-components.md`, `/docs/list-helpers.md`, `/docs/list-models.md`: verified inventories that match the codebase (name, path, purpose, props/signatures, usage locations, owners). Flag drift and deprecated items inline with short rationales.
  3. `/docs/guidelines/accessibility.md`: concrete checklist status (WCAG mappings), known violations, test approach (keyboard/AT), and remediation tasks (cross-referenced in `/docs/TODO.md`).
  4. `/docs/guidelines/assets.md`: document current image/video/icon strategy (Astro `<Image/>` or integrations), responsive sourcesets, formats, AVIF/WebP/fallbacks, cache policy, and any gaps (e.g., missing width/height, lazy-loading strategy, LQIP).
  5. `/docs/guidelines/cms-content-modelling.md`: confirm DatoCMS naming conventions, blocks/components mapping, validation rules, slugs, and versioning. Note mismatches vs code (fields used but not modeled, or vice-versa).
  6. `/docs/guidelines/cms-data-loading.md`: GraphQL patterns, fragments, pagination, revalidation/ISR/SWR choices, error handling, type generation, and query performance tips; include examples from current code where possible.
  7. `/docs/guidelines/project-structure.md`: enforce rules (layering, import boundaries, file colocations, naming, barrel usage) and list any violations to fix.
  8. `/docs/guidelines/i18n.md`: locales, routing rules, canonical/alternate links, translation workflow, missing keys detection, RTL considerations.
  9. `/docs/guidelines/seo.md`: meta defaults, OG/Twitter tags, sitemaps, robots, canonical/altLang, structured data, Core Web Vitals levers. Note gaps and planned fixes.
  10. `/docs/guidelines/search.md`: DatoCMS search indexing flow, fields, update triggers, ranking/typos, client querying; note missing fields or sync issues.
  11. `/docs/guidelines/testing.md`: unit/e2e strategy, fixtures/mocks for GraphQL, a11y checks, visual regression, performance budgets, and CI gates; add concrete commands that exist in `package.json`.
  12. `/docs/decision-log.md`: add entries for any policy choices changed/confirmed during this audit (date, context, decision, alternatives, consequences).
- Keep the patch ≤ 500 added lines total; if more detail is needed, summarize and link to existing sections within those docs rather than adding new files.

### Guidance for Codex
1. **Plan → Code (Structured CoT)**  
   - Read `/docs/AGENTS.md` to extract the exact required structure for `/docs/TODO.md`.  
   - Parse `/docs/list-*` to build a ground-truth inventory, then scan `src/**` to detect mismatches (components/helpers/models that are unused, undocumented, or missing).  
   - Perform a security static pass tailored to Astro:
     - **Inputs & Templating**: XSS (HTML/MDX rendering, unescaped `set:html`), injection in dynamic routes, user-supplied data in props.
     - **Headers/Policies**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy; check adapter’s support (Node/Static/Edge).
     - **AuthN/AuthZ** (if present): session/cookies flags (Secure, HttpOnly, SameSite), CSRF for mutations, JWT validation.
     - **SSRF/Fetch**: external fetch hardening, timeouts, deny-lists/allow-lists, GraphQL endpoint protection.
     - **Secrets**: presence in repo, env var handling, `.env` hygiene, build vs runtime exposure.
     - **File handling**: image upload validations, path traversal, MIME sniffing.
     - **3rd-party deps**: lockfile integrity, known risky packages, post-install scripts, supply-chain checks.
   - **Code health**: lint/format adherence, circular deps, layering violations, dead code, error handling, logging/PII redaction, bundle size/perf, Astro islands usage, assets bloat, DX scripts.
   - **Synthesize**: Map findings to actionable items in `/docs/TODO.md` with owner, priority, SLA, and acceptance criteria that reference the exact doc/section to adjust.
2. **Self-critique loop (once)**  
   - Re-check that `/docs/TODO.md` exactly follows `AGENTS.md` (section order, field names).  
   - Ensure no new files/folders are introduced and the diff only touches the listed docs.  
   - Tighten vague tasks into testable acceptance criteria.
3. **Clarifications**  
   - If a required field/template from `AGENTS.md` is missing, note the assumption **inline at the top of `/docs/TODO.md`** in a short “Assumptions” block and proceed.
4. **Bound the output**  
   - Keep the unified diff succinct; move lengthy rationales into concise bullet points inside the existing docs rather than expanding with new sections.
5. **Safety & privacy**  
   - Replace any discovered secrets with `<REDACTED>` in docs and add rotation tasks in `/docs/TODO.md`.
