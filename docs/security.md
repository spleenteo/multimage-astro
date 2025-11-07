---
agent_edit: true
scope: Track security risks, mitigations, and review checkpoints for Multimage.
---

# Security Overview

## Critical Findings

- **Rich-text XSS (CWE-79)** — `toRichTextHtml` returns raw CMS HTML and multiple templates bind the result with `set:html`, so any editor-provided `<script>` executes for visitors. Harden `src/lib/text.ts:65-95`, audit `src/pages/index.astro:345-355`, `src/components/SupplierCard/index.astro:71-139`, and `src/pages/autori/[slug]/index.astro:138-158` to use Structured Text renderers or sanitize output.
- **Catalog data exposure (CWE-200)** — The `/staff` routes are prerendered static pages without auth, exposing inventory details and CSV exports. `robots.txt` cannot protect `src/pages/staff/index.astro` or `src/pages/staff/archivio-catalogo/index.astro`, so relocate or secure them before deploy.

## High-Priority Gaps

- **Preview tokens without guardrails** — There is no `/api/preview` or draft-mode guard yet; every fetch in `src/lib/datocms/executeQuery.ts` uses the published CDA token. When draft previews are reintroduced, enforce signed secrets and per-request token switching.
- **Unbounded CSV export** — The staff CSV button currently serializes the full catalogue on the client (`src/pages/staff/archivio-catalogo/index.astro:200-317`). Even after the page is secured, validate user roles and strip fields that should never leave the CMS.

## Additional Observations

- **Third-party scripts** — Google Analytics, Iubenda, and Vercel analytics are injected inline in `src/layouts/BaseLayout.astro:132-210` with no integrity hints. Load them with `async`/`defer`, monitor outages, and keep the snippet list minimal.
- **LLM export** — `dist/llms-full.txt` republishes long-form bios and emails via `src/pages/llms-full.txt.ts`. Confirm stakeholders are comfortable sharing that corpus publicly before enabling crawlers.
- **Environment documentation** — `.env.example` only mentions the published CDA token; document draft/CMA tokens separately so engineers do not reuse privileged keys accidentally.
- **Search token scoping** — Ensure `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN` is created with a Site Search–only role. Admin/CMA tokens must never be exposed because the value ships to the browser (`src/pages/cerca/index.astro:6-78`).
