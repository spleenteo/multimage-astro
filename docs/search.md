---
agent_edit: true
scope: Living description of Multimage search infrastructure
---

# Search — Current State (2025-11-16)

- Search uses DatoCMS Site Search. `/cerca/index.astro` renders an accessible form and lazy-loads `public/generated/search-page.client.js`, which talks directly to the Site Search endpoint using `PUBLIC_DATOCMS_SITE_SEARCH_API_TOKEN`.
- The bundled client applies debounced queries, renders grouped filters, and expects configuration via `data-*` attributes (token, endpoint, min length, fuzzy toggle). Missing config currently fails silently (docs/TODO.md **CH2**).
- Search results rely on highlight snippets returned by Dato; client-side code escapes `[h]...[/h]` markers into `<mark>` elements before injecting HTML.
- Indexing stays in sync through Dato’s automatic updates; there is no custom webhook pipeline.

Implementation best practices and field mappings are stored in `/docs/guidelines/search.md`.
