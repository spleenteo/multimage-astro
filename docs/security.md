**Critical Findings**
- CWE-79 (Reflected/Stored XSS) — `toRichTextHtml` returns raw CMS HTML when the string “looks like” markup, and multiple components feed that directly into `set:html`; a malicious editor could inject `<script>` that executes for every visitor (src/lib/text.ts:65-95, src/pages/index.astro:345-355, src/components/SupplierCard/index.astro:71-139, src/pages/autori/[slug]/index.astro:138-158).
- CWE-200 (Information Exposure) — The “Area staff” pages are prerendered static routes with no authentication, exposing full catalog data including stock counts and internal metadata; `robots.txt` cannot prevent direct access (src/pages/staff/index.astro:1-55, src/pages/staff/archivio-catalogo/index.astro:1-317, public/robots.txt:1).

**High Priority**
- Preview security gap — There is no `/api/preview` route or draft-mode guard; all fetches use the published CDA token, so anyone with a draft token would need to alter code locally, and preview mode cannot be restricted or signed (src/lib/datocms/executeQuery.ts:13-26, AGENTS.md:83-89).
- Excessive CSV export — The staff CSV button generates downloadable files client-side with all catalog metadata; even if the page is later secured, ensure downloads respect auth and avoid exposing secrets such as unpublished pricing (src/pages/staff/archivio-catalogo/index.astro:200-317).

**Additional Observations**
- Third-party scripts (Google Analytics, Iubenda, Vercel analytics) are injected inline without integrity attributes; monitor their availability and consider deferring non-critical scripts to reduce the attack surface (src/layouts/BaseLayout.astro:132-210).
- `public/LLMs.md` intentionally republishes large slices of content, including author bios and contact mailto links; confirm that this dataset is acceptable for open distribution and redact sensitive fields if needed (public/LLMs.md, scripts/generate-llms.mjs:5-238).
- Environment tokens are read via Astro’s env schema, but `.env.example` only documents the published CDA token; document the draft and CMA tokens separately to reduce misconfiguration risk (astro.config.mjs:6-16, .env.example:1-3).
