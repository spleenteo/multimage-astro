---
agent_edit: true
scope: Live SEO implementation details
---

# SEO — Current State (2025-11-16)

- Canonical base URL: `astro.config.mjs` sets `site = 'https://www.multimage.org'`; `PUBLIC_SITE_URL` must also be present (docs/TODO.md **SEO1**).
- Meta defaults come from `src/lib/seo.ts`, which merges page-specific SEO fields from Dato with fallback copy; Structured Data snippets are not yet implemented (**SEO2**).
- `sitemap.xml.ts` pulls data via GraphQL and prerenders during builds; still limited to single-locale `it` URLs.
- Robots/crawl directives rely on `public/robots.txt` (not auto-generated).
- Open Graph/Twitter tags reuse the SEO helper and Dato fields; there is no image fallback beyond the ones provided by Dato.
- Core Web Vitals monitoring uses Vercel Analytics; no custom RUM instrumentation is wired up.

Strategy, requirements, and checklists live in `/docs/guidelines/seo.md`.
